"use client";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { ApiError, fetchDepartments, fetchEmployeeById, fetchSectionsByDepartment, upsertEmployee } from "@/app/employee/api";
import type { Department, Section } from "@/app/employee/types";
import NewEmployeeDialogView from "./NewEmployeeDialogView";

/**
 * Canonical shape of the form. Keeping it centralized ensures both create and
 * edit flows derive from the same source of truth and makes resets predictable.
 */
export type FormState = {
  empNo: string;
  name: string;
  dob: string;
  age: number;
  departmentId: string;
  sectionId: string;
  email: string;
  basicSalary: string;
  travelAllowance: string;
  otherAllowance: string;
  totalSalary: number;
  active: boolean;
};

type SubmissionState = "idle" | "submitting";

export type Option = {
  label: string;
  value: string;
  status?: number;
  disabled?: boolean;
};
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const initialState: FormState = {
  empNo: "",
  name: "",
  dob: "",
  age: 0,
  departmentId: "",
  sectionId: "",
  email: "",
  basicSalary: "",
  travelAllowance: "",
  otherAllowance: "",
  totalSalary: 0,
  active: true,
};

const trackedFormFields: Array<keyof FormState> = [
  "empNo",
  "name",
  "dob",
  "departmentId",
  "sectionId",
  "email",
  "basicSalary",
  "travelAllowance",
  "otherAllowance",
  "active",
];

const DUPLICATE_EMP_NO_MESSAGE = "This employee number has already been used.";
const isDuplicateEmpNoError = (value?: string | null) => {
  if (!value) return false;
  const normalized = value.toLowerCase();
  if (normalized.includes("illegalargumentexception") && normalized.includes("employee number")) {
    return true;
  }

  const duplicatePatterns = [
    "employee number already exists",
    "employee number already used",
    "employee number has already been used",
    "employee number has already been taken",
    "duplicate empno",
    "duplicate entry",
    "unique constraint",
  ];

  if (duplicatePatterns.some((pattern) => normalized.includes(pattern))) {
    return true;
  }

  if (/employee\s+number.*already.*used/.test(normalized)) {
    return true;
  }

  return false;
};

const resolveEmployeeSaveError = (status: number, message?: string) => {
  if (status === 409 || isDuplicateEmpNoError(message)) {
    return DUPLICATE_EMP_NO_MESSAGE;
  }

  const fallback =
    status >= 500
      ? "Failed to save employee. Please try again later."
      : `Failed to save employee (${status}).`;

  if (!message) {
    return status === 400
      ? "Unable to save employee. Please review the form and correct any errors."
      : fallback;
  }

  const normalized = message.toLowerCase();
  if (status === 400 || normalized.includes("bad request")) {
    return "Unable to save employee. Please review the form and correct any errors.";
  }

  return message;
};

const MINIMUM_EMPLOYEE_AGE = 18;
const getAgeValidationMessage = (age: number) =>
  age > 0 && age < MINIMUM_EMPLOYEE_AGE
    ? `Employees must be at least ${MINIMUM_EMPLOYEE_AGE} years old.`
    : null;
const NAME_ALLOWED_PATTERN = /^[A-Za-z\\s.'-]+$/;
const getNameValidationMessage = (value: string) =>
  value && !NAME_ALLOWED_PATTERN.test(value)
    ? "Name must contain only letters and allowed punctuation (spaces, apostrophes, periods, hyphens)."
    : null;

export type NewEmployeeDialogProps = {
  open: boolean;
  mode?: "create" | "edit";
  employeeId?: number | null;
  onClose: () => void;
  onCreated?: () => void;
  onUpdated?: () => void;
};

const parseNumber = (value: string) => {
  if (!value) return 0;
  const numeric = Number(value.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const sanitizeNumericInput = (value: string, allowDecimal = false) => {
  if (!value) return "";
  const pattern = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;
  const sanitized = value.replace(pattern, "");
  if (!allowDecimal) {
    return sanitized;
  }
  const [integerPart, ...decimalParts] = sanitized.split(".");
  const decimalPart = decimalParts.join("");
  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
};

const enforceNumericFieldRules = (name: string, value: string) => {
  if (name === "empNo") {
    return sanitizeNumericInput(value, false);
  }
  if (["basicSalary", "travelAllowance", "otherAllowance"].includes(name)) {
    return sanitizeNumericInput(value, true);
  }
  return value;
};

/**
 * Hosts the full create/edit workflow. All remote data fetching, form
 * validation, dirty-state detection and confirmation dialogs live here to keep
 * downstream components stateless.
 */
export const NewEmployeeDialog = ({
  open,
  mode = "create",
  employeeId = null,
  onClose,
  onCreated,
  onUpdated,
}: NewEmployeeDialogProps) => {
  const isEditMode = mode === "edit";

  const [formState, setFormState] = useState<FormState>(initialState);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [loadedFormState, setLoadedFormState] = useState<FormState | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isBackDialogOpen, setIsBackDialogOpen] = useState(false);
  const [isSalaryConfirmDialogOpen, setIsSalaryConfirmDialogOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [dobError, setDobError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [empNoError, setEmpNoError] = useState<string | null>(null);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [basicSalaryError, setBasicSalaryError] = useState<string | null>(null);

  const totalSalaryLabel = useMemo(
    () => formatCurrency(formState.totalSalary),
    [formState.totalSalary]
  );

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Tracks whether core required inputs are populated. Used to drive both
  // submit validation and the informational banner.
  const requiredFieldsFilled = useMemo(() => {
    const hasEmpNo = formState.empNo.trim().length > 0;
    const hasName = formState.name.trim().length > 0;
    const hasDob = !!formState.dob;
    const hasDepartment = !!formState.departmentId;
    const hasSection = !!formState.sectionId;
    const hasBasicSalary = formState.basicSalary.trim().length > 0;
    return hasEmpNo && hasName && hasDob && hasDepartment && hasSection && hasBasicSalary;
  }, [
    formState.basicSalary,
    formState.departmentId,
    formState.dob,
    formState.empNo,
    formState.name,
    formState.sectionId,
  ]);

  const showEmpNoRequiredError = hasAttemptedSubmit && !formState.empNo.trim();
  const showNameRequiredError = hasAttemptedSubmit && !formState.name.trim();
  const showDobRequiredError = hasAttemptedSubmit && !formState.dob;
  const showDepartmentRequiredError = hasAttemptedSubmit && !formState.departmentId;
  const showSectionRequiredError = hasAttemptedSubmit && !formState.sectionId;
  const showBasicSalaryRequiredError = hasAttemptedSubmit && !formState.basicSalary.trim();

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const items = await fetchDepartments(controller.signal);
        if (isActive) {
          setDepartments(items);
        }
      } catch (err) {
        if (
          (err instanceof DOMException && err.name === "AbortError") ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          return;
        }
        if (isActive) {
          setErrorMessage(err instanceof Error ? err.message : "Unable to load departments");
        }
      } finally {
        if (isActive) {
          setLoadingDepartments(false);
        }
      }
    };

    loadDepartments();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!open || !isEditMode) {
      return;
    }

    if (!employeeId) {
      setErrorMessage("Employee identifier is missing.");
      setFormState(initialState);
      setLoadedFormState(null);
      setSections([]);
      setDobError(null);
      setNameError(null);
      setEmpNoError(null);
      setDepartmentError(null);
      setSectionError(null);
      setBasicSalaryError(null);
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const toInputString = (value: unknown) => {
      if (value === null || value === undefined) return "";
      if (typeof value === "number") {
        if (!Number.isFinite(value)) return "";
        return value.toString();
      }
      if (typeof value === "string") return value;
      return String(value ?? "");
    };

    const loadEmployee = async () => {
      setLoadingEmployee(true);
      setErrorMessage(null);
      try {
        const data = await fetchEmployeeById(employeeId, controller.signal);
        if (!isActive || !data) return;

        const nextState: FormState = {
          empNo: toInputString(data.empNo ?? ""),
          name: data.name ?? "",
          dob: data.dob ?? "",
          age: data.age ?? (data.dob ? calculateAge(data.dob) : 0),
          departmentId: data.departmentId ? String(data.departmentId) : "",
          sectionId: data.sectionId ? String(data.sectionId) : "",
          email: data.email ?? "",
          basicSalary: toInputString(data.basicSalary ?? ""),
          travelAllowance: toInputString(data.travelAllowance ?? ""),
          otherAllowance: toInputString(data.otherAllowance ?? ""),
          totalSalary: 0,
          active: Boolean(data.active),
        };
        nextState.totalSalary = calculateTotalSalary(nextState);

        setFormState(nextState);
        setLoadedFormState(nextState);
        setDobError(getAgeValidationMessage(nextState.age));
        setNameError(getNameValidationMessage(nextState.name));
        setEmpNoError(null);
        setDepartmentError(null);
        setSectionError(null);
        setBasicSalaryError(null);
      } catch (err) {
        if (
          (err instanceof DOMException && err.name === "AbortError") ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          return;
        }
        if (!isActive) return;
        setErrorMessage(
          err instanceof Error ? err.message : "Something went wrong while loading the employee."
        );
        setFormState(initialState);
        setLoadedFormState(null);
        setSections([]);
        setDobError(null);
        setNameError(null);
        setEmpNoError(null);
        setDepartmentError(null);
        setSectionError(null);
        setBasicSalaryError(null);
      } finally {
        if (isActive) {
          setLoadingEmployee(false);
        }
      }
    };

    loadEmployee();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [open, isEditMode, employeeId]);

  // Refresh sections whenever the department changes.
  useEffect(() => {
    if (!formState.departmentId) {
      setSections([]);
      setFormState((prev) => ({ ...prev, sectionId: "" }));
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const loadSections = async () => {
      setLoadingSections(true);
      try {
        const list = await fetchSectionsByDepartment(formState.departmentId, controller.signal);
        if (isActive) {
          setSections(list);
        }
      } catch (err) {
        if (
          (err instanceof DOMException && err.name === "AbortError") ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          return;
        }
        if (isActive) {
          setErrorMessage(err instanceof Error ? err.message : "Unable to load sections");
        }
      } finally {
        if (isActive) {
          setLoadingSections(false);
        }
      }
    };

    loadSections();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [formState.departmentId]);

  // Centralised logic used by both reset button and dialog confirmations.
  const performReset = useCallback(() => {
    if (isEditMode && loadedFormState) {
      setFormState(loadedFormState);
    } else {
      setFormState(initialState);
      setSections([]);
    }
    setErrorMessage(null);
    setSubmissionState("idle");
    setDobError(
      isEditMode && loadedFormState ? getAgeValidationMessage(loadedFormState.age) : null
    );
    setNameError(
      isEditMode && loadedFormState ? getNameValidationMessage(loadedFormState.name) : null
    );
    setEmpNoError(null);
    setDepartmentError(null);
    setSectionError(null);
    setBasicSalaryError(null);
    setHasAttemptedSubmit(false);
  }, [isEditMode, loadedFormState]);

  useEffect(() => {
    if (!open) {
      setIsResetDialogOpen(false);
      setIsBackDialogOpen(false);
      setIsSalaryConfirmDialogOpen(false);
      setPendingSubmit(false);
      setLoadedFormState(null);
      performReset();
      setDobError(null);
      setNameError(null);
      setEmpNoError(null);
      setDepartmentError(null);
      setSectionError(null);
      setBasicSalaryError(null);
      setHasAttemptedSubmit(false);
    }
  }, [open, performReset]);

  const departmentOptions = useMemo<Option[]>(() => {
    if (!departments.length) return [];
    return departments.map((dept) => ({
      label: dept.name,
      value: String(dept.id),
      status: dept.status,
      disabled: dept.status === 0, 
    }));
  }, [departments]);

  const sectionOptions = useMemo<Option[]>(() => {
    if (!sections.length) return [];
    return sections.map((section) => ({
      label: section.name,
      value: String(section.id),
      status: section.status,
      disabled: section.status === 0, 
    }));
  }, [sections]);

  const selectedDepartmentOption = useMemo(
    () => departmentOptions.find((opt) => opt.value === formState.departmentId) ?? null,
    [departmentOptions, formState.departmentId]
  );

  const selectedSectionOption = useMemo(
    () => sectionOptions.find((opt) => opt.value === formState.sectionId) ?? null,
    [sectionOptions, formState.sectionId]
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = event.target;
    if (type === "checkbox") {
      setFormState((prev) => ({
        ...prev,
        [name]: (event.target as HTMLInputElement).checked,
      }));
      return;
    }
    const nextValue = enforceNumericFieldRules(name, value);

    setFormState((prev) => {
      const updated: FormState = { ...prev, [name]: nextValue };
      if (name === "dob") {
        updated.age = calculateAge(value);
        setDobError(
          getAgeValidationMessage(updated.age) ?? (value ? null : "Date of birth is required.")
        );
      } else if (name === "name") {
        setNameError(getNameValidationMessage(value));
      } else if (name === "empNo") {
        setEmpNoError(nextValue.trim() ? null : "Employee number is required.");
      } else if (name === "basicSalary") {
        setBasicSalaryError(nextValue.trim() ? null : "Basic salary is required.");
      }
      if (["basicSalary", "travelAllowance", "otherAllowance"].includes(name)) {
        updated.totalSalary = calculateTotalSalary(updated);
      }
      return updated;
    });
  };

  const handleDobChange = useCallback(
    (value: string | null) => {
      const nextDob = value ?? "";
      const nextAge = nextDob ? calculateAge(nextDob) : 0;

      setFormState((prev) => ({
        ...prev,
        dob: nextDob,
        age: nextAge,
      }));
      setDobError(getAgeValidationMessage(nextAge) ?? (nextDob ? null : "Date of birth is required."));
    },
    [setDobError, setFormState]
  );

  const handleDepartmentChange = useCallback(
    (option: Option | null) => {
      if (option && option.status === 0) {
        setDepartmentError("Cannot select an inactive department.");
        setErrorMessage("Cannot select an inactive department.");
        return;
      }

      setFormState((prev) => ({
        ...prev,
        departmentId: option?.value ?? "",
        sectionId: "",
      }));
      setDepartmentError(option ? null : "Department is required.");
      setSectionError("Section is required.");
      setErrorMessage(null);
    },
    [setDepartmentError, setErrorMessage, setFormState, setSectionError]
  );

  const handleSectionChange = useCallback(
    (option: Option | null) => {
      if (option && option.status === 0) {
        setSectionError("Cannot select an inactive section.");
        setErrorMessage("Cannot select an inactive section.");
        return;
      }

      setFormState((prev) => ({
        ...prev,
        sectionId: option?.value ?? "",
      }));
      setSectionError(option ? null : "Section is required.");
      setErrorMessage(null);
    },
    [setErrorMessage, setFormState, setSectionError]
  );

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = dayjs(dob);
    if (!birthDate.isValid()) return 0;
    const today = dayjs();
    const age = today.diff(birthDate, "year");
    return age < 0 ? 0 : age;
  };
  const calculateTotalSalary = (state: FormState) => {
    const basic = parseNumber(state.basicSalary);
    const travel = parseNumber(state.travelAllowance);
    const other = parseNumber(state.otherAllowance);
    return basic + travel + other;
  };
  // Determines whether total allowances exceed the basic salary, which
  // triggers the confirmation dialog to prevent accidental data entry.
  const checkBasicSalaryValidation = (state: FormState) => {
    const basic = parseNumber(state.basicSalary);
    const travel = parseNumber(state.travelAllowance);
    const other = parseNumber(state.otherAllowance);
    const totalAllowances = travel + other;
    return basic > 0 && totalAllowances > 0 && basic <= totalAllowances;
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await performSubmit();
  };
  const performSubmit = async (overrideSalaryValidation = false) => {
    setHasAttemptedSubmit(true);
    setSubmissionState("submitting");
    setErrorMessage(null);

    const trimmedEmpNo = formState.empNo.trim();
    const trimmedName = formState.name.trim();
    const trimmedBasicSalary = formState.basicSalary.trim();

    if (!trimmedEmpNo) {
      setSubmissionState("idle");
      setEmpNoError("Employee number is required.");
      setErrorMessage("Employee number is required.");
      return;
    }

    if (!trimmedName) {
      setSubmissionState("idle");
      setNameError("Name is required.");
      setErrorMessage("Name is required.");
      return;
    }

    if (!formState.dob) {
      setSubmissionState("idle");
      setDobError("Date of birth is required.");
      setErrorMessage("Date of birth is required.");
      return;
    }

    const nameValidation = getNameValidationMessage(trimmedName);
    if (nameValidation) {
      setSubmissionState("idle");
      setNameError(nameValidation);
      setErrorMessage(nameValidation);
      return;
    }

    const ageError = getAgeValidationMessage(formState.age);
    if (ageError) {
      setSubmissionState("idle");
      setDobError(ageError);
      setErrorMessage(ageError);
      return;
    }

    if (!formState.departmentId) {
      setSubmissionState("idle");
      setDepartmentError("Department is required.");
      setErrorMessage("Department is required.");
      return;
    }

    const selectedDept = departments.find((d) => String(d.id) === formState.departmentId);
    if (selectedDept && selectedDept.status === 0) {
      setSubmissionState("idle");
      setDepartmentError("Cannot select an inactive department.");
      setErrorMessage("Cannot select an inactive department.");
      return;
    }

    if (!formState.sectionId) {
      setSubmissionState("idle");
      setSectionError("Section is required.");
      setErrorMessage("Section is required.");
      return;
    }

    // Check if selected section is active
    const selectedSec = sections.find((s) => String(s.id) === formState.sectionId);
    if (selectedSec && selectedSec.status === 0) {
      setSubmissionState("idle");
      setSectionError("Cannot select an inactive section.");
      setErrorMessage("Cannot select an inactive section.");
      return;
    }

    if (!trimmedBasicSalary) {
      setSubmissionState("idle");
      setBasicSalaryError("Basic salary is required.");
      setErrorMessage("Basic salary is required.");
      return;
    }

    if (checkBasicSalaryValidation(formState) && !overrideSalaryValidation) {
      setSubmissionState("idle");
      setPendingSubmit(true);
      setIsSalaryConfirmDialogOpen(true);
      return;
    }

    const payload = {
      empNo: Number(formState.empNo),
      name: formState.name.trim(),
      dob: formState.dob || null,
      email: formState.email.trim(),
      departmentId: formState.departmentId ? Number(formState.departmentId) : null,
      sectionId: formState.sectionId ? Number(formState.sectionId) : null,
      basicSalary: parseNumber(formState.basicSalary),
      travelAllowance: parseNumber(formState.travelAllowance),
      otherAllowance: parseNumber(formState.otherAllowance),
      active: isEditMode ? formState.active : true,
    };

    try {
      if (!payload.departmentId || !payload.sectionId) {
        throw new Error("Please select both department and section.");
      }

      if (isEditMode && !employeeId) {
        throw new Error("Employee identifier is missing.");
      }

      await upsertEmployee(payload, isEditMode ? { employeeId } : undefined);

      if (isEditMode) {
        onUpdated?.();
      } else {
        onCreated?.();
      }
      onClose();
    } catch (err) {
      const resolvedMessage =
        err instanceof ApiError
          ? resolveEmployeeSaveError(err.status, err.message)
          : err instanceof Error
            ? err.message
            : "Failed to save employee.";
      if (isDuplicateEmpNoError(resolvedMessage)) {
        setEmpNoError(DUPLICATE_EMP_NO_MESSAGE);
        setErrorMessage(DUPLICATE_EMP_NO_MESSAGE);
      } else {
        setErrorMessage(resolvedMessage);
      }
    } finally {
      setSubmissionState("idle");
    }
  };

  const isSubmitting = submissionState === "submitting";
  const isBusy = isSubmitting || loadingEmployee;

  const hasUnsavedChanges = useMemo(() => {
    const baseline = isEditMode ? loadedFormState ?? initialState : initialState;
    return trackedFormFields.some((field) => formState[field] !== baseline[field]);
  }, [formState, isEditMode, loadedFormState]);

  const requestClose = () => {
    if (isBusy) return;
    if (hasUnsavedChanges) {
      setIsBackDialogOpen(true);
      return;
    }
    onClose();
  };

  const handleRequestReset = () => {
    if (isBusy) return;
    setIsResetDialogOpen(true);
  };

  const handleCancelReset = () => {
    if (isBusy) return;
    setIsResetDialogOpen(false);
  };

  const handleConfirmReset = () => {
    if (isBusy) return;
    performReset();
    setIsResetDialogOpen(false);
  };

  const handleRequestBack = () => {
    if (isBusy) return;
    if (!hasUnsavedChanges) {
      onClose();
      return;
    }
    setIsBackDialogOpen(true);
  };

  const handleCancelBack = () => {
    if (isBusy) return;
    setIsBackDialogOpen(false);
  };

  const handleConfirmBack = () => {
    if (isBusy) return;
    setIsBackDialogOpen(false);
    onClose();
  };

  const handleCancelSalaryConfirm = () => {
    setIsSalaryConfirmDialogOpen(false);
    setPendingSubmit(false);
  };

  const handleConfirmSalaryConfirm = () => {
    setIsSalaryConfirmDialogOpen(false);
    if (pendingSubmit) {
      setPendingSubmit(false);
      void performSubmit(true);
    }
  };

  const dialogViewProps = {
    open,
    isEditMode,
    requestClose,
    handleSubmit,
    errorMessage,
    loadingEmployee,
    formState,
    handleInputChange,
    handleDobChange,
    isBusy,
    isSubmitting,
    empNoError,
    nameError,
    dobError,
    departmentError,
    sectionError,
    basicSalaryError,
    showEmpNoRequiredError,
    showNameRequiredError,
    showDobRequiredError,
    showDepartmentRequiredError,
    showSectionRequiredError,
    showBasicSalaryRequiredError,
    departmentOptions,
    sectionOptions,
    selectedDepartmentOption,
    selectedSectionOption,
    handleDepartmentChange,
    handleSectionChange,
    loadingDepartments,
    loadingSections,
    totalSalaryLabel,
    handleRequestReset,
    handleRequestBack,
    handleCancelReset,
    handleConfirmReset,
    isResetDialogOpen,
    handleCancelBack,
    handleConfirmBack,
    isBackDialogOpen,
    handleCancelSalaryConfirm,
    handleConfirmSalaryConfirm,
    isSalaryConfirmDialogOpen,
    hasAttemptedSubmit,
    requiredFieldsFilled,
  };

  return <NewEmployeeDialogView {...dialogViewProps} />;

};
export default NewEmployeeDialog;
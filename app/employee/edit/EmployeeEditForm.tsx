"use client";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import { ApiError, fetchDepartments, fetchEmployeeById, fetchSectionsByDepartment, upsertEmployee } from "@/app/employee/api";
import type { EmployeeResponse } from "@/app/employee/api";
import type { Department, Section } from "@/app/employee/types";
import EmployeeEditFormView from "./EmployeeEditFormView";

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
type SubmissionState = "idle" | "submitting" | "success" | "error";
export type Option = {
  label: string;
  value: string;
  status?: number;
  disabled?: boolean;
};
export type SalarySummaryItem = { label: string; value: string };
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
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value || 0);

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

const toInputString = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return value.toString();
  }
  return String(value ?? "");
};
const MINIMUM_EMPLOYEE_AGE = 18;
const FUTURE_DOB_ERROR = "Date of birth cannot be in the future.";
const getAgeValidationMessage = (age: number) =>
  age > 0 && age < MINIMUM_EMPLOYEE_AGE
    ? `Employees must be at least ${MINIMUM_EMPLOYEE_AGE} years old.`
    : null;
const NAME_ALLOWED_PATTERN = /^[A-Za-z\s.'-]+$/;
const getNameValidationMessage = (value: string) =>
  value && !NAME_ALLOWED_PATTERN.test(value)
    ? "Name must contain only letters and allowed punctuation (spaces, apostrophes, periods, hyphens)."
    : null;
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
/**
 * Renders the edit/create form as a full page. Shares most logic with the
 * dialog variant but derives the employee id from the URL instead of props.
 */
export const EmployeeEditForm = () => {
  const searchParams = useSearchParams();
  const employeeIdParam = searchParams.get("id");
  const employeeId = useMemo(() => {
    if (!employeeIdParam) return null;
    const parsed = Number(employeeIdParam);
    return Number.isFinite(parsed) ? parsed : null;
  }, [employeeIdParam]);
  const isEditMode = Boolean(employeeId);

  const [formState, setFormState] = useState<FormState>(initialState);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  // React to query-string changes so deep links re-fetch the correct employee.
  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmissionState("idle");
    setHasAttemptedSubmit(false);
    setLoadedFormState(null);

    if (!employeeId) {
      setFormState(initialState);
      setSections([]);
      setDobError(null);
      setNameError(null);
      setEmpNoError(null);
      setDepartmentError(null);
      setSectionError(null);
      setBasicSalaryError(null);
      return;
    }
    setSections([]);

    const controller = new AbortController();
    let isActive = true;

    const loadEmployee = async () => {
      setLoadingEmployee(true);
      try {
        const data = await fetchEmployeeById(employeeId, controller.signal);
        if (!isActive || !data) return;

        const nextState: FormState = {
          empNo: toInputString(data.empNo ?? ""),
          name: data.name ?? "",
          dob: data.dob ?? "",
          age: data.age ?? calculateAge(data.dob ?? ""),
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
  }, [employeeId]);

  // Initial load of departments for the autocomplete.
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

  // Refresh section list whenever the department changes.
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

  // Convert API departments into autocomplete options, disabling inactive entries.
  const departmentOptions = useMemo<Option[]>(() => {
    if (!departments.length) return [];
    return departments.map((dept) => ({
      label: dept.name,
      value: String(dept.id),
      status: dept.status,
      disabled: dept.status === 0, // Disable inactive departments
    }));
  }, [departments]);

  // Same idea for sections; recomputed whenever `sections` updates.
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
        setDobError(getAgeValidationMessage(updated.age));
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
  const handleDobChange = (value: string | null) => {
    const nextDob = value ?? "";
    if (nextDob) {
      const parsedDob = dayjs(nextDob);
      if (parsedDob.isValid() && parsedDob.isAfter(dayjs(), "day")) {
        setDobError(FUTURE_DOB_ERROR);
        return;
      }
    }
    const nextAge = nextDob ? calculateAge(nextDob) : 0;

    setFormState((prev) => ({
      ...prev,
      dob: nextDob,
      age: nextAge,
    }));
    setDobError(
      getAgeValidationMessage(nextAge) ??
        (nextDob ? null : "Date of birth is required.")
    );
  };

  const handleDepartmentChange = (option: Option | null) => {
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
  };

  const handleSectionChange = (option: Option | null) => {
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
  };
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

  const checkBasicSalaryValidation = (state: FormState) => {
    const basic = parseNumber(state.basicSalary);
    const travel = parseNumber(state.travelAllowance);
    const other = parseNumber(state.otherAllowance);
    const totalAllowances = travel + other;
    return basic > 0 && totalAllowances > 0 && basic <= totalAllowances;
  };

  // Shared reset logic used by both CTA buttons and confirmation dialogs.
  const performReset = useCallback(() => {
    if (employeeId && loadedFormState) {
      setFormState(loadedFormState);
    } else {
      setFormState(initialState);
      setSections([]);
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmissionState("idle");
    setDobError(
      employeeId && loadedFormState ? getAgeValidationMessage(loadedFormState.age) : null
    );
    setNameError(
      employeeId && loadedFormState ? getNameValidationMessage(loadedFormState.name) : null
    );
    setEmpNoError(null);
    setDepartmentError(null);
    setSectionError(null);
    setBasicSalaryError(null);
  }, [employeeId, loadedFormState]);

  const handleRequestReset = () => {
    setIsResetDialogOpen(true);
  };

  const handleCancelReset = () => {
    setIsResetDialogOpen(false);
  };

  const handleConfirmReset = () => {
    performReset();
    setIsResetDialogOpen(false);
  };

  const handleRequestBack = () => {
    setIsBackDialogOpen(true);
  };

  const handleCancelBack = () => {
    setIsBackDialogOpen(false);
  };

  const handleConfirmBack = () => {
    setIsBackDialogOpen(false);
    window.history.back();
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await performSubmit();
  };

  // Primary submit pipeline. `overrideSalaryValidation` is set by the
  // confirmation dialog when allowances exceed the basic salary.
  const performSubmit = async (overrideSalaryValidation = false) => {
    setHasAttemptedSubmit(true);
    setSubmissionState("submitting");
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmpNo = formState.empNo.trim();
    const trimmedName = formState.name.trim();
    const trimmedBasicSalary = formState.basicSalary.trim();

    if (!trimmedEmpNo) {
      setSubmissionState("error");
      setEmpNoError("Employee number is required.");
      setErrorMessage("Employee number is required.");
      return;
    }

    if (!trimmedName) {
      setSubmissionState("error");
      setNameError("Name is required.");
      setErrorMessage("Name is required.");
      return;
    }

    if (!formState.dob) {
      setSubmissionState("error");
      setDobError("Date of birth is required.");
      setErrorMessage("Date of birth is required.");
      return;
    }

    const nameValidation = getNameValidationMessage(trimmedName);
    if (nameValidation) {
      setSubmissionState("error");
      setNameError(nameValidation);
      setErrorMessage(nameValidation);
      return;
    }

    const ageError = getAgeValidationMessage(formState.age);
    if (ageError) {
      setSubmissionState("error");
      setDobError(ageError);
      setErrorMessage(ageError);
      return;
    }

    if (!formState.departmentId) {
      setSubmissionState("error");
      setDepartmentError("Department is required.");
      setErrorMessage("Department is required.");
      return;
    }

    // Check if selected department is active
    const selectedDept = departments.find((d) => String(d.id) === formState.departmentId);
    if (selectedDept && selectedDept.status === 0) {
      setSubmissionState("error");
      setDepartmentError("Cannot select an inactive department.");
      setErrorMessage("Cannot select an inactive department.");
      return;
    }

    if (!formState.sectionId) {
      setSubmissionState("error");
      setSectionError("Section is required.");
      setErrorMessage("Section is required.");
      return;
    }

    // Check if selected section is active
    const selectedSec = sections.find((s) => String(s.id) === formState.sectionId);
    if (selectedSec && selectedSec.status === 0) {
      setSubmissionState("error");
      setSectionError("Cannot select an inactive section.");
      setErrorMessage("Cannot select an inactive section.");
      return;
    }

    if (!trimmedBasicSalary) {
      setSubmissionState("error");
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

    const isEdit = Boolean(employeeId);
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
      // New employees are always active. For updates, allow status change.
      active: isEdit ? formState.active : true,
    };

    try {
      if (!payload.departmentId || !payload.sectionId) {
        throw new Error("Please select both department and section.");
      }

      if (isEdit && !employeeId) {
        throw new Error("Employee identifier is missing.");
      }

      const responseData = await upsertEmployee(payload, isEdit ? { employeeId } : undefined);

      const successText = isEdit ? "Employee updated successfully." : "Employee saved successfully.";

      if (isEdit) {
        if (responseData) {
          const nextState: FormState = {
            empNo: toInputString(responseData.empNo ?? payload.empNo),
            name: responseData.name ?? payload.name,
            dob: responseData.dob ?? payload.dob ?? "",
            age: responseData.age ?? calculateAge(responseData.dob ?? payload.dob ?? ""),
            departmentId: responseData.departmentId
              ? String(responseData.departmentId)
              : payload.departmentId
              ? String(payload.departmentId)
              : "",
            sectionId: responseData.sectionId
              ? String(responseData.sectionId)
              : payload.sectionId
              ? String(payload.sectionId)
              : "",
            email: responseData.email ?? payload.email,
            basicSalary: toInputString(responseData.basicSalary ?? payload.basicSalary),
            travelAllowance: toInputString(responseData.travelAllowance ?? payload.travelAllowance),
            otherAllowance: toInputString(responseData.otherAllowance ?? payload.otherAllowance),
            totalSalary: 0,
            active:
              typeof responseData.active === "boolean" ? responseData.active : payload.active ?? true,
          };
          nextState.totalSalary = calculateTotalSalary(nextState);
          setFormState(nextState);
          setLoadedFormState(nextState);
          setDobError(getAgeValidationMessage(nextState.age));
        }
      } else {
        setFormState(initialState);
        setSections([]);
        setDobError(null);
      }

      setSubmissionState("success");
      setSuccessMessage(successText);
    } catch (err) {
      setSubmissionState("error");
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
    }
  };

  // Data backing the summary card shown on the right-hand column.
  const salarySummary = useMemo(
    () => [
      { label: "Basic Salary", value: formatCurrency(parseNumber(formState.basicSalary)) },
      { label: "Travel Allowance", value: formatCurrency(parseNumber(formState.travelAllowance)) },
      { label: "Other Allowance", value: formatCurrency(parseNumber(formState.otherAllowance)) },
      { label: "Total Salary", value: totalSalaryLabel },
    ],
    [formState.basicSalary, formState.otherAllowance, formState.travelAllowance, totalSalaryLabel]
  );
  const isSubmitting = submissionState === "submitting";
  const viewProps = {
    isEditMode,
    errorMessage,
    successMessage,
    handleSubmit,
    isSubmitting,
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
    formState,
    handleInputChange,
    handleDobChange,
    departmentOptions,
    sectionOptions,
    selectedDepartmentOption,
    selectedSectionOption,
    handleDepartmentChange,
    handleSectionChange,
    loadingDepartments,
    loadingSections,
    loadingEmployee,
    departmentError,
    sectionError,
    basicSalaryError,
    dobError,
    nameError,
    empNoError,
    showEmpNoRequiredError,
    showNameRequiredError,
    showDobRequiredError,
    showDepartmentRequiredError,
    showSectionRequiredError,
    showBasicSalaryRequiredError,
    salarySummary,
  };

  return <EmployeeEditFormView {...viewProps} />;
};
export default EmployeeEditForm;
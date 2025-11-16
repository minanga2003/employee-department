"use client";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  FormControlLabel,
} from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardBackspaceRoundedIcon from "@mui/icons-material/KeyboardBackspaceRounded";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CustomAutocomplete from "@/components/forms/drop-down/custom-auto-complete";
import CustomDatePicker from "@/components/forms/date-picker/date-picker";
import CustomTextField from "@/components/forms/text-field/custom-text-field";
import CustomButtonWithIcon from "@/components/ui/buttons/custom-button-with-icon";
import CustomCheckbox from "@/components/forms/checkbox/custom-checkbox";
import CustomDivider from "@/components/ui/divider/custom-divider";
import ConfirmationDialog from "@/components/ui/dialog-box/confirmation-dialog";
import { buildApiUrl } from "@/lib/apiConfig";

type Department = {
  id: number;
  name: string;
  status?: number; 
};

type Section = {
  id: number;
  name: string;
  status?: number; 
};

type FormState = {
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

type Option = { 
  label: string; 
  value: string; 
  status?: number; // 1 = active, 0 = inactive
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

const SectionHeader = ({ label }: { label: string }) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        pt: { xs: 1, sm: 2 },
      }}
    >
      <Box
        sx={{
          width: 20,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      />
      <Typography
        variant="subtitle2"
        fontWeight={600}
        sx={{
          color: theme.palette.text.primary,
          minWidth: { xs: "auto", sm: 160 },
          fontSize: "0.85rem",
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Typography>
      <Divider
        sx={{
          flexGrow: 1,
          borderColor: theme.palette.divider,
        }}
      />
    </Stack>
  );
};

export const NewEmployeeDialog = ({
  open,
  mode = "create",
  employeeId = null,
  onClose,
  onCreated,
  onUpdated,
}: NewEmployeeDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
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
        const url = buildApiUrl("/api/departments");
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load departments (${response.status})`);
        }
        const data = (await response.json()) as Department[] | Department;
        const list = Array.isArray(data) ? data : [data];
        if (isActive) {
          setDepartments(
            list
              .map((dept) => ({
                id: Number(dept.id),
                name: dept.name,
                status: dept.status !== undefined ? Number(dept.status) : 1, // Default to active if not provided
              }))
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
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
        const url = buildApiUrl(`/api/employees/${employeeId}`);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          const body = await response.text();
          throw new Error(body || `Failed to load employee (${response.status})`);
        }

        const data = await response.json();
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
        if (err instanceof Error && err.name === "AbortError") return;
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
        const url = buildApiUrl(`/api/sections?departmentId=${formState.departmentId}`);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load sections (${response.status})`);
        }
        const data = (await response.json()) as Section[] | Section;
        const list = Array.isArray(data) ? data : [data];
        if (isActive) {
          // Map sections and deduplicate by name
          // Strategy: Collect all sections by name, then pick the best one (active preferred, then lowest ID)
          const sectionsByName = new Map<string, Array<{ id: number; name: string; status: number }>>();
          
          // First pass: collect all sections grouped by name
          list.forEach((sec) => {
            const sectionName = sec.name;
            const sectionId = Number(sec.id);
            const sectionStatus = sec.status !== undefined ? Number(sec.status) : 1;
            
            if (!sectionsByName.has(sectionName)) {
              sectionsByName.set(sectionName, []);
            }
            sectionsByName.get(sectionName)!.push({
              id: sectionId,
              name: sectionName,
              status: sectionStatus,
            });
          });
          
          // Second pass: for each section name, pick the best one
          // Strategy: Prefer higher ID when duplicates exist (higher ID is the correct/canonical entry)
          // If multiple with same status, prefer higher ID
          // If one active and one inactive, prefer the one with higher ID (canonical entry)
          const sectionMap = new Map<string, { id: number; name: string; status: number }>();
          sectionsByName.forEach((sections, name) => {
            // Sort: by ID descending (higher ID first - canonical entry)
            const sorted = sections.sort((a, b) => b.id - a.id); // Higher ID first
            // Pick the first one (highest ID - canonical entry)
            sectionMap.set(name, sorted[0]);
          });
          // Convert map values to array and sort
          setSections(
            Array.from(sectionMap.values()).sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
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
      disabled: dept.status === 0, // Disable inactive departments
    }));
  }, [departments]);

  const sectionOptions = useMemo<Option[]>(() => {
    if (!sections.length) return [];
    return sections.map((section) => ({
      label: section.name,
      value: String(section.id),
      status: section.status,
      disabled: section.status === 0, // Disable inactive sections
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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

    // Check if selected department is active
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

      let url = buildApiUrl("/api/employees");
      let method: "POST" | "PUT" = "POST";
      if (isEditMode) {
        if (!employeeId) {
          throw new Error("Employee identifier is missing.");
        }
        url = buildApiUrl(`/api/employees/${employeeId}`);
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessageFromServer = "";
        try {
          const contentType = response.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            const errorJson = await response.json();
            if (typeof errorJson === "string") {
              errorMessageFromServer = errorJson;
            } else if (errorJson && typeof errorJson === "object") {
              errorMessageFromServer =
                (errorJson.message as string) ??
                (errorJson.error as string) ??
                (errorJson.detail as string) ??
                "";
            }
          } else {
            errorMessageFromServer = (await response.text()) ?? "";
          }
        } catch {
          errorMessageFromServer = "";
        }

        throw new Error(resolveEmployeeSaveError(response.status, errorMessageFromServer.trim()));
      }

      if (isEditMode) {
        onUpdated?.();
      } else {
        onCreated?.();
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save employee.";
      if (isDuplicateEmpNoError(message)) {
        setEmpNoError(DUPLICATE_EMP_NO_MESSAGE);
        setErrorMessage(DUPLICATE_EMP_NO_MESSAGE);
      } else {
        setErrorMessage(message);
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

  return (
    <>
    <Dialog
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      open={open}
      onClose={() => requestClose()}
      aria-labelledby="new-employee-dialog-title"
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          width: "100%",
          maxWidth: 900,
        },
        elevation: 8,
      }}
    >
      <DialogTitle id="new-employee-dialog-title">
        {isEditMode ? "Edit Employee" : "New Employee"}
        <IconButton
          aria-label="close"
          onClick={requestClose}
          edge="end"
          sx={{ position: "absolute", right: 25, top: 10 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          p: 0,
          overflowX: "hidden",
        }}
      >
        <Box
          component="form"
          id="new-employee-form"
          onSubmit={handleSubmit}
          sx={{
            p: { xs: 2.5, sm: 3 },
            backgroundColor: theme.palette.background.paper,
            width: "100%",
            overflowX: "hidden",
          }}
        >
          <Stack spacing={3}>
            {errorMessage && (
              <Alert severity="error" variant="outlined">
                {errorMessage}
              </Alert>
            )}

            {loadingEmployee && (
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                justifyContent="flex-start"
                sx={{ fontSize: "0.85rem" }}
              >
                <CircularProgress size={18} />
                <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                  Loading employee details…
                </Typography>
              </Stack>
            )}

            <Box
              sx={{
                maxHeight: { xs: "unset", md: "60vh" },
                overflowY: "auto",
                pr: { xs: 0, md: 1 },
              }}
            >
              <Stack spacing={3}>
                <Stack spacing={2} sx={{ width: "100%" }}>
                  <SectionHeader label="Personal Details" />
                  <Grid2 container spacing={2} sx={{ width: "100%", m: 0 }}>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        name="empNo"
                        label="EMP No"
                        value={formState.empNo}
                        onChange={handleInputChange}
                        required
                        disabled={isBusy || isEditMode}
                          error={Boolean(empNoError) || showEmpNoRequiredError}
                          helperText={
                            empNoError ?? (showEmpNoRequiredError ? "Employee number is required." : "")
                          }
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        name="name"
                        label="Name"
                        value={formState.name}
                        onChange={handleInputChange}
                          error={Boolean(nameError) || showNameRequiredError}
                          helperText={nameError ?? (showNameRequiredError ? "Name is required." : "")}
                        required
                        disabled={isBusy}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <CustomDatePicker
                        label="Date of Birth"
                        value={formState.dob}
                          onChange={(value) => {
                            const nextDob = value ?? "";
                            const nextAge = value ? calculateAge(value) : 0;
                          setFormState((prev) => ({
                            ...prev,
                              dob: nextDob,
                              age: nextAge,
                            }));
                            setDobError(getAgeValidationMessage(nextAge));
                          }}
                        disabled={isBusy}
                          slotProps={{
                            textField: {
                              helperText:
                                dobError ?? (showDobRequiredError ? "Date of birth is required." : ""),
                              error: Boolean(dobError) || showDobRequiredError,
                              required: true,
                            },
                          }}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        label="Age"
                        value={formState.age ? `${formState.age} years` : ""}
                        InputProps={{ readOnly: true }}
                        placeholder="Auto-calculated"
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12 }}>
                      <CustomTextField
                        name="email"
                        label="Email"
                        type="email"
                        value={formState.email}
                        onChange={handleInputChange}
                        disabled={isBusy}
                      />
                    </Grid2>
                  </Grid2>
                </Stack>

                <Stack spacing={2} sx={{ width: "100%" }}>
                  <Grid2 container spacing={2} sx={{ width: "100%", m: 0 }}>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <CustomAutocomplete
                        label="Department"
                        options={departmentOptions}
                        value={selectedDepartmentOption}
                        onChange={(_, option) => {
                          // Prevent selecting inactive departments (should be disabled, but check for safety)
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
                        }}
                        disabled={loadingDepartments || isBusy}
                          error={Boolean(departmentError) || showDepartmentRequiredError}
                          helperText={
                            loadingDepartments
                              ? "Loading departments..."
                              : departmentError ??
                                (showDepartmentRequiredError ? "Department is required." : "")
                          }
                          required
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <CustomAutocomplete
                        label="Section"
                        options={sectionOptions}
                        value={selectedSectionOption}
                        onChange={(_, option) => {
                          // Prevent selecting inactive sections (should be disabled, but check for safety)
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
                        }}
                        disabled={!formState.departmentId || loadingSections || isBusy}
                          error={Boolean(sectionError) || showSectionRequiredError}
                        helperText={
                          !formState.departmentId
                            ? "Select department first"
                            : loadingSections
                            ? "Loading sections..."
                              : sectionError ??
                                (showSectionRequiredError ? "Section is required." : "")
                        }
                      />
                    </Grid2>
                  </Grid2>
                </Stack>

                <Stack spacing={2} sx={{ width: "100%" }}>
                  <Grid2 container spacing={2} sx={{ width: "100%", m: 0 }}>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        name="basicSalary"
                        label="Basic Salary"
                        value={formState.basicSalary}
                        onChange={handleInputChange}
                        required
                        disabled={isBusy}
                          error={Boolean(basicSalaryError) || showBasicSalaryRequiredError}
                          helperText={
                            basicSalaryError ??
                            (showBasicSalaryRequiredError ? "Basic salary is required." : "")
                          }
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        name="travelAllowance"
                        label="Travel Allowance"
                        value={formState.travelAllowance}
                        onChange={handleInputChange}
                        disabled={isBusy}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        name="otherAllowance"
                        label="Other Allowance"
                        value={formState.otherAllowance}
                        onChange={handleInputChange}
                        disabled={isBusy}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <CustomTextField
                        label="Total Salary"
                        value={totalSalaryLabel}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid2>
                  </Grid2>
                </Stack>

                {isEditMode && (
                  <Stack spacing={2} sx={{ width: "100%" }}>
                    <SectionHeader label="Status" />
                    <FormControlLabel
                      control={
                        <CustomCheckbox
                          name="active"
                          checked={formState.active}
                          onChange={handleInputChange}
                          disabled={isBusy}
                        />
                      }
                      label="Active"
                      sx={{
                        "& .MuiTypography-root": { fontSize: "0.85rem" },
                      }}
                    />
                  </Stack>
                )}
              </Stack>
            </Box>

            <CustomDivider />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 1, sm: 1.5 }}
              justifyContent={{ xs: "flex-start", sm: "flex-end" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              sx={{
                width: "100%",
                flexWrap: { sm: "wrap" },
                rowGap: { sm: 1 },
              }}
            >
              <CustomButtonWithIcon
                type="button"
                variant="outlined"
                startIcon={<CleaningServicesIcon fontSize="small" />}
                onClick={handleRequestReset}
                disabled={isBusy}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Clear
              </CustomButtonWithIcon>
              <CustomButtonWithIcon
                type="button"
                variant="outlined"
                startIcon={<KeyboardBackspaceRoundedIcon fontSize="small" />}
                onClick={handleRequestBack}
                disabled={isBusy}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Back
              </CustomButtonWithIcon>
              <CustomButtonWithIcon
                type="submit"
                form="new-employee-form"
                variant="outlined"
                disabled={isBusy}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={16} sx={{ color: theme.palette.primary.main }} />
                  ) : (
                    <PlayArrowRoundedIcon fontSize="small" />
                  )
                }
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                {isEditMode ? "Update" : "Save"}
              </CustomButtonWithIcon>
            </Stack>

            {hasAttemptedSubmit && !requiredFieldsFilled && (
              <Alert severity="info" variant="outlined">
                Please fill out all required fields before saving.
              </Alert>
            )}

          </Stack>
        </Box>
      </DialogContent>
    </Dialog>

      <ConfirmationDialog
        open={isResetDialogOpen}
        onClose={handleCancelReset}
        onConfirm={handleConfirmReset}
        alertType="clearConfirmation"
        isLoading={isBusy}
        description=""
      />

      <ConfirmationDialog
        open={isBackDialogOpen}
        onClose={handleCancelBack}
        onConfirm={handleConfirmBack}
        alertType="clearUnsavedData"
        isLoading={isBusy}
        description=""
      />

      <ConfirmationDialog
        open={isSalaryConfirmDialogOpen}
        onClose={handleCancelSalaryConfirm}
        onConfirm={handleConfirmSalaryConfirm}
        alertType="custom"
        isLoading={isBusy}
        title= "Confirm Salary"
        description= "The total allowances are more than the basic salary. Are you sure about that"
      />
    </>
  );
};

export default NewEmployeeDialog;


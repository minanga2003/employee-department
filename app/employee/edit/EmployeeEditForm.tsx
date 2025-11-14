"use client";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import CustomAutocomplete from "@/components/forms/drop-down/custom-auto-complete";
import CustomCheckbox from "@/components/forms/checkbox/custom-checkbox";
import CustomDatePicker from "@/components/forms/date-picker/date-picker";
import CustomTextField from "@/components/forms/text-field/custom-text-field";
import BlankCard from "@/components/ui/card/blank-card";
import ButtonLoader from "@/components/ui/buttons/button-loader";
import CustomButtonWithIcon from "@/components/ui/buttons/custom-button-with-icon";
import SummaryCard from "@/components/ui/card/summary-card";
import Breadcrumb from "@/components/ui/breadcrumb/breadcrumb";
import CustomDivider from "@/components/ui/divider/custom-divider";
import ConfirmationDialog from "@/components/ui/dialog-box/confirmation-dialog";
import PageContainer from "@/components/layouts/container/page-container";

import { buildApiUrl } from "../../../lib/apiConfig";

type Department = {
  id: number;
  name: string;
  status?: number; // 1 = active, 0 = inactive
};

type Section = {
  id: number;
  name: string;
  status?: number; // 1 = active, 0 = inactive
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

type SubmissionState = "idle" | "submitting" | "success" | "error";

type Option = { 
  label: string; 
  value: string; 
  status?: number; // 1 = active, 0 = inactive
  disabled?: boolean;
};

type EmployeeResponse = {
  id: number;
  empNo: number;
  name: string;
  dob?: string | null;
  age?: number | null;
  email: string;
  departmentId?: number | null;
  departmentName?: string | null;
  sectionId?: number | null;
  sectionName?: string | null;
  basicSalary?: number | string | null;
  travelAllowance?: number | string | null;
  otherAllowance?: number | string | null;
  totalSalary?: number | string | null;
  active: boolean;
};

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

const MINIMUM_EMPLOYEE_AGE = 18;
const getAgeValidationMessage = (age: number) =>
  age > 0 && age < MINIMUM_EMPLOYEE_AGE
    ? `Employees must be at least ${MINIMUM_EMPLOYEE_AGE} years old.`
    : null;

const NAME_ALLOWED_PATTERN = /^[A-Za-z\s.'-]+$/;
const getNameValidationMessage = (value: string) =>
  value && !NAME_ALLOWED_PATTERN.test(value)
    ? "Name must contain only letters and allowed punctuation (spaces, apostrophes, periods, hyphens)."
    : null;

const resolveEmployeeSaveError = (status: number, message?: string) => {
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
  if (
    status === 409 ||
    normalized.includes("duplicate") ||
    normalized.includes("already") ||
    normalized.includes("exists") ||
    normalized.includes("unique")
  ) {
    return "Employee number already exists. Please use a different EMP No.";
  }

  if (status === 400 || normalized.includes("bad request")) {
    return "Unable to save employee. Please review the form and correct any errors.";
  }

  return message;
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

export const EmployeeEditForm = () => {
  const searchParams = useSearchParams();
  const theme = useTheme();
  const employeeIdParam = searchParams.get("id");
  const employeeId = useMemo(() => {
    if (!employeeIdParam) return null;
    const parsed = Number(employeeIdParam);
    return Number.isFinite(parsed) ? parsed : null;
  }, [employeeIdParam]);

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

    const toInputString = (value: unknown) => {
      if (value === null || value === undefined) return "";
      return typeof value === "number" ? value.toString() : String(value);
    };

    const loadEmployee = async () => {
      setLoadingEmployee(true);
      try {
        const url = buildApiUrl(`/api/employees/${employeeId}`);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          const body = await response.text();
          throw new Error(body || `Failed to load employee (${response.status})`);
        }

        const data = (await response.json()) as EmployeeResponse;
        if (!isActive) return;

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
        if (err instanceof Error && err.name === "AbortError") return;
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

    setFormState((prev) => {
      const updated: FormState = { ...prev, [name]: value };

      if (name === "dob") {
        updated.age = calculateAge(value);
        setDobError(getAgeValidationMessage(updated.age));
      } else if (name === "name") {
        setNameError(getNameValidationMessage(value));
      } else if (name === "empNo") {
        setEmpNoError(value.trim() ? null : "Employee number is required.");
      } else if (name === "basicSalary") {
        setBasicSalaryError(value.trim() ? null : "Basic salary is required.");
      }

      if (["basicSalary", "travelAllowance", "otherAllowance"].includes(name)) {
        updated.totalSalary = calculateTotalSalary(updated);
        
        // Check if basic salary is less than or equal to total allowances
        // Show confirmation dialog when condition is met
        if (checkBasicSalaryValidation(updated)) {
          setIsSalaryConfirmDialogOpen(true);
        }
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
    setPendingSubmit(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await performSubmit();
  };

  const performSubmit = async () => {
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

      const isEdit = Boolean(employeeId);
      const url = isEdit
        ? buildApiUrl(`/api/employees/${employeeId}`)
        : buildApiUrl("/api/employees");
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
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

      let responseData: EmployeeResponse | null = null;
      try {
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          responseData = (await response.json()) as EmployeeResponse;
        }
      } catch {
        responseData = null;
      }

      const successText = isEdit ? "Employee updated successfully." : "Employee saved successfully.";

      if (isEdit) {
        if (responseData) {
          const toInputString = (value: unknown) => {
            if (value === null || value === undefined) return "";
            return typeof value === "number" ? value.toString() : String(value);
          };
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
      setErrorMessage(err instanceof Error ? err.message : "Failed to save employee.");
    }
  };

  const salarySummary = useMemo(
    () => [
      { label: "Basic Salary", value: formatCurrency(parseNumber(formState.basicSalary)) },
      { label: "Travel Allowance", value: formatCurrency(parseNumber(formState.travelAllowance)) },
      { label: "Other Allowance", value: formatCurrency(parseNumber(formState.otherAllowance)) },
      { label: "Total Salary", value: totalSalaryLabel },
    ],
    [formState.basicSalary, formState.otherAllowance, formState.travelAllowance, totalSalaryLabel]
  );

  return (
    <PageContainer title={employeeId ? "Employee | Edit" : "Employee | Create"}>
      <Breadcrumb
        title={employeeId ? "Employee Edit" : "Employee Create"}
        onBackClick={() => window.history.back()}
      />

      <Stack spacing={3}>
        {errorMessage && (
          <Alert severity="error" variant="outlined">
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" variant="outlined">
            {successMessage}
          </Alert>
        )}

        <BlankCard>
          <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <ButtonLoader
                  type="submit"
                  variant="contained"
                  loading={submissionState === "submitting"}
                  disabled={submissionState === "submitting"}
                >
                  {employeeId ? "Update" : "Save"}
                </ButtonLoader>
                <CustomButtonWithIcon variant="outlined" onClick={handleRequestReset}>
                  Clear
                </CustomButtonWithIcon>
                <CustomButtonWithIcon
                  variant="outlined"
                  onClick={handleRequestBack}
                  disabled={submissionState === "submitting"}
                >
                  Back
                </CustomButtonWithIcon>
              </Stack>

              {hasAttemptedSubmit && !requiredFieldsFilled && (
                <Alert severity="info" variant="outlined">
                  Please fill out all required fields before saving.
                </Alert>
              )}

              <CustomDivider />

              <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    name="empNo"
                    label="EMP No"
                    value={formState.empNo}
                    onChange={handleInputChange}
                    error={Boolean(empNoError) || showEmpNoRequiredError}
                    helperText={empNoError ?? (showEmpNoRequiredError ? "Employee number is required." : "")}
                    required
                    disabled={loadingEmployee}
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
                    disabled={loadingEmployee}
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
                    setDobError(
                      getAgeValidationMessage(nextAge) ?? (nextDob ? null : "Date of birth is required.")
                    );
                  }}
                    disabled={loadingEmployee}
                  slotProps={{
                    textField: {
                      helperText: dobError ?? (showDobRequiredError ? "Date of birth is required." : ""),
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
                    disabled={loadingDepartments}
                    error={Boolean(departmentError) || showDepartmentRequiredError}
                    helperText={
                      loadingDepartments
                        ? "Loading departments…"
                        : departmentError ?? (showDepartmentRequiredError ? "Department is required." : "")
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
                    disabled={!formState.departmentId || loadingSections}
                    error={Boolean(sectionError) || showSectionRequiredError}
                    helperText={
                      !formState.departmentId
                        ? "Select department first"
                        : loadingSections
                        ? "Loading sections…"
                        : sectionError ?? (showSectionRequiredError ? "Section is required." : "")
                    }
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    name="email"
                    label="Email"
                    type="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    disabled={loadingEmployee}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    name="basicSalary"
                    label="Basic Salary"
                    value={formState.basicSalary}
                    onChange={handleInputChange}
                    error={Boolean(basicSalaryError) || showBasicSalaryRequiredError}
                    helperText={
                      basicSalaryError ?? (showBasicSalaryRequiredError ? "Basic salary is required." : "")
                    }
                    required
                    disabled={loadingEmployee}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    name="travelAllowance"
                    label="Travel Allowance"
                    value={formState.travelAllowance}
                    onChange={handleInputChange}
                    disabled={loadingEmployee}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 6 }}>
                  <CustomTextField
                    name="otherAllowance"
                    label="Other Allowance"
                    value={formState.otherAllowance}
                    onChange={handleInputChange}
                    disabled={loadingEmployee}
                  />
                </Grid2>
              </Grid2>

              {employeeId && (
                <Stack spacing={2} sx={{ width: "100%" }}>
                  <SectionHeader label="Status" />
                  <FormControlLabel
                    control={
                      <CustomCheckbox
                        name="active"
                        checked={formState.active}
                        onChange={handleInputChange}
                        disabled={loadingEmployee}
                      />
                    }
                    label="Active"
                    sx={{
                      "& .MuiTypography-root": { fontSize: "0.8rem" },
                    }}
                  />
                </Stack>
              )}
            </Stack>
          </Box>
        </BlankCard>

        <SummaryCard data={salarySummary} title="Salary Summary" />
      </Stack>

      <ConfirmationDialog
        open={isResetDialogOpen}
        onClose={handleCancelReset}
        onConfirm={handleConfirmReset}
        alertType="clearConfirmation"
        isLoading={false}
        description="Any unsaved changes will be lost."
      />

      <ConfirmationDialog
        open={isBackDialogOpen}
        onClose={handleCancelBack}
        onConfirm={handleConfirmBack}
        alertType="clearUnsavedData"
        isLoading={false}
        description="Any unsaved changes will be lost."
      />

      <ConfirmationDialog
        open={isSalaryConfirmDialogOpen}
        onClose={handleCancelSalaryConfirm}
        onConfirm={handleConfirmSalaryConfirm}
        alertType="custom"
        isLoading={submissionState === "submitting"}
        title="Confirm Salary"
        description="Basic salary is less than or equal to the total allowances. Are you sure about that?"
      />
    </PageContainer>
  );
};

export default EmployeeEditForm;


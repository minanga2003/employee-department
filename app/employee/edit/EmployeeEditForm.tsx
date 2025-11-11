"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid";

import CustomAutocomplete from "@/components/forms/drop-down/custom-auto-complete";
import CustomCheckbox from "@/components/forms/checkbox/custom-checkbox";
import CustomDatePicker from "@/components/forms/date-picker/date-picker";
import CustomTextField from "@/components/forms/text-field/custom-text-field";
import BlankCard from "@/components/ui/card/blank-card";
import ButtonLoader from "@/components/ui/buttons/button-loader";
import CustomButtonWithIcon from "@/components/ui/buttons/custom-button-with-icon";
import SummaryCard from "@/components/ui/card/summary-card";
import Breadcrumb from "@/components/ui/breadcrumb/breadcrumb";
import PageContainer from "@/components/layouts/container/page-container";

import { buildApiUrl } from "../../../lib/apiConfig";

type Department = {
  id: number;
  name: string;
};

type Section = {
  id: number;
  name: string;
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

type Option = { label: string; value: string };

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

export const EmployeeEditForm = () => {
  const searchParams = useSearchParams();
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

  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmissionState("idle");
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
          setSections(
            list
              .map((sec) => ({
                id: Number(sec.id),
                name: sec.name,
              }))
              .sort((a, b) => a.name.localeCompare(b.name))
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
    }));
  }, [departments]);

  const sectionOptions = useMemo<Option[]>(() => {
    if (!sections.length) return [];
    return sections.map((section) => ({
      label: section.name,
      value: String(section.id),
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

    if (!formState.sectionId) {
      setSubmissionState("error");
      setSectionError("Section is required.");
      setErrorMessage("Section is required.");
      return;
    }

    if (!trimmedBasicSalary) {
      setSubmissionState("error");
      setBasicSalaryError("Basic salary is required.");
      setErrorMessage("Basic salary is required.");
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
      active: formState.active,
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

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    name="empNo"
                    label="EMP No"
                    value={formState.empNo}
                    onChange={handleInputChange}
                    error={Boolean(empNoError)}
                    helperText={empNoError ?? ""}
                    required
                    disabled={loadingEmployee}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    name="name"
                    label="Name"
                    value={formState.name}
                    onChange={handleInputChange}
                    error={Boolean(nameError)}
                    helperText={nameError ?? ""}
                    required
                    disabled={loadingEmployee}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
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
                      helperText: dobError ?? "",
                      error: Boolean(dobError),
                      required: true,
                    },
                  }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    label="Age"
                    value={formState.age ? `${formState.age} years` : ""}
                    InputProps={{ readOnly: true }}
                    placeholder="Auto-calculated"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomAutocomplete
                    label="Department"
                    options={departmentOptions}
                    value={selectedDepartmentOption}
                    onChange={(_, option) => {
                      setFormState((prev) => ({
                        ...prev,
                        departmentId: option?.value ?? "",
                        sectionId: "",
                      }));
                      setDepartmentError(option ? null : "Department is required.");
                      setSectionError("Section is required.");
                    }}
                    disabled={loadingDepartments}
                    error={Boolean(departmentError)}
                    helperText={
                      loadingDepartments ? "Loading departments…" : departmentError ?? ""
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomAutocomplete
                    label="Section"
                    options={sectionOptions}
                    value={selectedSectionOption}
                    onChange={(_, option) => {
                      setFormState((prev) => ({
                        ...prev,
                        sectionId: option?.value ?? "",
                      }));
                      setSectionError(option ? null : "Section is required.");
                    }}
                    disabled={!formState.departmentId || loadingSections}
                    error={Boolean(sectionError)}
                    helperText={
                      !formState.departmentId
                        ? "Select department first"
                        : loadingSections
                        ? "Loading sections…"
                        : sectionError ?? ""
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    name="email"
                    label="Email"
                    type="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    disabled={loadingEmployee}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    name="basicSalary"
                    label="Basic Salary"
                    value={formState.basicSalary}
                    onChange={handleInputChange}
                    error={Boolean(basicSalaryError)}
                    helperText={basicSalaryError ?? ""}
                    required
                    disabled={loadingEmployee}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    name="travelAllowance"
                    label="Travel Allowance"
                    value={formState.travelAllowance}
                    onChange={handleInputChange}
                    disabled={loadingEmployee}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    name="otherAllowance"
                    label="Other Allowance"
                    value={formState.otherAllowance}
                    onChange={handleInputChange}
                    disabled={loadingEmployee}
                  />
                </Grid>
              </Grid>

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
          </Box>
        </BlankCard>

        <SummaryCard data={salarySummary} title="Salary Summary" />
      </Stack>

      <Dialog
        open={isResetDialogOpen}
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            return;
          }
          handleCancelReset();
        }}
      >
        <DialogTitle>Clear Form</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear all form fields? Any unsaved changes will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelReset}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmReset}>
            Clear
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isBackDialogOpen}
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            return;
          }
          handleCancelBack();
        }}
      >
        <DialogTitle>Leave Page</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to go back? Any unsaved changes will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBack}>Stay</Button>
          <Button color="error" variant="contained" onClick={handleConfirmBack}>
            Go Back
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default EmployeeEditForm;


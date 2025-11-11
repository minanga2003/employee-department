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
  DialogContentText,
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
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardBackspaceRoundedIcon from "@mui/icons-material/KeyboardBackspaceRounded";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CustomAutocomplete from "@/components/forms/drop-down/custom-auto-complete";
import CustomDatePicker from "@/components/forms/date-picker/date-picker";
import CustomTextField from "@/components/forms/text-field/custom-text-field";
import CustomButtonWithIcon from "@/components/ui/buttons/custom-button-with-icon";
import CustomCheckbox from "@/components/forms/checkbox/custom-checkbox";

import { buildApiUrl } from "@/lib/apiConfig";

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

type SubmissionState = "idle" | "submitting";

type Option = { label: string; value: string };

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
  }, [isEditMode, loadedFormState]);

  useEffect(() => {
    if (!open) {
      setIsResetDialogOpen(false);
      setIsBackDialogOpen(false);
      setLoadedFormState(null);
      performReset();
      setDobError(null);
      setNameError(null);
      setEmpNoError(null);
      setDepartmentError(null);
      setSectionError(null);
      setBasicSalaryError(null);
    }
  }, [open, performReset]);

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
        setDobError(
          getAgeValidationMessage(updated.age) ?? (value ? null : "Date of birth is required.")
        );
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

  const handleClose = () => {
    if (submissionState === "submitting" || loadingEmployee) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

    if (!formState.sectionId) {
      setSubmissionState("idle");
      setSectionError("Section is required.");
      setErrorMessage("Section is required.");
      return;
    }

    if (!trimmedBasicSalary) {
      setSubmissionState("idle");
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
      setErrorMessage(err instanceof Error ? err.message : "Failed to save employee.");
    } finally {
      setSubmissionState("idle");
    }
  };

  const isSubmitting = submissionState === "submitting";
  const isBusy = isSubmitting || loadingEmployee;

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
    setIsBackDialogOpen(true);
  };

  const handleCancelBack = () => {
    if (isBusy) return;
    setIsBackDialogOpen(false);
  };

  const handleConfirmBack = () => {
    if (isBusy) return;
    setIsBackDialogOpen(false);
    handleClose();
  };

  return (
    <>
    <Dialog
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      open={open}
      onClose={handleClose}
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
          onClick={handleClose}
          edge="end"
          sx={{ position: "absolute", right: 8, top: 8 }}
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
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 1, sm: 1.5 }}
              justifyContent="flex-start"
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
                  <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        name="empNo"
                        label="EMP No"
                        value={formState.empNo}
                        onChange={handleInputChange}
                        required
                        disabled={isBusy || isEditMode}
                          error={Boolean(empNoError)}
                          helperText={empNoError ?? ""}
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
                        disabled={isBusy}
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
                            setDobError(getAgeValidationMessage(nextAge));
                          }}
                        disabled={isBusy}
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
                    <Grid item xs={12}>
                      <CustomTextField
                        name="email"
                        label="Email"
                        type="email"
                        value={formState.email}
                        onChange={handleInputChange}
                        disabled={isBusy}
                      />
                    </Grid>
                  </Grid>
                </Stack>

                <Stack spacing={2} sx={{ width: "100%" }}>
                  <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
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
                        disabled={loadingDepartments || isBusy}
                          error={Boolean(departmentError)}
                          helperText={
                            loadingDepartments ? "Loading departments..." : departmentError ?? ""
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
                        disabled={!formState.departmentId || loadingSections || isBusy}
                          error={Boolean(sectionError)}
                        helperText={
                          !formState.departmentId
                            ? "Select department first"
                            : loadingSections
                            ? "Loading sections..."
                              : sectionError ?? ""
                        }
                      />
                    </Grid>
                  </Grid>
                </Stack>

                <Stack spacing={2} sx={{ width: "100%" }}>
                  <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        name="basicSalary"
                        label="Basic Salary"
                        value={formState.basicSalary}
                        onChange={handleInputChange}
                        required
                        disabled={isBusy}
                          error={Boolean(basicSalaryError)}
                          helperText={basicSalaryError ?? ""}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        name="travelAllowance"
                        label="Travel Allowance"
                        value={formState.travelAllowance}
                        onChange={handleInputChange}
                        disabled={isBusy}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        name="otherAllowance"
                        label="Other Allowance"
                        value={formState.otherAllowance}
                        onChange={handleInputChange}
                        disabled={isBusy}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        label="Total Salary"
                        value={totalSalaryLabel}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                  </Grid>
                </Stack>

                {isEditMode && (
                  <Stack sx={{ width: "100%" }}>
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
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>

      <Dialog
        open={isResetDialogOpen}
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            if (isBusy) {
              return;
            }
          }
          handleCancelReset();
        }}
      >
        <DialogTitle>Clear Form</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear all form inputs? Unsaved changes will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelReset} disabled={isBusy}>
            Cancel
          </Button>
          <Button onClick={handleConfirmReset} color="error" variant="contained" disabled={isBusy}>
            Clear
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isBackDialogOpen}
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            if (isBusy) {
              return;
            }
          }
          handleCancelBack();
        }}
      >
        <DialogTitle>Close Form</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to go back? Unsaved changes will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBack} disabled={isBusy}>
            Stay
          </Button>
          <Button onClick={handleConfirmBack} color="error" variant="contained" disabled={isBusy}>
            Go Back
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NewEmployeeDialog;


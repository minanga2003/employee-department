"use client";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
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

export type NewEmployeeDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
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

export const NewEmployeeDialog = ({ open, onClose, onCreated }: NewEmployeeDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [formState, setFormState] = useState<FormState>(initialState);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

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

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

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
      if (name === "active") {
        return;
      }
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

  const resetForm = () => {
    setFormState(initialState);
    setSections([]);
    setErrorMessage(null);
    setSubmissionState("idle");
  };

  const handleClose = () => {
    if (submissionState === "submitting") return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionState("submitting");
    setErrorMessage(null);

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
      active: true,
    };

    try {
      if (!payload.departmentId || !payload.sectionId) {
        throw new Error("Please select both department and section.");
      }

      const url = buildApiUrl("/api/employees");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || `Failed to save employee (${response.status})`);
      }

      onCreated?.();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save employee.");
    } finally {
      setSubmissionState("idle");
    }
  };

  return (
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
        New Employee
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
                onClick={resetForm}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Clear
              </CustomButtonWithIcon>
              <CustomButtonWithIcon
                type="button"
                variant="outlined"
                startIcon={<KeyboardBackspaceRoundedIcon fontSize="small" />}
                onClick={handleClose}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Back
              </CustomButtonWithIcon>
              <CustomButtonWithIcon
                type="submit"
                form="new-employee-form"
                variant="outlined"
                disabled={submissionState === "submitting"}
                startIcon={
                  submissionState === "submitting" ? (
                    <CircularProgress size={16} sx={{ color: theme.palette.primary.main }} />
                  ) : (
                    <PlayArrowRoundedIcon fontSize="small" />
                  )
                }
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Save
              </CustomButtonWithIcon>
            </Stack>

            {errorMessage && (
              <Alert severity="error" variant="outlined">
                {errorMessage}
              </Alert>
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
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        name="name"
                        label="Name"
                        value={formState.name}
                        onChange={handleInputChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <CustomDatePicker
                        label="Date of Birth"
                        value={formState.dob}
                        onChange={(value) =>
                          setFormState((prev) => ({
                            ...prev,
                            dob: value ?? "",
                            age: value ? calculateAge(value) : 0,
                          }))
                        }
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
                        required
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
                        }}
                        disabled={loadingDepartments}
                        helperText={loadingDepartments ? "Loading departments..." : ""}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <CustomAutocomplete
                        label="Section"
                        options={sectionOptions}
                        value={selectedSectionOption}
                        onChange={(_, option) =>
                          setFormState((prev) => ({
                            ...prev,
                            sectionId: option?.value ?? "",
                          }))
                        }
                        disabled={!formState.departmentId || loadingSections}
                        helperText={
                          !formState.departmentId
                            ? "Select department first"
                            : loadingSections
                            ? "Loading sections..."
                            : ""
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
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        name="travelAllowance"
                        label="Travel Allowance"
                        value={formState.travelAllowance}
                        onChange={handleInputChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        name="otherAllowance"
                        label="Other Allowance"
                        value={formState.otherAllowance}
                        onChange={handleInputChange}
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

              </Stack>
            </Box>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default NewEmployeeDialog;


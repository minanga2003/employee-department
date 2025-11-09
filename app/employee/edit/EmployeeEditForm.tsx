"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Alert, Box, FormControlLabel, Stack } from "@mui/material";
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

export const EmployeeEditForm = () => {
  const [formState, setFormState] = useState<FormState>(initialState);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
    setSuccessMessage(null);
    setSubmissionState("idle");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionState("submitting");
    setErrorMessage(null);
    setSuccessMessage(null);

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

      setSubmissionState("success");
      setSuccessMessage("Employee saved successfully.");
      setFormState(initialState);
      setSections([]);
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
    <PageContainer title="Employee | Edit">
      <Breadcrumb
        title="Employee Create / Edit"
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
                  Save
                </ButtonLoader>
                <CustomButtonWithIcon variant="outlined" onClick={resetForm}>
                  Clear
                </CustomButtonWithIcon>
                <CustomButtonWithIcon variant="outlined" onClick={() => window.history.back()}>
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
                    helperText={loadingDepartments ? "Loading departments…" : ""}
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
                        ? "Loading sections…"
                        : ""
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
                    required
                  />
                </Grid>
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
              </Grid>

              <FormControlLabel
                control={
                  <CustomCheckbox
                    name="active"
                    checked={formState.active}
                    onChange={handleInputChange}
                  />
                }
                label="Active"
              />
            </Stack>
          </Box>
        </BlankCard>

        <SummaryCard data={salarySummary} title="Salary Summary" />
      </Stack>
    </PageContainer>
  );
};

export default EmployeeEditForm;


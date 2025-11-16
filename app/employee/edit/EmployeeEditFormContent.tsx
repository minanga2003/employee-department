"use client";

import { ChangeEvent, FormEvent } from "react";
import { Alert, Box, FormControlLabel, Stack } from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import CustomAutocomplete from "@/components/forms/drop-down/custom-auto-complete";
import CustomCheckbox from "@/components/forms/checkbox/custom-checkbox";
import CustomDatePicker from "@/components/forms/date-picker/date-picker";
import CustomTextField from "@/components/forms/text-field/custom-text-field";
import BlankCard from "@/components/ui/card/blank-card";
import ButtonLoader from "@/components/ui/buttons/button-loader";
import CustomButtonWithIcon from "@/components/ui/buttons/custom-button-with-icon";
import SummaryCard from "@/components/ui/card/summary-card";
import CustomDivider from "@/components/ui/divider/custom-divider";
import SectionHeader from "../components/SectionHeader";
import type { FormState, Option, SalarySummaryItem } from "./EmployeeEditForm";

const FORM_ID = "employee-edit-form";

type EmployeeEditFormContentProps = {
  isEditMode: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
  isSubmitting: boolean;
  handleRequestReset: () => void;
  handleRequestBack: () => void;
  formState: FormState;
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleDobChange: (value: string | null) => void;
  departmentOptions: Option[];
  sectionOptions: Option[];
  selectedDepartmentOption: Option | null;
  selectedSectionOption: Option | null;
  handleDepartmentChange: (option: Option | null) => void;
  handleSectionChange: (option: Option | null) => void;
  loadingDepartments: boolean;
  loadingSections: boolean;
  loadingEmployee: boolean;
  departmentError: string | null;
  sectionError: string | null;
  basicSalaryError: string | null;
  dobError: string | null;
  nameError: string | null;
  empNoError: string | null;
  showEmpNoRequiredError: boolean;
  showNameRequiredError: boolean;
  showDobRequiredError: boolean;
  showDepartmentRequiredError: boolean;
  showSectionRequiredError: boolean;
  showBasicSalaryRequiredError: boolean;
  hasAttemptedSubmit: boolean;
  requiredFieldsFilled: boolean;
  salarySummary: SalarySummaryItem[];
};

const EmployeeEditFormContent = ({
  isEditMode,
  errorMessage,
  successMessage,
  handleSubmit,
  isSubmitting,
  handleRequestReset,
  handleRequestBack,
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
  hasAttemptedSubmit,
  requiredFieldsFilled,
  salarySummary,
}: EmployeeEditFormContentProps) => (
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
      <Box component="form" id={FORM_ID} onSubmit={handleSubmit} sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <ButtonLoader type="submit" variant="contained" loading={isSubmitting} disabled={isSubmitting}>
              {isEditMode ? "Update" : "Save"}
            </ButtonLoader>
            <CustomButtonWithIcon variant="outlined" onClick={handleRequestReset}>
              Clear
            </CustomButtonWithIcon>
            <CustomButtonWithIcon variant="outlined" onClick={handleRequestBack} disabled={isSubmitting}>
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
                onChange={handleDobChange}
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
                onChange={(_, option) => handleDepartmentChange(option)}
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
                onChange={(_, option) => handleSectionChange(option)}
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

          {isEditMode && (
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
                sx={{ "& .MuiTypography-root": { fontSize: "0.8rem" } }}
              />
            </Stack>
          )}
        </Stack>
      </Box>
    </BlankCard>

    <SummaryCard data={salarySummary} title="Salary Summary" />
  </Stack>
);

export default EmployeeEditFormContent;

"use client";

import { ChangeEvent, FormEvent } from "react";
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
import type { FormState, Option, SalarySummaryItem } from "./EmployeeEditForm";

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

type EmployeeEditFormViewProps = {
  isEditMode: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
  isSubmitting: boolean;
  handleRequestReset: () => void;
  handleRequestBack: () => void;
  handleCancelReset: () => void;
  handleConfirmReset: () => void;
  isResetDialogOpen: boolean;
  handleCancelBack: () => void;
  handleConfirmBack: () => void;
  isBackDialogOpen: boolean;
  handleCancelSalaryConfirm: () => void;
  handleConfirmSalaryConfirm: () => void;
  isSalaryConfirmDialogOpen: boolean;
  hasAttemptedSubmit: boolean;
  requiredFieldsFilled: boolean;
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
  salarySummary: SalarySummaryItem[];
};

const EmployeeEditFormView = ({
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
}: EmployeeEditFormViewProps) => {
  return (
    <PageContainer title={isEditMode ? "Employee | Edit" : "Employee | Create"}>
      <Breadcrumb
        title={isEditMode ? "Employee Edit" : "Employee Create"}
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
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isEditMode ? "Update" : "Save"}
                </ButtonLoader>
                <CustomButtonWithIcon variant="outlined" onClick={handleRequestReset}>
                  Clear
                </CustomButtonWithIcon>
                <CustomButtonWithIcon
                  variant="outlined"
                  onClick={handleRequestBack}
                  disabled={isSubmitting}
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
        isLoading={isSubmitting}
        title="Confirm Salary"
        description="The total allowances are more than the basic salary. Are you sure about that?"
      />
    </PageContainer>
  );
};
export default EmployeeEditFormView;
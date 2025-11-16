"use client";

import { ChangeEvent, FormEvent } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import CustomAutocomplete from "@/components/forms/drop-down/custom-auto-complete";
import CustomDatePicker from "@/components/forms/date-picker/date-picker";
import CustomTextField from "@/components/forms/text-field/custom-text-field";
import CustomButtonWithIcon from "@/components/ui/buttons/custom-button-with-icon";
import CustomDivider from "@/components/ui/divider/custom-divider";
import CustomCheckbox from "@/components/forms/checkbox/custom-checkbox";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import KeyboardBackspaceRoundedIcon from "@mui/icons-material/KeyboardBackspaceRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import SectionHeader from "./SectionHeader";
import type { FormState, Option } from "./NewEmployeeDialog";

const formatAgeLabel = (age: number) => (age ? `${age} years` : "");

export type NewEmployeeDialogFormContentProps = {
  formId: string;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  errorMessage: string | null;
  loadingEmployee: boolean;
  formState: FormState;
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleDobChange: (value: string | null) => void;
  isBusy: boolean;
  isSubmitting: boolean;
  empNoError: string | null;
  nameError: string | null;
  dobError: string | null;
  departmentError: string | null;
  sectionError: string | null;
  basicSalaryError: string | null;
  showEmpNoRequiredError: boolean;
  showNameRequiredError: boolean;
  showDobRequiredError: boolean;
  showDepartmentRequiredError: boolean;
  showSectionRequiredError: boolean;
  showBasicSalaryRequiredError: boolean;
  departmentOptions: Option[];
  sectionOptions: Option[];
  selectedDepartmentOption: Option | null;
  selectedSectionOption: Option | null;
  handleDepartmentChange: (option: Option | null) => void;
  handleSectionChange: (option: Option | null) => void;
  loadingDepartments: boolean;
  loadingSections: boolean;
  totalSalaryLabel: string;
  handleRequestReset: () => void;
  handleRequestBack: () => void;
  hasAttemptedSubmit: boolean;
  requiredFieldsFilled: boolean;
  isEditMode: boolean;
};

const NewEmployeeDialogFormContent = ({
  formId,
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
  hasAttemptedSubmit,
  requiredFieldsFilled,
  isEditMode,
}: NewEmployeeDialogFormContentProps) => {
  return (
    <Box
      component="form"
      id={formId}
      onSubmit={handleSubmit}
      sx={{
        p: { xs: 2.5, sm: 3 },
        backgroundColor: "background.paper",
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
                    onChange={handleDobChange}
                    disabled={isBusy}
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
                    value={formatAgeLabel(formState.age)}
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
                    onChange={(_, option) => handleDepartmentChange(option)}
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
                    onChange={(_, option) => handleSectionChange(option)}
                    disabled={!formState.departmentId || loadingSections || isBusy}
                    error={Boolean(sectionError) || showSectionRequiredError}
                    helperText={
                      !formState.departmentId
                        ? "Select department first"
                        : loadingSections
                        ? "Loading sections..."
                        : sectionError ?? (showSectionRequiredError ? "Section is required." : "")
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
                  sx={{ "& .MuiTypography-root": { fontSize: "0.85rem" } }}
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
          sx={{ width: "100%", flexWrap: { sm: "wrap" }, rowGap: { sm: 1 } }}
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
            form={formId}
            variant="outlined"
            disabled={isBusy}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} sx={{ color: "primary.main" }} />
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
  );
};

export default NewEmployeeDialogFormContent;

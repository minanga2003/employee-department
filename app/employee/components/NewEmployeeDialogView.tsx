"use client";

import { ChangeEvent, FormEvent } from "react";
import { Dialog, DialogContent, DialogTitle, IconButton, useMediaQuery, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NewEmployeeDialogFormContent from "./NewEmployeeDialogFormContent";
import NewEmployeeDialogConfirmationDialogs from "./NewEmployeeDialogConfirmationDialogs";
import type { FormState, Option } from "./NewEmployeeDialog";

const FORM_ID = "new-employee-form";

type NewEmployeeDialogViewProps = {
  open: boolean;
  isEditMode: boolean;
  requestClose: () => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
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
};

const NewEmployeeDialogView = ({
  open,
  isEditMode,
  requestClose,
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
}: NewEmployeeDialogViewProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

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
        <DialogContent dividers sx={{ p: 0, overflowX: "hidden" }}>
          <NewEmployeeDialogFormContent
            formId={FORM_ID}
            handleSubmit={handleSubmit}
            errorMessage={errorMessage}
            loadingEmployee={loadingEmployee}
            formState={formState}
            handleInputChange={handleInputChange}
            handleDobChange={handleDobChange}
            isBusy={isBusy}
            isSubmitting={isSubmitting}
            empNoError={empNoError}
            nameError={nameError}
            dobError={dobError}
            departmentError={departmentError}
            sectionError={sectionError}
            basicSalaryError={basicSalaryError}
            showEmpNoRequiredError={showEmpNoRequiredError}
            showNameRequiredError={showNameRequiredError}
            showDobRequiredError={showDobRequiredError}
            showDepartmentRequiredError={showDepartmentRequiredError}
            showSectionRequiredError={showSectionRequiredError}
            showBasicSalaryRequiredError={showBasicSalaryRequiredError}
            departmentOptions={departmentOptions}
            sectionOptions={sectionOptions}
            selectedDepartmentOption={selectedDepartmentOption}
            selectedSectionOption={selectedSectionOption}
            handleDepartmentChange={handleDepartmentChange}
            handleSectionChange={handleSectionChange}
            loadingDepartments={loadingDepartments}
            loadingSections={loadingSections}
            totalSalaryLabel={totalSalaryLabel}
            handleRequestReset={handleRequestReset}
            handleRequestBack={handleRequestBack}
            hasAttemptedSubmit={hasAttemptedSubmit}
            requiredFieldsFilled={requiredFieldsFilled}
            isEditMode={isEditMode}
          />
        </DialogContent>
      </Dialog>

      <NewEmployeeDialogConfirmationDialogs
        isResetDialogOpen={isResetDialogOpen}
        handleCancelReset={handleCancelReset}
        handleConfirmReset={handleConfirmReset}
        isBackDialogOpen={isBackDialogOpen}
        handleCancelBack={handleCancelBack}
        handleConfirmBack={handleConfirmBack}
        isSalaryConfirmDialogOpen={isSalaryConfirmDialogOpen}
        handleCancelSalaryConfirm={handleCancelSalaryConfirm}
        handleConfirmSalaryConfirm={handleConfirmSalaryConfirm}
        isBusy={isBusy}
      />
    </>
  );
};

export default NewEmployeeDialogView;

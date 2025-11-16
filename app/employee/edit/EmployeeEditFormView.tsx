"use client";

import { ChangeEvent, FormEvent } from "react";
import PageContainer from "@/components/layouts/container/page-container";
import Breadcrumb from "@/components/ui/breadcrumb/breadcrumb";
import type { FormState, Option, SalarySummaryItem } from "./EmployeeEditForm";
import EmployeeEditFormContent from "./EmployeeEditFormContent";
import EmployeeEditConfirmationDialogs from "./EmployeeEditConfirmationDialogs";

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

/**
 * Binds controller props to material layout components. Form logic stays in
 * `EmployeeEditForm`, ensuring this view can remain stateless.
 */
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
}: EmployeeEditFormViewProps) => (
  <PageContainer title={isEditMode ? "Employee | Edit" : "Employee | Create"}>
    <Breadcrumb title={isEditMode ? "Employee Edit" : "Employee Create"} onBackClick={() => window.history.back()} />

    <EmployeeEditFormContent
      isEditMode={isEditMode}
      errorMessage={errorMessage}
      successMessage={successMessage}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      handleRequestReset={handleRequestReset}
      handleRequestBack={handleRequestBack}
      formState={formState}
      handleInputChange={handleInputChange}
      handleDobChange={handleDobChange}
      departmentOptions={departmentOptions}
      sectionOptions={sectionOptions}
      selectedDepartmentOption={selectedDepartmentOption}
      selectedSectionOption={selectedSectionOption}
      handleDepartmentChange={handleDepartmentChange}
      handleSectionChange={handleSectionChange}
      loadingDepartments={loadingDepartments}
      loadingSections={loadingSections}
      loadingEmployee={loadingEmployee}
      departmentError={departmentError}
      sectionError={sectionError}
      basicSalaryError={basicSalaryError}
      dobError={dobError}
      nameError={nameError}
      empNoError={empNoError}
      showEmpNoRequiredError={showEmpNoRequiredError}
      showNameRequiredError={showNameRequiredError}
      showDobRequiredError={showDobRequiredError}
      showDepartmentRequiredError={showDepartmentRequiredError}
      showSectionRequiredError={showSectionRequiredError}
      showBasicSalaryRequiredError={showBasicSalaryRequiredError}
      hasAttemptedSubmit={hasAttemptedSubmit}
      requiredFieldsFilled={requiredFieldsFilled}
      salarySummary={salarySummary}
    />

    <EmployeeEditConfirmationDialogs
      isResetDialogOpen={isResetDialogOpen}
      handleCancelReset={handleCancelReset}
      handleConfirmReset={handleConfirmReset}
      isBackDialogOpen={isBackDialogOpen}
      handleCancelBack={handleCancelBack}
      handleConfirmBack={handleConfirmBack}
      isSalaryConfirmDialogOpen={isSalaryConfirmDialogOpen}
      handleCancelSalaryConfirm={handleCancelSalaryConfirm}
      handleConfirmSalaryConfirm={handleConfirmSalaryConfirm}
      isSubmitting={isSubmitting}
    />
  </PageContainer>
);

export default EmployeeEditFormView;

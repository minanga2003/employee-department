"use client";

import ConfirmationDialog from "@/components/ui/dialog-box/confirmation-dialog";

type EmployeeEditConfirmationDialogsProps = {
  isResetDialogOpen: boolean;
  handleCancelReset: () => void;
  handleConfirmReset: () => void;
  isBackDialogOpen: boolean;
  handleCancelBack: () => void;
  handleConfirmBack: () => void;
  isSalaryConfirmDialogOpen: boolean;
  handleCancelSalaryConfirm: () => void;
  handleConfirmSalaryConfirm: () => void;
  isSubmitting: boolean;
};

const EmployeeEditConfirmationDialogs = ({
  isResetDialogOpen,
  handleCancelReset,
  handleConfirmReset,
  isBackDialogOpen,
  handleCancelBack,
  handleConfirmBack,
  isSalaryConfirmDialogOpen,
  handleCancelSalaryConfirm,
  handleConfirmSalaryConfirm,
  isSubmitting,
}: EmployeeEditConfirmationDialogsProps) => (
  <>
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
  </>
);

export default EmployeeEditConfirmationDialogs;

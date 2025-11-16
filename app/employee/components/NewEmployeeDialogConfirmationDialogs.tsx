"use client";

import ConfirmationDialog from "@/components/ui/dialog-box/confirmation-dialog";

type NewEmployeeDialogConfirmationDialogsProps = {
  isResetDialogOpen: boolean;
  handleCancelReset: () => void;
  handleConfirmReset: () => void;
  isBackDialogOpen: boolean;
  handleCancelBack: () => void;
  handleConfirmBack: () => void;
  isSalaryConfirmDialogOpen: boolean;
  handleCancelSalaryConfirm: () => void;
  handleConfirmSalaryConfirm: () => void;
  isBusy: boolean;
};

const NewEmployeeDialogConfirmationDialogs = ({
  isResetDialogOpen,
  handleCancelReset,
  handleConfirmReset,
  isBackDialogOpen,
  handleCancelBack,
  handleConfirmBack,
  isSalaryConfirmDialogOpen,
  handleCancelSalaryConfirm,
  handleConfirmSalaryConfirm,
  isBusy,
}: NewEmployeeDialogConfirmationDialogsProps) => (
  <>
    <ConfirmationDialog
      open={isResetDialogOpen}
      onClose={handleCancelReset}
      onConfirm={handleConfirmReset}
      alertType="clearConfirmation"
      isLoading={isBusy}
      description=""
    />

    <ConfirmationDialog
      open={isBackDialogOpen}
      onClose={handleCancelBack}
      onConfirm={handleConfirmBack}
      alertType="clearUnsavedData"
      isLoading={isBusy}
      description=""
    />

    <ConfirmationDialog
      open={isSalaryConfirmDialogOpen}
      onClose={handleCancelSalaryConfirm}
      onConfirm={handleConfirmSalaryConfirm}
      alertType="custom"
      isLoading={isBusy}
      title="Confirm Salary"
      description="The total allowances are more than the basic salary. Are you sure about that"
    />
  </>
);

export default NewEmployeeDialogConfirmationDialogs;

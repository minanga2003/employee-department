import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  CircularProgress,
  Box,
  Divider,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  WarningAmber as WarningAmberIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning,
} from '@mui/icons-material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CustomButtonWithIcon from '@/components/ui/buttons/custom-button-with-icon';

const AlertType = {
  deleteConfirmation: {
    title: 'Delete Confirmation',
    message: 'Are you sure you want to delete this record',
    icon: <DeleteIcon />,
    color: '#f44336',
  },
  deleteWarningConfirmation: {
    title: 'Delete Confirmation',
    message: '',
    icon: <Warning />,
    color: '#f44336',
  },
  confirmProceed: {
    title: 'Proceed Confirmation',
    message: '',
    icon: <Warning />,
    color: '#f44336',
  },
  clearConfirmation: {
    title: 'Clear Confirmation',
    message: 'Are you sure you want to clear this data',
    icon: <WarningIcon />,
    color: '#ed6c02',
  },
  clearUnsavedData: {
    title: 'Clear Data',
    message: 'Are you sure you want to go back',
    icon: <WarningAmberIcon />,
    color: '#ed6c02',
  },
  defaultAlert: {
    title: 'Alert',
    message: '',
    icon: <InfoIcon />,
    color: '#1976d2',
  },
  custom: {
    title: 'Confirmation',
    message: '',
    icon: <CheckCircleIcon />,
    color: '#2e7d32',
  },
};

interface IConfirmationDialogProps {
  open: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  alertType: keyof typeof AlertType | 'custom';
  isLoading: boolean;
  description?: string;
  showQuestionMark?: boolean;
  customContent?: React.ReactNode;
  title?: string;
}

const ConfirmationDialog: React.FC<IConfirmationDialogProps> = ({
  open,
  onClose = () => {},
  onConfirm = () => {},
  alertType,
  isLoading,
  description,
  showQuestionMark = true,
  customContent,
  title: customTitle,
}) => {
  const theme = useTheme();
  const alertConfig = AlertType[alertType] || AlertType.defaultAlert;
  const { title, message, icon, color } = alertConfig;
  const iconColor = alpha(color, 0.6);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, pb: 1 }}>
        {icon && (
          <Box sx={{ color: iconColor, mr: 1 }}>
            {React.cloneElement(icon, { style: { color: iconColor } })}
          </Box>
        )}
        <DialogTitle sx={{ p: 0, flex: 1 }}>
          {customTitle || title}
        </DialogTitle>
      </Box>
      <DialogContent>
        <Typography variant="body1" color="textSecondary">
          {description ? `${message} ${description}` : message}
          {showQuestionMark && !customContent && <span>?</span>}
        </Typography>
        {customContent && customContent}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ justifyContent: 'flex-start', gap: 1, pl: 3 }}>
        {isLoading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          <CustomButtonWithIcon
            variant="contained"
            buttonColor={theme.palette.success.main}
            buttonBorderColor={theme.palette.success.main}
            buttonTextColor={theme.palette.common.white}
            onClick={onConfirm}
          >
            YES
          </CustomButtonWithIcon>
        )}
        <CustomButtonWithIcon
          variant="outlined"
          buttonBorderColor={theme.palette.error.main}
          buttonTextColor={theme.palette.error.main}
          onClick={onClose}
        >
          NO
        </CustomButtonWithIcon>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;


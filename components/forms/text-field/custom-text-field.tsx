import { forwardRef } from "react";
import { TextField, TextFieldProps } from "@mui/material";
import { styled } from "@mui/material/styles";

export type CustomTextFieldProps = TextFieldProps;

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 6,
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.grey[300],
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.dark,
    },
    "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.grey[200],
    },
  },
  "& .MuiOutlinedInput-input": {
    height: 32,
    padding: "0 14px",
    fontSize: "0.8rem",
  },
  "& .MuiInputLabel-root": {
    transform: "translate(14px, -8px) scale(0.8)",
    backgroundColor: theme.palette.background.paper,
    padding: "0 4px",
    fontSize: "0.85rem",
  },
  "& .MuiInputLabel-shrink": {
    transform: "translate(14px, -8px) scale(0.8)",
  },
  "& .MuiOutlinedInput-input::placeholder": {
    color: theme.palette.text.secondary,
    opacity: 0.85,
    fontSize: "0.8rem",
  },
  "& .MuiOutlinedInput-input.Mui-disabled::placeholder": {
    color: theme.palette.text.secondary,
    opacity: 1,
  },
  "& .MuiOutlinedInput-root.Mui-disabled": {
    backgroundColor: theme.palette.grey[100],
  },
}));

const CustomTextField = forwardRef<HTMLInputElement, CustomTextFieldProps>(
  ({ fullWidth = true, size = "small", ...props }, ref) => (
    <StyledTextField ref={ref} fullWidth={fullWidth} size={size} {...props} />
  )
);

CustomTextField.displayName = "CustomTextField";

export default CustomTextField;
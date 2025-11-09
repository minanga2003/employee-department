import { forwardRef } from "react";
import { TextField, TextFieldProps } from "@mui/material";

export type CustomTextFieldProps = TextFieldProps;

const CustomTextField = forwardRef<HTMLInputElement, CustomTextFieldProps>(
  ({ fullWidth = true, size = "small", ...props }, ref) => (
    <TextField ref={ref} fullWidth={fullWidth} size={size} {...props} />
  )
);

CustomTextField.displayName = "CustomTextField";

export default CustomTextField;


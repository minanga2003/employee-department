import { forwardRef } from "react";
import { Checkbox, CheckboxProps } from "@mui/material";

export type CustomCheckboxProps = CheckboxProps;

const CustomCheckbox = forwardRef<HTMLInputElement, CustomCheckboxProps>(
  ({ size = "small", ...props }, ref) => (
    <Checkbox ref={ref} size={size} color="primary" {...props} />
  )
);

CustomCheckbox.displayName = "CustomCheckbox";

export default CustomCheckbox;


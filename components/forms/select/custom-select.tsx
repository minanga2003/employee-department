import { forwardRef } from "react";
import { Select, SelectProps } from "@mui/material";

export type CustomSelectProps = SelectProps;

const CustomSelect = forwardRef<HTMLInputElement, CustomSelectProps>(
  ({ size = "small", ...props }, ref) => (
    <Select
      inputRef={ref}
      size={size}
      variant="outlined"
      displayEmpty
      {...props}
    />
  )
);

CustomSelect.displayName = "CustomSelect";

export default CustomSelect;


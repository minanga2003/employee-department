import { Divider, DividerProps } from "@mui/material";

const CustomDivider = (props: DividerProps) => (
  <Divider
    sx={{
      my: 1,
      borderColor: (theme) => theme.palette.grey[300],
    }}
    {...props}
  />
);

export default CustomDivider;


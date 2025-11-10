"use client";

import { forwardRef, type ReactNode } from "react";
import { styled } from "@mui/material/styles";
import Button, { ButtonProps } from "@mui/material/Button";

export type CustomButtonWithIconProps = ButtonProps & {
  startIcon?: ReactNode;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonBorderColor?: string;
};

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) =>
    prop !== "buttonColor" && prop !== "buttonTextColor" && prop !== "buttonBorderColor",
})<CustomButtonWithIconProps>(({ theme, buttonColor, buttonTextColor, buttonBorderColor, variant }) => ({
  textTransform: "none",
  minWidth: "auto",
  height: "32px",
  borderRadius: 6,
  padding: "6px 12px",
  fontSize: "0.8rem",
  lineHeight: 1.75,
  borderWidth: 1,
  borderStyle: "solid",
  backgroundColor: variant === "contained" ? buttonColor ?? theme.palette.primary.main : "transparent",
  fontWeight: 500,
  borderColor: buttonBorderColor ?? theme.palette.primary.main,
  color:
    variant === "contained"
      ? buttonTextColor ?? theme.palette.common.white
      : buttonTextColor ?? theme.palette.primary.main,
  "& .MuiSvgIcon-root": {
    color:
      variant === "contained"
        ? buttonColor ?? theme.palette.common.white
        : buttonColor ?? theme.palette.primary.main,
  },
  "&:hover": {
    borderWidth: 1,
    backgroundColor:
      variant === "contained"
        ? buttonColor ?? theme.palette.primary.dark
        : buttonColor ?? theme.palette.primary.main,
    color: theme.palette.common.white,
    borderColor: buttonBorderColor ?? theme.palette.primary.main,
    boxShadow: "none",
    "& .MuiSvgIcon-root": {
      color: theme.palette.common.white,
    },
  },
  "&:active": {
    boxShadow: "none",
    backgroundColor:
      variant === "contained" ? buttonColor ?? theme.palette.primary.dark : theme.palette.primary.dark,
    borderColor: buttonBorderColor ?? theme.palette.primary.dark,
  },
  "&:focus": {
    boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
  },
  "&.Mui-disabled": {
    borderColor: theme.palette.grey[200],
    color: theme.palette.grey[400],
  },
}));

const CustomButtonWithIcon = forwardRef<HTMLButtonElement, CustomButtonWithIconProps>(
  ({ variant = "outlined", size = "small", disableRipple = true, ...props }, ref) => (
    <StyledButton ref={ref} variant={variant} size={size} disableRipple={disableRipple} {...props} />
  )
);

CustomButtonWithIcon.displayName = "CustomButtonWithIcon";

export default CustomButtonWithIcon;


"use client";

import { forwardRef, type ReactNode } from "react";
import { Button, ButtonProps, CircularProgress } from "@mui/material";

export type ButtonLoaderProps = ButtonProps & {
  children: ReactNode;
  loading?: boolean;
  loadercolor?: string;
};

const ButtonLoader = forwardRef<HTMLButtonElement, ButtonLoaderProps>(
  ({ loading = false, loadercolor, disabled, children, sx, size = "small", ...props }, ref) => (
    <Button
      ref={ref}
      disabled={loading || disabled}
      size={size}
      sx={{ minHeight: 36, fontSize: "0.8rem", textTransform: "none", ...sx }}
      {...props}
    >
      {loading ? <CircularProgress size={16} sx={{ color: loadercolor ?? "inherit" }} /> : children}
    </Button>
  )
);

ButtonLoader.displayName = "ButtonLoader";

export default ButtonLoader;


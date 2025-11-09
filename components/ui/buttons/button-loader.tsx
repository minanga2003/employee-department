"use client";

import { forwardRef, type ReactNode } from "react";
import { Button, ButtonProps, CircularProgress } from "@mui/material";

export type ButtonLoaderProps = ButtonProps & {
  children: ReactNode;
  loading?: boolean;
  loadercolor?: string;
};

const ButtonLoader = forwardRef<HTMLButtonElement, ButtonLoaderProps>(
  ({ loading = false, loadercolor, disabled, children, sx, ...props }, ref) => (
    <Button ref={ref} disabled={loading || disabled} sx={{ minHeight: 52, ...sx }} {...props}>
      {loading ? <CircularProgress size={18} sx={{ color: loadercolor ?? "inherit" }} /> : children}
    </Button>
  )
);

ButtonLoader.displayName = "ButtonLoader";

export default ButtonLoader;


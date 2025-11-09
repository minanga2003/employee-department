"use client";

import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

import { baselightTheme } from "./default-colors";

export const AppThemeProvider = ({ children }: { children: ReactNode }) => (
  <ThemeProvider theme={baselightTheme}>{children}</ThemeProvider>
);

export { baselightTheme };

export default baselightTheme;


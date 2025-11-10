"use client";

import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, NoSsr } from "@mui/material";
import type { ReactNode } from "react";

import { baselightTheme } from "./default-colors";

export const AppThemeProvider = ({ children }: { children: ReactNode }) => (
  <ThemeProvider theme={baselightTheme}>
    <NoSsr>
      <CssBaseline />
    </NoSsr>
    {children}
  </ThemeProvider>
);

export { baselightTheme };

export default baselightTheme;


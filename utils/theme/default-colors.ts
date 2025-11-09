import { createTheme } from "@mui/material/styles";

export const baselightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
      light: "#E3F2FD",
      dark: "#115293",
    },
    secondary: {
      main: "#9c27b0",
      light: "#F3E5F5",
      dark: "#6d1b7b",
    },
    background: {
      default: "#f7f9fc",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    body2: {
      fontSize: "0.875rem",
    },
  },
});

export default baselightTheme;


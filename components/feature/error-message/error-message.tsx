import React from "react";

import { Alert, AlertTitle, Box, Typography, Stack } from "@mui/material";

import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import theme from "@/utils/theme";

interface GlobalErrorProps {
  message?: string;
  error?: unknown;
}

const GlobalError: React.FC<GlobalErrorProps> = ({ message = "Something went wrong", error }) => {
  if (error) {
  }

  return (
    <Box
      sx={{
        maxWidth: 500,
        margin: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        textAlign: "center",
        p: 3,
        borderRadius: 1,
        backgroundColor: theme.palette.error.contrastText,
        mt: 10,
      }}
    >
      <Alert 
        severity="error"
        icon={<ErrorOutlineIcon sx={{ fontSize: "34px" }} />}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          p: 0,
          backgroundColor: theme.palette.error.contrastText,
          fontSize: "18px",
        }}
      >
        {/* Stack for Icon and Message in One Line */}
        <Stack direction="row"  alignItems="center" sx={{ width: "100%", p: 0 }}>
          {/* <ErrorOutlineIcon fontSize="large" color="error" /> */}
          <Typography variant="h4" fontWeight="bold" color="error">
            ERROR 
          </Typography>
        </Stack>
      </Alert>
      <Typography variant="body1" fontSize="18px" fontWeight="500" color="text.primary" mt={1} sx={{ textAlign: "center",textTransform: "capitalize",letterSpacing: "1px" }}>
      {`Error loading ${message} Details`} 
      </Typography>
      <Typography variant="body2" fontSize="16px" color="text.secondary" mt={1}>
        Please try again later.
      </Typography>
    </Box>
  );
};

export default GlobalError;


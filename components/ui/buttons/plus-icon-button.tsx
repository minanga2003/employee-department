"use client";

import React from "react";
import AddIcon from "@mui/icons-material/Add";
import Button, { ButtonProps } from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";

export type PlusIconButtonProps = ButtonProps;

const PlusIconButton: React.FC<PlusIconButtonProps> = ({ disabled = false, sx, ...props }) => {
  const buttonSx: SxProps<Theme> = {
    borderRadius: "50%",
    minWidth: "30px",
    width: "30px",
    height: "30px",
    padding: 0,
    "& .MuiButton-startIcon": {
      margin: 0,
      position: "static",
    },
    ...(sx || {}),
  };

  return (
    <Button variant="contained" color="primary" disabled={disabled} sx={buttonSx} {...props}>
      <AddIcon fontSize="small" />
    </Button>
  );
};

export default PlusIconButton;


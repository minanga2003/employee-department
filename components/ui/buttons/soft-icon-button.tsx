"use client";

import { alpha, styled } from "@mui/material/styles";
import IconButton, { IconButtonProps } from "@mui/material/IconButton";

export type SoftIconButtonProps = IconButtonProps & {
  rounded?: number;
};

const getMainColor = (color: IconButtonProps["color"], palette: any) => {
  switch (color) {
    case "primary":
      return palette.primary.main;
    case "secondary":
      return palette.secondary.main;
    case "error":
      return palette.error.main;
    case "success":
      return palette.success.main;
    case "warning":
      return palette.warning.main;
    case "info":
      return palette.info.main;
    default:
      return palette.grey[500];
  }
};

export const SoftIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "rounded",
})<SoftIconButtonProps>(({ theme, color = "default", rounded = 2 }) => {
  const main = getMainColor(color, theme.palette);
  return {
    width: 40,
    height: 40,
    borderRadius: rounded ?? 10,
    backgroundColor: alpha(main, color === "default" ? 0.06 : 0.10),
    color: main,
    boxShadow: "none",
    "&:hover": {
      backgroundColor: alpha(main, color === "default" ? 0.12 : 0.18),
      boxShadow: "none",
    },
    "&.Mui-disabled": {
      backgroundColor: alpha(theme.palette.grey[500], 0.06),
      color: theme.palette.grey[400],
    },
    "& .MuiSvgIcon-root": {
      fontSize: 20,
    },
  };
});

export default SoftIconButton;



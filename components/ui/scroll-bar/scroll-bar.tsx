"use client";

import { ReactNode } from "react";
import { Box, styled } from "@mui/material";

export type ScrollableBoxProps = {
  children: ReactNode;
  height?: string;
};

const StyledBox = styled(Box)(({ theme }) => ({
  overflowY: "auto",
  scrollbarWidth: "thin",
  scrollbarColor: `${theme.palette.primary.main} ${theme.palette.grey[100]}`,
  scrollBehavior: "smooth",
  "&::-webkit-scrollbar": {
    width: 3,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.primary.main,
    borderRadius: 8,
    transition: "background-color 0.3s ease",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: theme.palette.grey[200],
    borderRadius: 10,
  },
}));

const ScrollableBox = ({ children, height = "70vh" }: ScrollableBoxProps) => {
  return <StyledBox sx={{ maxHeight: height }}>{children}</StyledBox>;
};

export default ScrollableBox;


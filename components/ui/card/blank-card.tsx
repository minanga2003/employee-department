"use client";

import { forwardRef, ReactNode } from "react";
import { Card, CardProps } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export type BlankCardProps = CardProps & {
  children: ReactNode;
};

const BlankCard = forwardRef<HTMLDivElement, BlankCardProps>(
  ({ children, className, sx, variant, ...props }, ref) => {
    const theme = useTheme();

    return (
      <Card
        ref={ref}
        className={className}
        elevation={0}
        variant={variant}
        sx={{
          p: 0,
          position: "relative",
          borderColor: theme.palette.divider,
          ...sx,
        }}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

BlankCard.displayName = "BlankCard";

export default BlankCard;


"use client";

import { forwardRef } from "react";
import { styled } from "@mui/material/styles";
import Tooltip, { TooltipProps } from "@mui/material/Tooltip";
import IconButton, { IconButtonProps } from "@mui/material/IconButton";

export type IconTooltipButtonProps = Omit<IconButtonProps, "title"> & {
  tooltipTitle: string;
  tooltipProps?: Partial<TooltipProps>;
};

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  padding: 4,
  borderRadius: 3,
  backgroundColor: "transparent",
  border: `1px solid ${theme.palette.primary.main}`,
  width: 30,
  minWidth: 30,
  height: 31,
  "& .MuiSvgIcon-root": {
    fontSize: "1rem",
    color: theme.palette.primary.main,
  },
  "&:hover": {
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    "& .MuiSvgIcon-root": {
      color: theme.palette.common.white,
    },
  },
  "&:active": {
    backgroundColor: theme.palette.primary.dark,
    borderColor: theme.palette.primary.dark,
  },
  "&:focus": {
    boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
  },
  "&.Mui-disabled": {
    borderColor: theme.palette.grey[200],
    "& .MuiSvgIcon-root": {
      color: theme.palette.grey[400],
    },
  },
}));

const IconTooltipButton = forwardRef<HTMLButtonElement, IconTooltipButtonProps>(
  ({ tooltipTitle, tooltipProps, disabled, ...props }, ref) => (
    <Tooltip
      title={tooltipTitle}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: "primary.main",
            color: "common.white",
            "& .MuiTooltip-arrow": {
              color: "primary.main",
            },
          },
        },
      }}
      {...tooltipProps}
    >
      <span>
        <StyledIconButton ref={ref} disabled={disabled} disableRipple {...props} />
      </span>
    </Tooltip>
  )
);

IconTooltipButton.displayName = "IconTooltipButton";

export default IconTooltipButton;


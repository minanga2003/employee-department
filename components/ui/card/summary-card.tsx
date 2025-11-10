"use client";

import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

import CustomDivider from "@/components/ui/divider/custom-divider";

export type SummaryCardItem = {
  label: string;
  value: string | number;
};

export type SummaryCardProps = {
  data: SummaryCardItem[];
  title?: string;
  backgroundColor?: string;
  className?: string;
};

const StyledCard = styled(Box)(({ theme }) => ({
  width: "100%",
  marginTop: theme.spacing(2),
}));

const StyledCardContent = styled(Box)<{ backgroundColor?: string }>(({ theme, backgroundColor }) => ({
  padding: theme.spacing(2),
  backgroundColor: backgroundColor ?? theme.palette.primary.light,
  borderRadius: theme.shape.borderRadius,
  width: "100%",
}));

const DataRow = styled(Typography)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  marginTop: theme.spacing(1),
  fontSize: "0.8rem",
  "&:first-of-type": {
    marginTop: 0,
  },
  "& span:last-child": {
    fontFamily: "monospace",
    textAlign: "right",
    minWidth: "80px",
  },
}));

const SummaryCard = ({ data, title, backgroundColor, className }: SummaryCardProps) => {
  return (
    <StyledCard className={className}>
      {title && (
        <>
          <Typography variant="subtitle2" className="custom-sub-title" sx={{ fontSize: "0.85rem" }}>
            {title}
          </Typography>
          <CustomDivider />
        </>
      )}
      <StyledCardContent backgroundColor={backgroundColor}>
        {data.map((item, index) => (
          <DataRow key={index} variant="body2">
            <span>{item.label}</span>
            <span>{typeof item.value === "number" ? item.value.toLocaleString() : item.value}</span>
          </DataRow>
        ))}
      </StyledCardContent>
    </StyledCard>
  );
};

export default SummaryCard;


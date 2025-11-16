"use client";

import { Divider, Stack, Typography, useTheme } from "@mui/material";

type SectionHeaderProps = {
  label: string;
  spacingTop?: number;
};

const SectionHeader = ({ label, spacingTop = 1 }: SectionHeaderProps) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{ pt: { xs: spacingTop, sm: spacingTop + 1 } }}
    >
      <Stack
        component="span"
        sx={{
          width: 20,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      />
      <Typography
        variant="subtitle2"
        fontWeight={600}
        sx={{
          color: theme.palette.text.primary,
          minWidth: { xs: "auto", sm: 160 },
          fontSize: "0.85rem",
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Typography>
      <Divider sx={{ flexGrow: 1, borderColor: theme.palette.divider }} />
    </Stack>
  );
};

export default SectionHeader;

"use client";

import { Grid, Typography, Breadcrumbs, IconButton } from "@mui/material";
import NextLink from "next/link";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { ReactNode } from "react";

export type BreadcrumbItem = {
  title: string;
  to?: string;
};

export type BreadcrumbProps = {
  subtitle?: string;
  items?: BreadcrumbItem[];
  title: string;
  children?: ReactNode;
  onBackClick?: () => void;
};

const Breadcrumb = ({ subtitle, items, title, onBackClick }: BreadcrumbProps) => (
  <>
    <Grid
      container
      spacing={1}
      sx={{
        padding: "0px",
        marginTop: "-20px",
        paddingTop: "20px",
        paddingBottom: "10px",
        marginLeft: "0px",
        position: "relative",
        overflow: "hidden",
        alignItems: "center",
      }}
    >
      {onBackClick && (
        <Grid item>
          <IconButton onClick={onBackClick} color="primary" sx={{ width: 34, height: 34 }}>
            <ArrowBack fontSize="small" />
          </IconButton>
        </Grid>
      )}

      <Grid
        item
        xs
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            textTransform: "uppercase",
            fontSize: { xs: "1.25rem", md: "1.2rem" },
            fontWeight: 700,
            letterSpacing: 0.6,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            color="textSecondary"
            variant="body2"
            fontWeight={400}
            mt={0}
            mb={0}
            sx={{ fontSize: "0.75rem" }}
          >
            {subtitle}
          </Typography>
        )}
        {items && (
          <Breadcrumbs separator={null} sx={{ alignItems: "center" }} aria-label="breadcrumb">
            {items.map((item) => (
              <div key={item.title}>
                {item.to ? (
                  <NextLink href={item.to} passHref>
                    <Typography
                      color="textSecondary"
                      sx={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 0.3 }}
                    >
                      {item.title}
                    </Typography>
                  </NextLink>
                ) : (
                  <Typography
                    color="textPrimary"
                    sx={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 0.3 }}
                  >
                    {item.title}
                  </Typography>
                )}
              </div>
            ))}
          </Breadcrumbs>
        )}
      </Grid>
    </Grid>
  </>
);

export default Breadcrumb;


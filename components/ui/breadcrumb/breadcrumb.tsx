"use client";

import { Grid, Typography, Breadcrumbs, IconButton, Divider } from "@mui/material";
import NextLink from "next/link";
import { IconArrowLeft, IconCircle } from "@tabler/icons-react";
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
            <IconArrowLeft size={20} />
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
          variant="h6"
          sx={{
            textTransform: "uppercase",
            fontSize: { xs: "1.15rem", md: "1.35rem" },
            fontWeight: 400,
            letterSpacing: 0.25,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            color="textSecondary"
            variant="subtitle1"
            fontWeight={400}
            mt={0}
            mb={0}
            sx={{ fontSize: { xs: "1rem", md: "1.15rem" }, letterSpacing: 0.1 }}
          >
            {subtitle}
          </Typography>
        )}
        {items && (
          <Breadcrumbs
            separator={<IconCircle size={5} style={{ margin: "0 0px" }} />}
            sx={{ alignItems: "center" }}
            aria-label="breadcrumb"
          >
            {items.map((item) => (
              <div key={item.title}>
                {item.to ? (
                  <NextLink href={item.to} passHref>
                    <Typography color="textSecondary" sx={{ textTransform: "uppercase" }}>
                      {item.title}
                    </Typography>
                  </NextLink>
                ) : (
                  <Typography color="textPrimary" sx={{ textTransform: "uppercase" }}>
                    {item.title}
                  </Typography>
                )}
              </div>
            ))}
          </Breadcrumbs>
        )}
      </Grid>
    </Grid>
    <Divider sx={{ mb: 1, ml: 1 }} />
  </>
);

export default Breadcrumb;


"use client";

import { ChangeEvent, Dispatch, SetStateAction } from "react";
import { Box, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import CustomTextField from "@/components/forms/text-field/custom-text-field";

export type TableWithSearchProps = {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  width?: number | string;
  marginBottom?: number | string;
};

const TableWithSearch = ({
  searchText,
  setSearchText,
  width = 350,
  marginBottom = 2,
}: TableWithSearchProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  return (
    <Box sx={{ mb: marginBottom, display: "flex", justifyContent: "flex-end" }}>
      <CustomTextField
        placeholder="Search..."
        size="small"
        value={searchText}
        onChange={handleChange}
        sx={{
          width,
          maxWidth: "100%",
          "& .MuiOutlinedInput-root": {
            backgroundColor: "white",
            "&:hover > fieldset": {
              borderColor: "primary.main",
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default TableWithSearch;


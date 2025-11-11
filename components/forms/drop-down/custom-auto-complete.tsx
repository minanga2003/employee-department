"use client";

import { useMemo, type ReactNode, type Ref } from "react";
import { Autocomplete as MuiAutocomplete, styled } from "@mui/material";

import CustomTextField from "@/components/forms/text-field/custom-text-field";
import { baselightTheme } from "@/utils/theme/default-colors";
import theme from "@/utils/theme";

export type DefaultOption = {
  label: string;
  value: unknown;
  isDelete?: string | number;
  [key: string]: unknown;
};

const StyledAutocomplete = styled(MuiAutocomplete)(() => ({
  "& .MuiAutocomplete-inputRoot": {
    "& .MuiOutlinedInput-input": {
      height: "32px",
      padding: "0 14px",
      fontSize: "0.65rem !important",
    },
    padding: "0 !important",
  },
  "& .MuiAutocomplete-popupIndicator": {
    padding: 4,
  },
  "& .MuiAutocomplete-clearIndicator": {
    padding: 4,
  },
}));

const StyledDiv = styled("div")({
  "& .MuiAutocomplete-listbox::-webkit-scrollbar": {
    width: 6,
    height: 6,
  },
  "& .MuiAutocomplete-listbox::-webkit-scrollbar-track, & .MuiAutocomplete-listbox::-webkit-scrollbar-corner": {
    background: baselightTheme.palette.error.dark,
    borderRadius: 10,
  },
  "& .MuiAutocomplete-listbox::-webkit-scrollbar-thumb": {
    background: baselightTheme.palette.error.dark,
    borderRadius: 10,
    minHeight: 24,
  },
  "& .MuiAutocomplete-listbox::-webkit-scrollbar-thumb:hover": {
    background: baselightTheme.palette.error.dark,
  },
});

export type CustomAutocompleteProps<T extends DefaultOption> = {
  options?: T[];
  value: T | null;
  onChange: (event: unknown, value: T | null) => void;
  label: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  error?: boolean;
  helperText?: string;
  id?: string;
  required?: boolean;
  [key: string]: unknown;
};

const CustomAutocomplete = <T extends DefaultOption>({
  options = [],
  value,
  onChange,
  label,
  fullWidth = true,
  disabled = false,
  inputRef,
  error,
  helperText,
  id,
  required = false,
  ...props
}: CustomAutocompleteProps<T>) => {
  const selectedOption = useMemo(
    () => options.find((option) => option?.value === value?.value) ?? null,
    [options, value]
  );

  return (
    <StyledDiv>
      <StyledAutocomplete
        options={options}
        value={value}
        onChange={(event, newValue) => onChange(event, (newValue as T | null) ?? null)}
        fullWidth={fullWidth}
        disabled={disabled}
        id={id}
        sx={{
          "& .MuiOutlinedInput-input": {
            color: selectedOption?.isDelete === "YES" ? theme.palette.error.main : "inherit",
          },
        }}
        getOptionLabel={(option: unknown) => {
          if (typeof option === "string") return option;
          if (option && typeof option === "object" && "label" in option) {
            return (option as DefaultOption).label ?? "";
          }
          return "";
        }}
        isOptionEqualToValue={(option: unknown, optionValue: unknown) => {
          if (
            option &&
            typeof option === "object" &&
            "value" in option &&
            optionValue &&
            typeof optionValue === "object" &&
            "value" in optionValue
          ) {
            return (option as DefaultOption).value === (optionValue as DefaultOption).value;
          }
          return false;
        }}
        renderOption={(renderProps, option: unknown, { selected }) => {
          const { key, ...otherProps } = renderProps;
          const typedOption = option as DefaultOption;
          const isDeleted = typedOption?.isDelete === "YES" || typedOption?.isDelete === 1;

          return (
            <li
              key={key}
              {...otherProps}
              style={{
                color: isDeleted ? theme.palette.error.main : "inherit",
                opacity: isDeleted && !selected ? 0.8 : 1,
              }}
            >
              {typedOption.label ?? ""}
            </li>
          );
        }}
        renderInput={(params) => (
          <CustomTextField
            {...params}
            label={label}
            inputRef={inputRef}
            error={error}
            helperText={helperText}
            id={id}
            required={required}
          />
        )}
        componentsProps={{
          popper: {
            style: { width: "auto", inset: "0px auto auto 0px" },
            modifiers: [
              {
                name: "preventOverflow",
                enabled: true,
                options: {
                  altAxis: true,
                  tether: false,
                },
              },
              {
                name: "matchWidth",
                enabled: true,
                phase: "beforeWrite",
                requires: ["computeStyles"],
                fn: ({ state }) => {
                  const referenceElement = state.elements.reference as HTMLElement;
                  if (referenceElement) {
                    const width = `${referenceElement.getBoundingClientRect().width}px`;
                    state.styles.popper.width = width;
                  }
                },
              },
            ],
          },
          paper: {
            elevation: 12,
            sx: {
              width: "100%",
              "& .MuiAutocomplete-listbox": {
                fontSize: "0.7rem",
                lineHeight: 1.5,
                maxHeight: "300px",
                padding: 0,
                "@media screen and (min-width: 0\\0)": {
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(228, 18, 18, 0.3) transparent",
                },
              },
              "& .MuiAutocomplete-option": {
                fontSize: "0.7rem",
                lineHeight: 1.5,
              },
            },
          },
        }}
        slotProps={{
          popper: {
            sx: {
              width: "100%",
            },
          },
          listbox: {
            sx: {
              fontSize: "0.7rem",
              lineHeight: 1.5,
              maxHeight: "300px",
              padding: 0,
            },
          },
        }}
        {...props}
      />
    </StyledDiv>
  );
};

export default CustomAutocomplete;


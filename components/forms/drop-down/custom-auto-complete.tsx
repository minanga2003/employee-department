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
  disabled?: boolean;
  status?: number; // 1 = active, 0 = inactive
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
            color: selectedOption?.isDelete === "YES" 
              ? theme.palette.error.main 
              : selectedOption?.status === 0
              ? "#9e9e9e" // Gray/ash color for inactive
              : "inherit",
          },
        }}
        getOptionLabel={(option: unknown) => {
          if (typeof option === "string") return option;
          if (option && typeof option === "object" && "label" in option) {
            return (option as DefaultOption).label ?? "";
          }
          return "";
        }}
        getOptionKey={(option: unknown) => {
          // Use value as key to ensure uniqueness (values are IDs and should be unique)
          if (option && typeof option === "object" && "value" in option) {
            return String((option as DefaultOption).value);
          }
          // Fallback to label if value doesn't exist (shouldn't happen)
          if (option && typeof option === "object" && "label" in option) {
            return String((option as DefaultOption).label);
          }
          return String(option);
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
        getOptionDisabled={(option: unknown) => {
          if (option && typeof option === "object" && "disabled" in option) {
            return (option as DefaultOption).disabled === true;
          }
          // Only disable if explicitly set to disabled
          // Status alone doesn't disable (status is used for styling in dashboard filters)
          return false;
        }}
        renderOption={(renderProps, option: unknown, { selected }) => {
          const { key: muiKey, ...otherProps } = renderProps;
          const typedOption = option as DefaultOption;
          const isDeleted = typedOption?.isDelete === "YES" || typedOption?.isDelete === 1;
          const isDisabled = typedOption?.disabled === true; // Only check disabled flag, not status
          const isInactive = typedOption?.status === 0;
          
          // Use value (ID) as key to ensure uniqueness, fallback to MUI's key if value doesn't exist
          const uniqueKey = typedOption?.value !== undefined 
            ? String(typedOption.value) 
            : muiKey;

          return (
            <li
              key={uniqueKey}
              {...otherProps}
              style={{
                color: isDeleted 
                  ? theme.palette.error.main 
                  : isInactive 
                  ? "#9e9e9e" // Gray/ash color for inactive
                  : "inherit",
                opacity: (isDeleted || isInactive) && !selected ? 0.6 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
                backgroundColor: selected 
                  ? (isInactive ? "rgba(158, 158, 158, 0.1)" : undefined)
                  : undefined,
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


import { useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker, DatePickerProps } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CustomTextField, {
  CustomTextFieldProps,
} from "@/components/forms/text-field/custom-text-field";

export type CustomDatePickerProps = Omit<
  DatePickerProps<Dayjs>,
  "value" | "onChange"
> & {
  value: string | null;
  onChange: (value: string | null) => void;
};

const CustomDatePicker = ({
  value,
  onChange,
  ...props
}: CustomDatePickerProps) => {
  const parsedValue = useMemo(
    () => (value ? dayjs(value) : null),
    [value]
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={parsedValue}
        onChange={(newValue) => onChange(newValue ? newValue.format("YYYY-MM-DD") : null)}
        slots={{ textField: CustomTextField }}
        slotProps={{
          textField: {
            size: "small",
            fullWidth: true,
            InputLabelProps: {
              shrink: true,
            },
          } satisfies CustomTextFieldProps,
        }}
        {...props}
      />
    </LocalizationProvider>
  );
};

export default CustomDatePicker;


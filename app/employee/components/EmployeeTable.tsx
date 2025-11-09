import { useMemo } from "react";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { ColumnDef } from "@tanstack/react-table";

import ButtonLoader from "@/components/ui/buttons/button-loader";
import CustomButtonWithIcon from "@/components/ui/buttons/custom-button-with-icon";
import DataTable from "@/components/ui/data-table/data-table";

import type { Employee } from "../types";

type EmployeeTableProps = {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  onEdit: (employeeId: number) => void;
  onDelete: (employeeId: number) => Promise<void> | void;
  deletingId: number | null;
  pageTotalSalary: number;
  formatCurrency: (amount: number) => string;
};

export const EmployeeTable = ({
  employees,
  loading,
  error,
  onEdit,
  onDelete,
  deletingId,
  pageTotalSalary,
  formatCurrency,
}: EmployeeTableProps) => {
  const columns = useMemo<ColumnDef<Employee, unknown>[]>(
    () => [
      {
        id: "actions",
        header: () => "Actions",
        meta: { headerAlign: "center", hideSort: true },
        cell: ({ row }) => {
          const employee = row.original;
          return (
            <Stack direction="row" spacing={1} justifyContent="center">
              <CustomButtonWithIcon
                variant="outlined"
                size="small"
                buttonBorderColor="transparent"
                onClick={() => onEdit(employee.id)}
              >
                Edit
              </CustomButtonWithIcon>
              <ButtonLoader
                variant="outlined"
                size="small"
                color="error"
                loading={deletingId === employee.id}
                onClick={() => onDelete(employee.id)}
                sx={{ minHeight: 32 }}
              >
                Delete
              </ButtonLoader>
            </Stack>
          );
        },
      },
      {
        accessorKey: "empNo",
        header: () => "Emp No",
        meta: { headerAlign: "right" },
        cell: ({ getValue }) => (
          <Typography variant="body2" textAlign="right">
            {getValue<number>()}
          </Typography>
        ),
      },
      {
        accessorKey: "name",
        header: () => "Name",
        cell: ({ getValue }) => (
          <Typography variant="body2" fontWeight={500}>
            {getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: "departmentName",
        header: () => "Department",
        cell: ({ getValue }) => (
          <Typography variant="body2">{getValue<string>() ?? "—"}</Typography>
        ),
      },
      {
        accessorKey: "basicSalary",
        header: () => "Basic Salary",
        meta: { headerAlign: "right" },
        cell: ({ row }) => (
          <Typography variant="body2" textAlign="right" fontWeight={500}>
            {formatCurrency(row.original.basicSalary)}
          </Typography>
        ),
      },
      {
        accessorKey: "email",
        header: () => "Email",
        cell: ({ getValue }) => (
          <Typography variant="body2">{getValue<string>()}</Typography>
        ),
      },
      {
        accessorKey: "sectionName",
        header: () => "Section",
        cell: ({ getValue }) => (
          <Typography variant="body2">{getValue<string>() ?? "—"}</Typography>
        ),
      },
    ],
    [deletingId, formatCurrency, onDelete, onEdit]
  );

  const noData = !loading && !error && employees.length === 0;

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error" variant="outlined">
          {error}
        </Alert>
      )}

      {noData && (
        <Alert severity="info" variant="outlined">
          No employees found. Adjust your filters or search.
        </Alert>
      )}

      <DataTable<Employee>
        data={employees}
        columns={columns}
        getStableRowId={(row) => row.id}
        isServerPagination={false}
      />

      <Box display="flex" justifyContent="flex-end">
        <Typography variant="subtitle2">
          Total Salary:&nbsp;
          <Typography component="span" fontWeight={600}>
            {formatCurrency(pageTotalSalary)}
          </Typography>
        </Typography>
      </Box>
    </Stack>
  );
};


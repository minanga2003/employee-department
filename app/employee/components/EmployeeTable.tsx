import { useMemo } from "react";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { ColumnDef } from "@tanstack/react-table";

import SoftIconButton from "@/components/ui/buttons/soft-icon-button";
import EditRounded from "@mui/icons-material/EditRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import DataTable from "@/components/ui/data-table/data-table";

import type { Employee } from "../types";

type EmployeeTableProps = {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  onEdit: (employeeId: number) => void;
  onDeleteRequest: (employeeId: number) => void;
  deletingId: number | null;
  pageTotalSalary: number;
  formatCurrency: (amount: number) => string;
};

export const EmployeeTable = ({
  employees,
  loading,
  error,
  onEdit,
  onDeleteRequest,
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
          const isInactive = !employee.active;
          return (
            <Stack direction="row" spacing={1} justifyContent="center">
              <SoftIconButton 
                color="primary" 
                onClick={() => onEdit(employee.id)} 
                aria-label="Edit"
                sx={{
                  opacity: isInactive ? 0.6 : 1,
                }}
              >
                <EditRounded />
              </SoftIconButton>
              <SoftIconButton
                color="default"
                onClick={() => onDeleteRequest(employee.id)}
                aria-label="Delete"
                disabled={deletingId === employee.id}
                sx={{
                  opacity: isInactive ? 0.6 : 1,
                }}
              >
                {deletingId === employee.id ? <CircularProgress size={18} /> : <DeleteIcon />}
              </SoftIconButton>
            </Stack>
          );
        },
      },
      {
        accessorKey: "empNo",
        header: () => "Emp No",
        meta: { headerAlign: "right" },
        cell: ({ getValue, row }) => (
          <Typography 
            variant="body2" 
            textAlign="right" 
            sx={{ 
              fontSize: "0.8rem",
              color: !row.original.active ? "text.disabled" : "text.primary",
            }}
          >
            {getValue<number>()}
          </Typography>
        ),
      },
      {
        accessorKey: "name",
        header: () => "Name",
        cell: ({ getValue, row }) => (
          <Typography 
            variant="body2" 
            fontWeight={500} 
            sx={{ 
              fontSize: "0.85rem",
              color: !row.original.active ? "text.disabled" : "text.primary",
            }}
          >
            {getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: "departmentName",
        header: () => "Department",
        cell: ({ getValue, row }) => (
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: "0.8rem",
              color: !row.original.active ? "text.disabled" : "text.primary",
            }}
          >
            {getValue<string>() ?? "—"}
          </Typography>
        ),
      },
      {
        accessorKey: "basicSalary",
        header: () => "Basic Salary",
        meta: { headerAlign: "right" },
        cell: ({ row }) => (
          <Typography 
            variant="body2" 
            textAlign="right" 
            fontWeight={500} 
            sx={{ 
              fontSize: "0.85rem",
              color: !row.original.active ? "text.disabled" : "text.primary",
            }}
          >
            {formatCurrency(row.original.basicSalary)}
          </Typography>
        ),
      },
      {
        accessorKey: "email",
        header: () => "Email",
        cell: ({ getValue, row }) => (
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: "0.8rem",
              color: !row.original.active ? "text.disabled" : "text.primary",
            }}
          >
            {getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: "sectionName",
        header: () => "Section",
        cell: ({ getValue, row }) => (
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: "0.8rem",
              color: !row.original.active ? "text.disabled" : "text.primary",
            }}
          >
            {getValue<string>() ?? "—"}
          </Typography>
        ),
      },
    ],
    [deletingId, formatCurrency, onDeleteRequest, onEdit]
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
        getRowClassName={(row) => (!row.active ? "inactive-row" : "")}
        isServerPagination={false}
      />

      <Box display="flex" justifyContent="flex-end">
        <Typography variant="subtitle2" sx={{ fontSize: "0.85rem" }}>
          Total Salary:&nbsp;
          <Typography component="span" fontWeight={600} sx={{ fontSize: "0.85rem" }}>
            {formatCurrency(pageTotalSalary)}
          </Typography>
        </Typography>
      </Box>
    </Stack>
  );
};


import { useMemo } from "react";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { ColumnDef } from "@tanstack/react-table";
import { alpha } from "@mui/material/styles";
import SoftIconButton from "@/components/ui/buttons/soft-icon-button";
import FixedColumnsDataTable from "@/components/ui/data-table/fixed-columns-table";
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
        header: () => "",
        meta: { headerAlign: "center", hideSort: true, hideDragHandle: true },
        cell: ({ row }) => {
          const employee = row.original;
          const isInactive = !employee.active;
          return (
            <Stack direction="row" spacing={1} justifyContent="center">
              <SoftIconButton 
                color="primary"
                onClick={() => onEdit(employee.id)} 
                aria-label="Edit"
                rounded={3}
                sx={(theme) => ({
                  opacity: isInactive ? 0.6 : 1,
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: alpha(theme.palette.primary.light, 0.28),
                  color: theme.palette.primary.main,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.light, 0.42),
                  },
                })}
              >
                <Box
                  component="img"
                  src="/icons/edit-action.svg"
                  alt="Edit employee"
                  sx={{ width: 18, height: 18 }}
                />
              </SoftIconButton>
              <SoftIconButton
                color="primary"
                onClick={() => onDeleteRequest(employee.id)}
                aria-label="Delete"
                disabled={deletingId === employee.id}
                rounded={3}
                sx={(theme) => ({
                  opacity: isInactive ? 0.6 : 1,
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: alpha(theme.palette.primary.light, 0.28),
                  color: theme.palette.primary.main,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.light, 0.42),
                  },
                  "&.Mui-disabled": {
                    backgroundColor: alpha(theme.palette.primary.light, 0.2),
                    color: alpha(theme.palette.primary.main, 0.45),
                  },
                })}
              >
                {deletingId === employee.id ? (
                  <CircularProgress size={18} />
                ) : (
                  <Box
                    component="img"
                    src="/icons/delete-action.svg"
                    alt="Delete employee"
                    sx={{ width: 18, height: 18 }}
                  />
                )}
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
            variant="subtitle1" 
            className="subtitle-text-right"
            sx={{ 
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
        meta: { headerAlign: "center" },
        cell: ({ getValue, row }) => (
          <Typography 
            variant="subtitle1" 
            className="subtitle-text-center"
            sx={{ 
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
        meta: { headerAlign: "center" },
        cell: ({ getValue, row }) => (
          <Typography 
            variant="subtitle1" 
            className="subtitle-text-center"
            sx={{ 
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
            variant="subtitle1" 
            className="subtitle-text-right table-amount"
            sx={{ 
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
        meta: { headerAlign: "center" },
        cell: ({ getValue, row }) => (
          <Typography 
            variant="subtitle1" 
            className="subtitle-text-center"
            sx={{ 
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
        meta: { headerAlign: "center" },
        cell: ({ getValue, row }) => (
          <Typography 
            variant="subtitle1" 
            className="subtitle-text-center"
            sx={{ 
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
      <FixedColumnsDataTable<Employee>
        data={employees}
        columns={columns}
        getStableRowId={(row) => row.id}
        getRowClassName={(row) => (!row.active ? "inactive-row" : "")}
        fixedColumnsCount={0}
        firstColumnWidth={80}
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
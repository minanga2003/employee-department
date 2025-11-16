"use client";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  FormControlLabel,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import CustomAutocomplete from "@/components/forms/drop-down/custom-auto-complete";
import CustomCheckbox from "@/components/forms/checkbox/custom-checkbox";
import BlankCard from "@/components/ui/card/blank-card";
import CustomButtonWithIcon from "@/components/ui/buttons/custom-button-with-icon";
import AddIcon from "@mui/icons-material/Add";
import TableWithSearch from "@/components/ui/data-table/search-data-table";
import ConfirmationDialog from "@/components/ui/dialog-box/confirmation-dialog";
import PageContainer from "@/components/layouts/container/page-container";

import { buildApiUrl } from "../../lib/apiConfig";
import { EmployeeTable } from "./components/EmployeeTable";
import NewEmployeeDialog from "./components/NewEmployeeDialog";
import type { Department, Employee, PagedEmployeesResponse, Section } from "./types";

const useDebounce = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debouncedValue;
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "bigint") return Number(value);
  return 0;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);

type Option = { 
  label: string; 
  value: string; 
  status?: number; 
  disabled?: boolean;
};

export const EmployeeDashboard = () => {
  const theme = useTheme();
  const [activeOnly, setActiveOnly] = useState(true);
  const [department, setDepartment] = useState<string>("all");
  const [section, setSection] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pageTotalSalary, setPageTotalSalary] = useState(0);

  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);

  const pendingNotificationRef = useRef<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadDepartments = async () => {
      try {
        const url = buildApiUrl("/api/departments");
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load departments (${response.status})`);
        }
        const data = (await response.json()) as Department[] | Department;
        const items = Array.isArray(data) ? data : [data];
        if (isActive) {
          setDepartments(
            items
              .map((item) => ({
                id: Number(item.id),
                name: item.name,
                status: item.status !== undefined ? Number(item.status) : 1, 
              }))
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (isActive) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while fetching departments"
          );
        }
      }
    };
    loadDepartments();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (department === "all") {
      setSections([]);
      setSection("all");
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const loadSections = async () => {
      try {
        const url = buildApiUrl(`/api/sections?departmentId=${department}`);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load sections (${response.status})`);
        }
        const data = (await response.json()) as Section[] | Section;
        const items = Array.isArray(data) ? data : [data];
        if (isActive) {
          // Map sections and deduplicate by name
          // Strategy: Collect all sections by name, then pick the best one (active preferred, then lowest ID)
          const sectionsByName = new Map<string, Array<{ id: number; name: string; status: number }>>();
          
          // First pass: collect all sections grouped by name
          items.forEach((item) => {
            const sectionName = item.name;
            const sectionId = Number(item.id);
            const sectionStatus = item.status !== undefined ? Number(item.status) : 1;
            
            if (!sectionsByName.has(sectionName)) {
              sectionsByName.set(sectionName, []);
            }
            sectionsByName.get(sectionName)!.push({
              id: sectionId,
              name: sectionName,
              status: sectionStatus,
            });
          });
          const sectionMap = new Map<string, { id: number; name: string; status: number }>();
          sectionsByName.forEach((sections, name) => {
            const sorted = sections.sort((a, b) => b.id - a.id); 
            sectionMap.set(name, sorted[0]);
          });
          setSections(
            Array.from(sectionMap.values()).sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (isActive) {
          setError(err instanceof Error ? err.message : "Unable to fetch sections");
        }
      }
    };

    loadSections();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [department]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadEmployees = async () => {
      setLoadingEmployees(true);
      if (!pendingNotificationRef.current) {
        setNotification(null);
      }
      try {
        const url = buildApiUrl("/api/employees");
        if (activeOnly) {
          url.searchParams.set("active", "true");
        }
        if (department !== "all") {
          url.searchParams.set("departmentId", department);
        }
        if (section !== "all") {
          url.searchParams.set("sectionId", section);
        }
        if (debouncedSearch.trim()) {
          url.searchParams.set("q", debouncedSearch.trim());
        }
        url.searchParams.set("page", "0");
        url.searchParams.set("size", "50");
        url.searchParams.set("sort", "empNo");

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          let errorMessage = `Failed to load employees (${response.status})`;
          try {
            const errorData = await response.json();
            if (errorData && typeof errorData === "object") {
              if (errorData.message) {
                errorMessage = errorData.message;
              } else if (errorData.error) {
                errorMessage = errorData.error;
              }
            } else if (typeof errorData === "string") {
              errorMessage = errorData;
            }
          } catch {
            // If we can't parse the error response, use the default message
          }
          throw new Error(errorMessage);
        }
        const raw = (await response.json()) as PagedEmployeesResponse;
        if (!isActive) return;

        const parsedEmployees = (raw.content ?? []).map((emp) => ({
          ...emp,
          id: Number(emp.id),
          empNo: Number(emp.empNo),
          basicSalary: toNumber(emp.basicSalary),
          travelAllowance: toNumber(emp.travelAllowance),
          otherAllowance: toNumber(emp.otherAllowance),
          totalSalary: toNumber(emp.totalSalary),
          active: Boolean(emp.active),
        }));

        setEmployees(parsedEmployees);
        setPageTotalSalary(toNumber(raw.pageTotalSalary));
        setError(null);
        if (pendingNotificationRef.current) {
          setNotification(pendingNotificationRef.current);
          pendingNotificationRef.current = null;
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (!isActive) return;
        setEmployees([]);
        setPageTotalSalary(0);
        pendingNotificationRef.current = null;
        const errorMessage = err instanceof Error 
          ? err.message 
          : "Something went wrong while fetching employees";
        setError(
          errorMessage.includes("500") 
            ? "Server error: Unable to load employees. Please check the backend server logs for details."
            : errorMessage
        );
      } finally {
        if (isActive) {
          setLoadingEmployees(false);
        }
      }
    };

    loadEmployees();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [activeOnly, department, section, debouncedSearch, reloadKey]);

  const departmentOptions = useMemo<Option[]>(() => {
    const base: Option[] = [{ label: "All Departments", value: "all" }];
    return base.concat(
      departments.map((dept) => ({
        label: dept.name,
        value: String(dept.id),
        status: dept.status,
        // In dashboard, inactive departments can still be used for filtering
        // but will be displayed in gray to indicate they're inactive
        disabled: false,
      }))
    );
  }, [departments]);

  const sectionOptions = useMemo<Option[]>(() => {
    const base: Option[] = [{ label: "All Sections", value: "all" }];
    return base.concat(
      sections.map((sec) => ({
        label: sec.name,
        value: String(sec.id),
        status: sec.status,
        disabled: false,
      }))
    );
  }, [sections]);

  const selectedDepartmentOption = useMemo(
    () => departmentOptions.find((opt) => opt.value === department) ?? departmentOptions[0],
    [department, departmentOptions]
  );

  const selectedSectionOption = useMemo(
    () => sectionOptions.find((opt) => opt.value === section) ?? sectionOptions[0],
    [section, sectionOptions]
  );

  const pendingDeleteEmployee = useMemo(
    () => employees.find((employee) => employee.id === pendingDeleteId) ?? null,
    [employees, pendingDeleteId]
  );

  const isDeleteDialogOpen = pendingDeleteId !== null;
  const isDeletingSelectedEmployee = deletingId !== null && deletingId === pendingDeleteId;

  const handleEdit = (employeeId: number) => {
    setEditingEmployeeId(employeeId);
    setIsEditDialogOpen(true);
  };

  const handleRequestDelete = (employeeId: number) => {
    setPendingDeleteId(employeeId);
  };

  const handleCancelDelete = () => {
    if (isDeletingSelectedEmployee) return;
    setPendingDeleteId(null);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId === null) return;

    const employeeId = pendingDeleteId;
    setDeletingId(employeeId);
    setError(null);
    setNotification(null);

    try {
      const url = buildApiUrl(`/api/employees/${employeeId}`);
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `Failed to delete employee (${response.status})`);
      }

      pendingNotificationRef.current = "Employee deleted successfully.";
      setReloadKey((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete employee.");
    } finally {
      setPendingDeleteId(null);
      setDeletingId(null);
    }
  };

  return (
    <PageContainer title="Employee">
      <Box sx={{ width: "99%", overflowX: "hidden" }}>
      <Grid2 container spacing={1}>
        {/* First Row - Filters */}
        <Grid2 size={{ lg: 12 }} sx={{ mt: 1, ml: 1 }}>
          <Box sx={{ width: "100%" }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems="center"
              justifyContent={{ xs: "flex-start", md: "flex-end" }}
              sx={{
                width: "100%",
                flexWrap: "wrap",
                rowGap: 1,
              }}
            >
              <FormControlLabel
                control={
                  <CustomCheckbox
                    checked={activeOnly}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setActiveOnly(event.target.checked)
                    }
                  />
                }
                label="Active Only"
                sx={{
                  "& .MuiTypography-root": { fontSize: "0.8rem" },
                }}
              />
              <CustomAutocomplete
                id="department"
                label="Department"
                options={departmentOptions}
                value={selectedDepartmentOption}
                onChange={(_, option) => {
                  const next = option?.value ?? "all";
                  setDepartment(String(next));
                  setSection("all");
                }}
                fullWidth
                sx={{ width: { xs: "100%", sm: 243 } }}
              />
              <CustomAutocomplete
                id="section"
                label="Section"
                options={sectionOptions}
                value={department === "all" ? sectionOptions[0] : selectedSectionOption}
                onChange={(_, option) => setSection(String(option?.value ?? "all"))}
                disabled={department === "all"}
                fullWidth
                sx={{ width: { xs: "100%", sm: 243 } }}
              />
              <TableWithSearch
                searchText={search}
                setSearchText={setSearch}
                width={243}
                marginBottom={0}
              />
            </Stack>
          </Box>
        </Grid2>

        {/* Second Row - New Employee Button */}
        <Grid2 size={{ lg: 12 }} sx={{ ml: 1 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              width: "100%",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <CustomButtonWithIcon
              variant="outlined"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => setIsCreateDialogOpen(true)}
            >
              New Employee
            </CustomButtonWithIcon>
          </Stack>
        </Grid2>

        {/* Data Table */}
        <Grid2 size={{ lg: 12 }} sx={{ mt: 1, ml: 1 }}>
          <BlankCard>
            <Box sx={{ display: "inline-block", overflowX: "auto", width: "100%" }}>
              {loadingEmployees && <LinearProgress />}
              <EmployeeTable
                employees={employees}
                loading={loadingEmployees}
                error={error}
                onEdit={handleEdit}
                onDeleteRequest={handleRequestDelete}
                deletingId={deletingId}
                pageTotalSalary={pageTotalSalary}
                formatCurrency={formatCurrency}
              />
            </Box>
          </BlankCard>
        </Grid2>
      </Grid2>
      </Box>

      {notification && (
        <Alert severity="success" variant="outlined" sx={{ mt: 2, ml: 1 }}>
          {notification}
        </Alert>
      )}

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        alertType="deleteConfirmation"
        isLoading={isDeletingSelectedEmployee}
        description={
          pendingDeleteEmployee
            ? pendingDeleteEmployee.name
            : "this employee"
        }
      />

      <NewEmployeeDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreated={() => {
          pendingNotificationRef.current = "Employee created successfully.";
          setReloadKey((prev) => prev + 1);
        }}
      />
      <NewEmployeeDialog
        open={isEditDialogOpen}
        mode="edit"
        employeeId={editingEmployeeId}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingEmployeeId(null);
        }}
        onUpdated={() => {
          pendingNotificationRef.current = "Employee updated successfully.";
          setReloadKey((prev) => prev + 1);
        }}
      />
    </PageContainer>
  );
};
export default EmployeeDashboard;
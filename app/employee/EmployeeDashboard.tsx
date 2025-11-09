"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  FormControlLabel,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import CustomAutocomplete from "@/components/forms/drop-down/custom-auto-complete";
import CustomCheckbox from "@/components/forms/checkbox/custom-checkbox";
import BlankCard from "@/components/ui/card/blank-card";
import CustomButtonWithIcon from "@/components/ui/buttons/custom-button-with-icon";
import TableWithSearch from "@/components/ui/data-table/search-data-table";
import Breadcrumb from "@/components/ui/breadcrumb/breadcrumb";
import PageContainer from "@/components/layouts/container/page-container";

import { buildApiUrl } from "../../lib/apiConfig";
import { EmployeeTable } from "./components/EmployeeTable";
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

type Option = { label: string; value: string };

export const EmployeeDashboard = () => {
  const router = useRouter();

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
  const [reloadKey, setReloadKey] = useState(0);

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
          setSections(
            items
              .map((item) => ({
                id: Number(item.id),
                name: item.name,
              }))
              .sort((a, b) => a.name.localeCompare(b.name))
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
      setNotification(null);

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
          throw new Error(`Failed to load employees (${response.status})`);
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
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (!isActive) return;
        setEmployees([]);
        setPageTotalSalary(0);
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while fetching employees"
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
      }))
    );
  }, [departments]);

  const sectionOptions = useMemo<Option[]>(() => {
    const base: Option[] = [{ label: "All Sections", value: "all" }];
    return base.concat(
      sections.map((sec) => ({
        label: sec.name,
        value: String(sec.id),
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

  const handleEdit = (employeeId: number) => {
    router.push(`/employee/edit?id=${employeeId}`);
  };

  const handleDelete = async (employeeId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this employee?");
    if (!confirmed) return;

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

      setNotification("Employee deleted successfully.");
      setReloadKey((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete employee.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageContainer title="Employee">
      <Breadcrumb title="Employee" />

      <Stack spacing={3}>
        <BlankCard sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }}>
              <Typography variant="h6" fontWeight={600}>
                Employee Directory
              </Typography>
              <CustomButtonWithIcon variant="contained" onClick={() => router.push("/employee/edit")}>
                New Employee
              </CustomButtonWithIcon>
            </Stack>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
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
                />

                <Box sx={{ minWidth: 220 }}>
                  <CustomAutocomplete
                    label="Department"
                    options={departmentOptions}
                    value={selectedDepartmentOption}
                    onChange={(_, option) => {
                      const next = option?.value ?? "all";
                      setDepartment(String(next));
                      setSection("all");
                    }}
                  />
                </Box>

                <Box sx={{ minWidth: 220 }}>
                  <CustomAutocomplete
                    label="Section"
                    options={sectionOptions}
                    value={department === "all" ? sectionOptions[0] : selectedSectionOption}
                    onChange={(_, option) => setSection(String(option?.value ?? "all"))}
                    disabled={department === "all"}
                  />
                </Box>
              </Stack>

              <Box sx={{ width: { xs: "100%", md: 280 } }}>
                <TableWithSearch searchText={search} setSearchText={setSearch} />
              </Box>
            </Stack>
          </Stack>
        </BlankCard>

        {notification && (
          <Alert severity="success" variant="outlined">
            {notification}
          </Alert>
        )}

        <BlankCard sx={{ p: 3 }}>
          <Stack spacing={2}>
            {loadingEmployees && <LinearProgress />}

            <EmployeeTable
              employees={employees}
              loading={loadingEmployees}
              error={error}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deletingId={deletingId}
              pageTotalSalary={pageTotalSalary}
              formatCurrency={formatCurrency}
            />
          </Stack>
        </BlankCard>
      </Stack>
    </PageContainer>
  );
};

export default EmployeeDashboard;


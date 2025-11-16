import { buildApiUrl } from "@/lib/apiConfig";
import type { Department, Section, PagedEmployeesResponse } from "./types";
type RawDepartment = {
  id: number | string;
  name: string;
  status?: number | string;
};

/**
 * Raw entity shape returned by the upstream service for sections.
 * Ensures consumers do not rely on inconsistent API typing.
 */
type RawSection = {
  id: number | string;
  name: string;
  status?: number | string;
};

/**
 * Normalizes a raw department payload so the UI layer always receives
 * numeric identifiers and default status values.
 */
const normalizeDepartment = (dept: RawDepartment): Department => ({
  id: Number(dept.id),
  name: dept.name,
  status: dept.status !== undefined ? Number(dept.status) : 1,
});

/**
 * Normalizes a raw section payload to the canonical `Section` model.
 */
const normalizeSection = (section: RawSection): Section => ({
  id: Number(section.id),
  name: section.name,
  status: section.status !== undefined ? Number(section.status) : 1,
});

/**
 * Attempts to extract a meaningful error message from a failed fetch response.
 * Falls back to an empty string so upstream error handlers can decide on defaults.
 */
const extractErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const errorJson = await response.json();
      if (typeof errorJson === "string") {
        return errorJson;
      }
      if (errorJson && typeof errorJson === "object") {
        return (
          (errorJson.message as string) ??
          (errorJson.error as string) ??
          (errorJson.detail as string) ??
          ""
        );
      }
    } else {
      return (await response.text()) ?? "";
    }
  } catch {
    // ignore
  }
  return "";
};

/**
 * Consistent error wrapper so the UI can reason about HTTP failures by status code.
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message && message.length > 0 ? message : `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Thin wrapper around `fetch` that throws `ApiError` when the response is not ok.
 */
const request = async (url: URL, options: RequestInit = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new ApiError(response.status, message);
  }
  return response;
};

/**
 * Executes a request and deserializes the JSON payload while honoring 204 responses.
 */
const requestJson = async <T>(url: URL, options: RequestInit = {}) => {
  const response = await request(url, options);
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
};

/**
 * Fetches the latest department catalog and ensures consumers receive a sorted list.
 */
export const fetchDepartments = async (signal?: AbortSignal): Promise<Department[]> => {
  const data = await requestJson<RawDepartment[] | RawDepartment>(buildApiUrl("/api/departments"), {
    signal,
  });
  const list = Array.isArray(data) ? data : [data];
  return list.map(normalizeDepartment).sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Fetches sections for a given department, deduplicating by name and preferring the newest id.
 */
export const fetchSectionsByDepartment = async (
  departmentId: string | number,
  signal?: AbortSignal
): Promise<Section[]> => {
  const resolvedId = String(departmentId);
  const data = await requestJson<RawSection[] | RawSection>(
    buildApiUrl(`/api/sections?departmentId=${encodeURIComponent(resolvedId)}`),
    { signal }
  );
  const list = Array.isArray(data) ? data : [data];

  const sectionsByName = new Map<string, Section[]>();
  list.forEach((section) => {
    const normalized = normalizeSection(section);
    if (!sectionsByName.has(normalized.name)) {
      sectionsByName.set(normalized.name, []);
    }
    sectionsByName.get(normalized.name)!.push(normalized);
  });

  const sectionMap = new Map<string, Section>();
  sectionsByName.forEach((sections, name) => {
    const sorted = sections.sort((a, b) => b.id - a.id);
    sectionMap.set(name, sorted[0]);
  });

  return Array.from(sectionMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export type EmployeeResponse = {
  id?: number;
  empNo?: number | string | null;
  name?: string;
  dob?: string | null;
  age?: number | null;
  email?: string;
  departmentId?: number | string | null;
  departmentName?: string | null;
  sectionId?: number | string | null;
  sectionName?: string | null;
  basicSalary?: number | string | null;
  travelAllowance?: number | string | null;
  otherAllowance?: number | string | null;
  totalSalary?: number | string | null;
  active?: boolean;
};

/**
 * Retrieves a single employee by identifier.
 */
export const fetchEmployeeById = async (
  employeeId: number,
  signal?: AbortSignal
): Promise<EmployeeResponse> => {
  return requestJson<EmployeeResponse>(buildApiUrl(`/api/employees/${employeeId}`), { signal });
};

/**
 * Canonical payload for creating or updating employees from the client.
 */
export type EmployeePayload = {
  empNo: number;
  name: string;
  dob: string | null;
  email: string;
  departmentId: number | null;
  sectionId: number | null;
  basicSalary: number;
  travelAllowance: number;
  otherAllowance: number;
  active: boolean;
};

/**
 * Creates a new employee or updates an existing one based on the presence of `employeeId`.
 */
export const upsertEmployee = async (
  payload: EmployeePayload,
  options: { employeeId?: number | null } = {}
): Promise<EmployeeResponse | null> => {
  const isEdit = options.employeeId !== undefined && options.employeeId !== null;
  if (isEdit && (options.employeeId === undefined || options.employeeId === null)) {
    throw new Error("Employee identifier is missing.");
  }

  const url = isEdit
    ? buildApiUrl(`/api/employees/${options.employeeId}`)
    : buildApiUrl("/api/employees");
  const response = await request(url, {
    method: isEdit ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as EmployeeResponse;
  }
  return null;
};

/**
 * Query parameters available when listing employees from the backend.
 */
export type FetchEmployeesParams = {
  activeOnly?: boolean;
  departmentId?: string;
  sectionId?: string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
};

/**
 * Retrieves paginated employee data using the provided filters.
 */
export const fetchEmployees = async (
  params: FetchEmployeesParams,
  signal?: AbortSignal
): Promise<PagedEmployeesResponse> => {
  const url = buildApiUrl("/api/employees");
  const { activeOnly, departmentId, sectionId, search, page = 0, size = 50, sort = "empNo" } = params;

  if (activeOnly) {
    url.searchParams.set("active", "true");
  }
  if (departmentId) {
    url.searchParams.set("departmentId", departmentId);
  }
  if (sectionId) {
    url.searchParams.set("sectionId", sectionId);
  }
  if (search && search.trim()) {
    url.searchParams.set("q", search.trim());
  }

  url.searchParams.set("page", page.toString());
  url.searchParams.set("size", size.toString());
  url.searchParams.set("sort", sort);

  return requestJson<PagedEmployeesResponse>(url, { signal });
};

/**
 * Deletes an employee and surfaces any failure through `ApiError`.
 */
export const deleteEmployee = async (employeeId: number): Promise<void> => {
  await request(buildApiUrl(`/api/employees/${employeeId}`), { method: "DELETE" });
};



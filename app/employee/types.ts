export type Department = {
  id: number;
  name: string;
  status?: number; // 1 = active, 0 = inactive
};

export type Section = {
  id: number;
  name: string;
  status?: number; // 1 = active, 0 = inactive
};

export type Employee = {
  id: number;
  empNo: number;
  name: string;
  dob?: string;
  age?: number | null;
  email: string;
  departmentId?: number | null;
  departmentName?: string | null;
  sectionId?: number | null;
  sectionName?: string | null;
  basicSalary: number;
  travelAllowance: number;
  otherAllowance: number;
  totalSalary: number;
  active: boolean;
};

export type PagedEmployeesResponse = {
  content: Employee[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  pageTotalSalary: number;
};


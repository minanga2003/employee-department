import type { Metadata } from "next";
import EmployeeDashboard from "./EmployeeDashboard";

export const metadata: Metadata = {
  title: "Employee",
};

export default function EmployeePage() {
  return <EmployeeDashboard />;
}


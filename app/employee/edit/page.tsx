import type { Metadata } from "next";
import EmployeeEditForm from "./EmployeeEditForm";

export const metadata: Metadata = {
  title: "Employee Create / Edit",
};

export default function EmployeeEditPage() {
  return <EmployeeEditForm />;
}


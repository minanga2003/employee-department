"use client";
import Loading from "@/app/loading";
import GlobalError from "@/components/feature/error-message/error-message";
import EmployeeEditForm from "./EmployeeEditForm";
import PageContainer from "@/components/layouts/container/page-container";
import Breadcrumb from "@/components/ui/breadcrumb/breadcrumb";
import React from "react";

export default function EmployeeEditPage() {
  const pageTitle = "Employee Registration";
  return (
    <PageContainer title={pageTitle}>
      {pageTitle && <Breadcrumb title={pageTitle} items={[]} />}
      <EmployeeEditForm />
    </PageContainer>
  );
}


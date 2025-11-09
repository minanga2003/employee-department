"use client";

import PageContainer from "@/components/layouts/container/page-container";
import Breadcrumb from "@/components/ui/breadcrumb/breadcrumb";
import CreditorTransactionInquiry from "@/components/feature/transactions/po-and-creditors/creditor-transaction-inquiry/creditor-transaction-inquiry";

const CreditorTransactionInquiryPage = () => {
  const pageTitle = "Creditor Transaction Search";
  return (
    <PageContainer title={pageTitle}>
      <Breadcrumb title={pageTitle} items={[]} />
      <CreditorTransactionInquiry />
    </PageContainer>
  );
};

export default CreditorTransactionInquiryPage;


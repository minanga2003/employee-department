"use client";

import { useState } from "react";
import { Box, Stack } from "@mui/material";
import Grid from "@mui/material/Grid2";

import BlankCard from "@/components/ui/card/blank-card";
import CustomAutocomplete from "@/components/forms/drop-down/custom-auto-complete";
import TableWithSearch from "@/components/ui/data-table/search-data-table";
import CheckboxList from "@/components/ui/extra-fields-dropdown-menu-component/dropdown-with-checkbox";
import CustomDatePicker from "@/components/forms/date-picker/date-picker";
import DataTable from "@/components/ui/data-table/data-table";

import useCreditorTransactionInquiryColumns, {
  CreditorAllocation,
  CreditorTxnHeader,
} from "./components/use-creditor-transaction-inquiry-columns";
import { AllocationDetailsTable } from "./components/allocation-details-table";

const headerRows: CreditorTxnHeader[] = [
  {
    type: "Invoice",
    txnDate: "2025-01-01",
    acNo: "17",
    supplier: "Cash Supplier",
    txnSeq: 2,
    invoiceNo: "INV0001",
    amount: "2,500.00",
    balance: "1,000.00",
    dueDate: "2025-01-30",
    reference: "Ref X",
  },
];

const allocationsByTxnSeq: Record<number, CreditorAllocation[] | undefined> = {
  2: [
    {
      type: "Payment",
      txnDate: "2025-01-02",
      txnSeq: 4,
      allocatedAmount: "1,500.00",
      allocatedOn: "2025-01-03",
      allocatedBy: "sanjeewa",
      invoiceNo: "X",
      reference: "CHQ32653",
    },
    {
      type: "Adjustment",
      txnDate: "2025-01-03",
      txnSeq: 5,
      allocatedAmount: "500.00",
      allocatedOn: "2025-01-03",
      allocatedBy: "sanjeewa",
      invoiceNo: "AdjX",
      reference: "Adj Ref",
    },
  ],
};

const CreditorTransactionInquiry = () => {
  const { headerColumns } = useCreditorTransactionInquiryColumns();

  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<{ label: string; value: string } | null>(null);
  const [branch, setBranch] = useState<{ label: string; value: string } | null>(null);
  const [txnType, setTxnType] = useState<{ label: string; value: string } | null>(null);
  const [supplier, setSupplier] = useState<{ label: string; value: string } | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const extraFieldsMenuItems = [
    { label: "Reference 2", onClick: () => {} },
    { label: "Reference 3", onClick: () => {} },
    { label: "Currency", onClick: () => {} },
    { label: "Exchange rate", onClick: () => {} },
    { label: "Branch", onClick: () => {} },
    { label: "Gross Amount", onClick: () => {} },
    { label: "Tax Amount", onClick: () => {} },
    { label: "Created By", onClick: () => {} },
    { label: "Seq NO", onClick: () => {} },
  ];

  const handleRowExpand = (row: CreditorTxnHeader, isExpanded: boolean) => {
    setExpandedRow(isExpanded ? row.txnSeq : null);
  };

  return (
    <>
      <Grid container spacing={1}>
        <Grid xs={12} sx={{ mt: 1 }}>
          <Box>
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Stack direction="row" spacing={1}>
                <CustomAutocomplete
                  id="txnType"
                  label="Txn Type"
                  options={[
                    { label: "All Types", value: "" },
                    { label: "Invoice", value: "invoice" },
                    { label: "Payment", value: "payment" },
                    { label: "Adjustment", value: "adjustment" },
                  ]}
                  value={txnType}
                  onChange={(_, v) => setTxnType(v)}
                  sx={{ width: 240 }}
                />
                <CustomAutocomplete
                  id="supplier"
                  label="Supplier"
                  options={[
                    { label: "All Suppliers", value: "" },
                    { label: "Cash Supplier", value: "cash_supplier" },
                    { label: "Supplier 1", value: "supplier_1" },
                  ]}
                  value={supplier}
                  onChange={(_, v) => setSupplier(v)}
                  sx={{ width: 240 }}
                />
              </Stack>
              <Box sx={{ width: "100%", maxWidth: 280 }}>
                <TableWithSearch searchText={searchText} setSearchText={setSearchText} />
              </Box>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={1} sx={{ mt: 1 }}>
        <Grid xs={12}>
          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
            <CustomAutocomplete
              id="quickRanges"
              label="Quick Ranges"
              options={[
                { label: "Today", value: "today" },
                { label: "This Month", value: "this_month" },
                { label: "Last Month", value: "last_month" },
              ]}
              value={selectedFilter}
              onChange={(_, v) => setSelectedFilter(v)}
              sx={{ width: 240 }}
            />
            <CustomAutocomplete
              id="branch"
              label="Branch"
              options={[
                { label: "All Branches", value: "" },
                { label: "Main Branch", value: "main" },
                { label: "Branch 2", value: "branch2" },
              ]}
              value={branch}
              onChange={(_, v) => setBranch(v)}
              sx={{ width: 240 }}
            />
            <Box sx={{ width: 240 }}>
              <CustomDatePicker label="From Date" value={fromDate} onChange={setFromDate} />
            </Box>
            <Box sx={{ width: 240 }}>
              <CustomDatePicker label="To Date" value={toDate} onChange={setToDate} />
            </Box>
            <CheckboxList items={extraFieldsMenuItems} />
          </Stack>
        </Grid>

        <Grid xs={12} sx={{ mt: 1 }}>
          <BlankCard>
            <Box sx={{ display: "inline-block", width: "100%" }}>
              <DataTable
                data={headerRows}
                columns={headerColumns}
                renderSubComponent={({ row }) => {
                  const txnSeq = (row.original as CreditorTxnHeader).txnSeq;
                  if (txnSeq !== expandedRow) {
                    return null;
                  }
                  const allocations = allocationsByTxnSeq[txnSeq] ?? [];
                  return <AllocationDetailsTable data={allocations} />;
                }}
                getRowCanExpand={(row) => {
                  const txnSeq = (row.original as CreditorTxnHeader).txnSeq;
                  return Boolean(allocationsByTxnSeq[txnSeq]?.length);
                }}
                onRowExpand={handleRowExpand}
              />
            </Box>
          </BlankCard>
        </Grid>
      </Grid>
    </>
  );
};

export default CreditorTransactionInquiry;


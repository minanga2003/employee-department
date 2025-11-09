import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Button, Stack, Tooltip, Typography } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
import PrintIcon from "@mui/icons-material/Print";

export type CreditorTxnHeader = {
  type: string;
  txnDate: string;
  acNo: string;
  supplier: string;
  txnSeq: number;
  invoiceNo: string;
  amount: string;
  balance: string;
  dueDate: string;
  reference: string;
};

export type CreditorAllocation = {
  type: string;
  txnDate: string;
  txnSeq: number;
  allocatedAmount: string;
  allocatedOn: string;
  allocatedBy: string;
  invoiceNo: string;
  reference: string;
};

const useCreditorTransactionInquiryColumns = () => {
  const helper = createColumnHelper<CreditorTxnHeader>();

  const headerColumns: ColumnDef<CreditorTxnHeader>[] = [
    helper.display({
      id: "options",
      header: () => null,
      enableSorting: false,
      meta: { headerAlign: "center", cellAlign: "center" },
      cell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="View">
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                // Placeholder action
                console.log("View clicked for Txn Seq:", row.original.txnSeq);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Print">
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                // Placeholder action
                console.log("Print clicked for Txn Seq:", row.original.txnSeq);
              }}
            >
              <PrintIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Stack>
      ),
    }),
    helper.accessor("type", {
      header: "Type",
      meta: { headerAlign: "center", cellAlign: "center" },
      cell: (info) => <Typography variant="body2">{info.getValue()}</Typography>,
    }),
    helper.accessor("txnDate", {
      header: "Txn. Date",
      meta: { headerAlign: "right", cellAlign: "right" },
      cell: (info) => <Typography variant="body2">{info.getValue()}</Typography>,
    }),
    helper.accessor("acNo", {
      header: "AC No",
      meta: { headerAlign: "right", cellAlign: "right" },
      cell: (info) => <Typography variant="body2">{info.getValue()}</Typography>,
    }),
    helper.accessor("supplier", {
      header: "Supplier",
      meta: { headerAlign: "center", cellAlign: "center" },
      cell: (info) => <Typography variant="body2">{info.getValue()}</Typography>,
    }),
    helper.accessor("txnSeq", {
      header: "Txn Seq",
      meta: { headerAlign: "right", cellAlign: "right" },
      cell: (info) => <Typography variant="body2">{info.getValue()}</Typography>,
    }),
    helper.accessor("invoiceNo", {
      header: "Invoice No",
      meta: { headerAlign: "right", cellAlign: "right" },
      cell: (info) => <Typography variant="body2">{info.getValue()}</Typography>,
    }),
    helper.accessor("amount", {
      header: "Amount",
      meta: { headerAlign: "right", cellAlign: "right" },
      cell: (info) => (
        <Typography variant="body2" fontWeight={600}>
          {info.getValue()}
        </Typography>
      ),
    }),
    helper.accessor("balance", {
      header: "Balance",
      meta: { headerAlign: "right", cellAlign: "right" },
      cell: (info) => (
        <Typography variant="body2" fontWeight={600}>
          {info.getValue()}
        </Typography>
      ),
    }),
    helper.accessor("dueDate", {
      header: "Due Date",
      meta: { headerAlign: "center", cellAlign: "center" },
      cell: (info) => <Typography variant="body2">{info.getValue()}</Typography>,
    }),
    helper.accessor("reference", {
      header: "Reference",
      meta: { headerAlign: "center", cellAlign: "center" },
      cell: (info) => <Typography variant="body2">{info.getValue()}</Typography>,
    }),
  ];

  return { headerColumns };
};

export default useCreditorTransactionInquiryColumns;


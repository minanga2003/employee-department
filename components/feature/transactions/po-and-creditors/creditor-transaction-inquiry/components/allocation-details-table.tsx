import { Grid, Typography } from "@mui/material";
import ScrollableBox from "@/components/ui/scroll-bar/scroll-bar";
import { baselightTheme } from "@/utils/theme/default-colors";
import { CreditorAllocation } from "./use-creditor-transaction-inquiry-columns";

export type AllocationDetailsTableProps = {
  data: CreditorAllocation[];
};

export const AllocationDetailsTable = ({ data }: AllocationDetailsTableProps) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <Typography sx={{ p: 2, textAlign: "center" }}>
        No allocation details found
      </Typography>
    );
  }

  return (
    <ScrollableBox height="250px">
      <Grid
        container
        spacing={1}
        sx={{
          mb: 1,
          backgroundColor: baselightTheme.palette.grey[200],
          px: 2,
          py: 1,
          alignItems: "center",
        }}
      >
        <Grid item xs={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Txn Date
          </Typography>
        </Grid>
        <Grid item xs={1.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Txn Seq
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: "right" }}>
            Allocated Amount
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: "center" }}>
            Allocated On
          </Typography>
        </Grid>
        <Grid item xs={1.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: "center" }}>
            Allocated By
          </Typography>
        </Grid>
        <Grid item xs={1.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: "center" }}>
            Invoice No
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: "center" }}>
            Reference
          </Typography>
        </Grid>
      </Grid>

      {data.map((item, index) => (
        <Grid
          key={index}
          container
          spacing={1}
          sx={{
            px: 2,
            py: 1,
            borderBottom: (theme) =>
              index !== data.length - 1 ? `1px solid ${theme.palette.divider}` : "none",
          }}
        >
          <Grid item xs={2}>
            <Typography variant="body2">{item.txnDate || "N/A"}</Typography>
          </Grid>
          <Grid item xs={1.5}>
            <Typography variant="body2">{item.txnSeq?.toString() || "N/A"}</Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="body2" sx={{ textAlign: "right" }}>
              {item.allocatedAmount || "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="body2" sx={{ textAlign: "center" }}>
              {item.allocatedOn || "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={1.5}>
            <Typography variant="body2" sx={{ textAlign: "center" }}>
              {item.allocatedBy || "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={1.5}>
            <Typography variant="body2" sx={{ textAlign: "center" }}>
              {item.invoiceNo || "N/A"}
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="body2" sx={{ textAlign: "center" }}>
              {item.reference || "N/A"}
            </Typography>
          </Grid>
        </Grid>
      ))}
    </ScrollableBox>
  );
};


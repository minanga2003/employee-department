"use client";

import * as React from "react";
import {
  Box,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  Typography,
  styled,
  TableRow as MuiTableRow,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  ColumnDef,
  Row,
  RowData,
  Table as ReactTable,
  Updater,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  IconGripVertical,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconArrowsSort,
  IconChevronDown,
  IconChevronRight as IconChevronRightExpand,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";

import CustomSelect from "@/components/forms/select/custom-select";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    selectRow?: (rowId: string) => void;
    clearRowSelection?: () => void;
  }

  interface ColumnMeta<TData extends RowData, TValue> {
    headerAlign?: "left" | "center" | "right";
    headerClassName?: string;
    headerSx?: Record<string, unknown>;
    hideSort?: boolean;
    hideDragHandle?: boolean;
    width?: number | string;
  }
}

const StyledTableRow = styled(MuiTableRow)(({ theme }) => ({
  height: 25,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  "&.highlight-row": {
    backgroundColor: theme.palette.primary.light,
  },
  "&.inactive-row": {
    backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "#f5f5f5",
    opacity: 0.7,
    "&:hover": {
      backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "#e8e8e8",
    },
  },
  "&.deleted-row": {
    backgroundColor: "#ffe6e6",
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: "2px 8px",
  height: 25,
  "&.MuiTableCell-head": {
    backgroundColor: theme.palette.primary.light,
    padding: "2px 8px",
  },
  "&[data-column-id='expander']": {
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    padding: 0,
  },
}));

export type DataTableProps<T extends object> = {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  renderSubComponent?: (props: { row: Row<T> }) => React.ReactElement | null;
  getRowCanExpand?: (row: Row<T>) => boolean;
  onRowExpand?: (row: T, isExpanded: boolean) => void;
  isServerPagination?: boolean;
  fetchData?: (pageIndex: number, pageSize: number) => void;
  totalRows?: number;
  getRowClassName?: (row: T) => string;
  getStableRowId?: (row: T) => string | number | undefined;
  isShowFooter?: boolean;
};

export function DataTable<T extends object>({
  data,
  columns: userColumns,
  renderSubComponent,
  getRowCanExpand,
  onRowExpand,
  isServerPagination = false,
  fetchData,
  totalRows = 0,
  getRowClassName,
  getStableRowId,
}: DataTableProps<T>) {
  const isExpandable = Boolean(renderSubComponent && getRowCanExpand);

  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(12);
  const [selectedRowId, setSelectedRowId] = React.useState<string | null>(null);
  const [columns, setColumns] = React.useState<ColumnDef<T, unknown>[]>(() => {
    if (!isExpandable) return userColumns;
    return [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }: { row: Row<T> }) => {
          if (!row.getCanExpand()) return null;
          return (
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                if (!row.getIsExpanded()) {
                  table.resetExpanded();
                }
                row.getToggleExpandedHandler()();
                onRowExpand?.(row.original, !row.getIsExpanded());
              }}
              sx={{ p: 0.5, display: "flex", justifyContent: "center" }}
            >
              {row.getIsExpanded() ? (
                <IconChevronDown className="table-col-btn-expand" />
              ) : (
                <IconChevronRightExpand className="table-col-btn-expand" />
              )}
            </IconButton>
          );
        },
        size: 50,
        minSize: 50,
        maxSize: 50,
        enableResizing: false,
        enableSorting: false,
        meta: { headerAlign: "center", headerClassName: "expander-column" },
      },
      ...userColumns,
    ];
  });

  React.useEffect(() => {
    if (!isExpandable) {
      setColumns(userColumns);
      return;
    }
  }, [isExpandable, userColumns]);

  React.useEffect(() => {
    setColumns((prevColumns) => {
      if (!isExpandable) return userColumns;
      const hasExpander = prevColumns.some((column) => column.id === "expander");
      if (hasExpander) return prevColumns;

      return [
        {
          id: "expander",
          header: () => null,
          cell: ({ row }: { row: Row<T> }) => {
            if (!row.getCanExpand()) return null;
            return (
              <IconButton
                size="small"
                onClick={row.getToggleExpandedHandler()}
                sx={{ p: 0.5, display: "flex", justifyContent: "center" }}
              >
                {row.getIsExpanded() ? (
                  <IconChevronDown className="table-col-btn-expand" />
                ) : (
                  <IconChevronRightExpand className="table-col-btn-expand" />
                )}
              </IconButton>
            );
          },
          size: 50,
          minSize: 50,
          maxSize: 50,
          enableResizing: false,
          enableSorting: false,
          meta: { headerAlign: "center", headerClassName: "expander-column" },
        },
        ...userColumns,
      ];
    });
  }, [isExpandable, userColumns]);

  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});
  const [draggedColumnId, setDraggedColumnId] = React.useState<string | null>(null);
  const [resizing, setResizing] = React.useState(false);

  const getRowId = React.useCallback(
    (originalRow: T, index: number) => {
      const stable = getStableRowId?.(originalRow);
      return (stable ?? index).toString();
    },
    [getStableRowId]
  );

  // TanStack Table exposes imperative helpers that trip the React compiler warning in React 19.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    ...(isExpandable && {
      getExpandedRowModel: getExpandedRowModel(),
      getRowCanExpand,
    }),
    manualPagination: isServerPagination,
    pageCount: isServerPagination ? Math.ceil(totalRows / pageSize) : undefined,
    state: { pagination: { pageIndex, pageSize } },
    initialState: {
      sorting: [],
      pagination: { pageSize: 12 },
      ...(isExpandable && { expanded: {} }),
    },
    onPaginationChange: (updater: Updater<{ pageIndex: number; pageSize: number }>) => {
      const nextState =
        typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(nextState.pageIndex);
      setPageSize(nextState.pageSize);
      if (isServerPagination) {
        fetchData?.(nextState.pageIndex, nextState.pageSize);
      }
    },
    getRowId,
    meta: {
      selectRow: (rowId: string) => setSelectedRowId(rowId),
      clearRowSelection: () => setSelectedRowId(null),
    },
  });

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [hasHOverflow, setHasHOverflow] = React.useState(false);

  const hasRows = table.getRowModel().rows.length > 0;

  React.useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const element = containerRef.current;
    if (!element) return;

    const checkOverflow = () => {
      setHasHOverflow(element.scrollWidth > element.clientWidth);
    };

    checkOverflow();
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(element);
    window.addEventListener("resize", checkOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, [data, columns, pageIndex, pageSize, hasRows]);

  const handleDragStart = (event: React.DragEvent, columnId: string) => {
    event.stopPropagation();
    if (columnId === "options") return;
    setDraggedColumnId(columnId);
  };

  const handleDragOver = (event: React.DragEvent, targetColumnId: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (!draggedColumnId || draggedColumnId === targetColumnId) return;

    setColumns((prevColumns) => {
      const draggedIndex = prevColumns.findIndex((column) => column.id === draggedColumnId);
      const targetIndex = prevColumns.findIndex((column) => column.id === targetColumnId);

      if (draggedIndex === -1 || targetIndex === -1) {
        return prevColumns;
      }

      const newColumns = [...prevColumns];
      const [draggedColumn] = newColumns.splice(draggedIndex, 1);
      newColumns.splice(targetIndex, 0, draggedColumn);

      if (draggedColumn.id === "expander" || targetColumnId === "expander") {
        return prevColumns;
      }

      return newColumns;
    });
  };

  const handleDragEnd = () => {
    setDraggedColumnId(null);
  };

  const handleResizeStart = (event: React.MouseEvent, columnId: string) => {
    event.preventDefault();
    setResizing(true);
    const startX = event.clientX;
    const startWidth = columnWidths[columnId] || 150;

    const handleMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(100, startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [columnId]: newWidth }));
    };

    const handleUp = () => {
      setResizing(false);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const renderHeaderCell = (header: ReturnType<typeof table.getHeaderGroups>[number]["headers"][number], isFirstColumn: boolean) => {
    const canSort = header.column.id !== "expander" && !header.column.columnDef.meta?.hideSort;
    const headerAlign: "left" | "center" | "right" = header.column.columnDef.meta?.headerAlign ?? "left";
    const justifyContent =
      headerAlign === "center" ? "center" : headerAlign === "right" ? "flex-end" : "flex-start";

    const headerSx = header.column.columnDef.meta?.headerSx as Record<string, unknown> | undefined;

    const sortIcon = () => {
      const sortState = header.column.getIsSorted();
      if (sortState === "asc") return <IconArrowUp style={{ marginLeft: 4, flexShrink: 0 }} />;
      if (sortState === "desc") return <IconArrowDown style={{ marginLeft: 4, flexShrink: 0 }} />;
      return <IconArrowsSort style={{ marginLeft: 4, flexShrink: 0 }} />;
    };

    return (
      <StyledTableCell
        key={header.id}
        data-column-id={header.column.id}
        draggable={
          !resizing &&
          !isFirstColumn &&
          header.column.id !== "expander" &&
          header.column.id !== "options" &&
          !header.column.columnDef.meta?.hideDragHandle
        }
        onDragStart={(event) => {
          if (!isFirstColumn && !header.column.columnDef.meta?.hideDragHandle) {
            handleDragStart(event, header.column.id);
          }
        }}
        onDragOver={(event) => {
          if (!isFirstColumn && !header.column.columnDef.meta?.hideDragHandle) {
            handleDragOver(event, header.column.id);
          }
        }}
        onDragEnd={
          !isFirstColumn && !header.column.columnDef.meta?.hideDragHandle ? handleDragEnd : undefined
        }
        style={{
          width:
            header.column.columnDef.meta?.width || columnWidths[header.column.id] || header.column.columnDef.size || "auto",
          minWidth:
            header.column.columnDef.meta?.width || columnWidths[header.column.id] || header.column.columnDef.size || "auto",
          maxWidth:
            header.column.columnDef.meta?.width || columnWidths[header.column.id] || header.column.columnDef.size || "auto",
          position: "relative",
          cursor: resizing
            ? "col-resize"
            : !isFirstColumn
              ? "move"
              : "default",
          userSelect: "none",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          {!isFirstColumn &&
            header.column.id !== "expander" &&
            header.column.id !== "options" &&
            !header.column.columnDef.meta?.hideDragHandle && (
            <IconGripVertical size={12} style={{ cursor: "move" }} />
          )}
          <Box
            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent,
              width: "100%",
              whiteSpace: "nowrap",
              cursor: header.column.id !== "expander" ? "pointer" : "default",
            }}
          >
            <Typography
              sx={{
                fontSize: "clamp(11px, 1.2vw, 13px)",
                fontWeight: 600,
                cursor: header.column.id !== "expander" ? "pointer" : "default",
                ...(headerSx ?? {}),
              }}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </Typography>
            {header.column.id !== "expander" && !header.column.columnDef.meta?.hideSort && (
              <Box component="span" sx={{ display: "inline-flex", alignItems: "center", position: "relative", top: 2 }}>
                {sortIcon()}
              </Box>
            )}
          </Box>
          {header.column.id !== "expander" && !header.column.columnDef.meta?.hideSort && (
            <Box
              sx={{
                position: "absolute",
                right: -4,
                top: 0,
                bottom: 0,
                width: 8,
                cursor: "col-resize",
                "&:hover": { backgroundColor: "primary.main" },
                zIndex: 1,
              }}
              onMouseDown={(event) => handleResizeStart(event, header.column.id)}
            />
          )}
        </Stack>
      </StyledTableCell>
    );
  };

  return (
    <Box>
      <TableContainer
        ref={containerRef}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: "100%",
          display: "block",
          overflowX: hasRows ? "auto" : "hidden",
          scrollbarGutter: hasRows && hasHOverflow ? "stable both-edges" : undefined,
          scrollbarWidth: hasRows ? "thin" : undefined,
          scrollbarColor: hasRows ? ((theme) => `${theme.palette.primary.main} ${theme.palette.primary.light}`) : undefined,
          "&::-webkit-scrollbar": {
            height: hasRows ? 10 : 0,
          },
          "&::-webkit-scrollbar-thumb": hasRows
            ? {
                backgroundColor: (theme) => theme.palette.primary.main,
                borderRadius: 8,
                border: (theme) => `2px solid ${theme.palette.primary.light}`,
              }
            : {},
          "&::-webkit-scrollbar-track": hasRows
            ? { backgroundColor: (theme) => theme.palette.primary.light }
            : {},
          "&::-webkit-scrollbar-corner": hasRows
            ? { backgroundColor: (theme) => theme.palette.primary.light }
            : {},
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: "4px 4px 0 0",
        }}
      >
        <Table
          sx={{
            tableLayout: "auto",
            minWidth: "max-content",
            width: "100%",
            whiteSpace: "nowrap",
          }}
        >
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <MuiTableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => renderHeaderCell(header, index === 0))}
              </MuiTableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <StyledTableRow
                  className={`${getRowClassName?.(row.original) ?? ""} ${
                    row.id === selectedRowId ? "highlight-row" : ""
                  }`}
                  onClick={() =>
                    setSelectedRowId((prev) => (prev === row.id ? null : row.id))
                  }
                  hover
                  sx={{ cursor: "pointer" }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <StyledTableCell
                      key={cell.id}
                      style={{
                        width:
                          cell.column.id === "expander"
                            ? 50
                            : columnWidths[cell.column.id] || "auto",
                        minWidth:
                          cell.column.id === "expander"
                            ? 50
                            : columnWidths[cell.column.id] || "auto",
                        maxWidth:
                          cell.column.id === "expander"
                            ? 50
                            : columnWidths[cell.column.id] || "auto",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        padding: cell.column.id === "expander" ? "0px" : "2px 8px",
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </StyledTableCell>
                  ))}
                </StyledTableRow>
                {isExpandable && row.getIsExpanded() && renderSubComponent && (
                  <MuiTableRow>
                    <TableCell colSpan={row.getVisibleCells().length} sx={{ p: 0, border: 0, height: "auto" }}>
                      <Box sx={{ p: 2, backgroundColor: "grey.50" }}>
                          {renderSubComponent({ row })}
                        </Box>
                      </TableCell>
                  </MuiTableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Divider />
      <TablePaginationLocal table={table} isServerPagination={isServerPagination} />
    </Box>
  );
}

type TablePaginationLocalProps<T extends object> = {
  table: ReactTable<T>;
  isServerPagination: boolean;
};

function TablePaginationLocal<T extends object>({ table, isServerPagination }: TablePaginationLocalProps<T>) {
  return (
      <Stack
      gap={2}
      p={2}
      alignItems="center"
        direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
    >
      <Box
        display="flex"
        alignItems="center"
        sx={{
          backgroundColor: (theme) => theme.palette.primary.main,
          color: "white",
          py: 0.5,
          px: 2,
          borderRadius: 1,
        }}
      >
        <Typography variant="body2" fontWeight={500} color="white">
          {isServerPagination ? "Fetching data..." : `${table.getPrePaginationRowModel().rows.length} Rows`}
        </Typography>
      </Box>
      <Box
        sx={{
          display: { xs: "block", sm: "flex" },
          alignItems: "center",
          gap: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, borderRadius: 1 }}>
          <Typography sx={{ fontSize: "12px" }} color="text.secondary">
            Page
          </Typography>
          <Typography sx={{ fontSize: "12px" }} fontWeight={600} color="text.primary">
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </Typography>
        </Stack>
            <CustomSelect
              value={table.getState().pagination.pageSize}
          onChange={(event: SelectChangeEvent<unknown>) => {
            table.setPageSize(Number(event.target.value));
          }}
          sx={{
            height: 32,
            minWidth: 80,
            backgroundColor: "#f5f5f5",
            "& .MuiSelect-select": {
              padding: "4px 8px",
            },
          }}
        >
          {[12, 24, 40, 50].map((size) => (
            <MenuItem key={size} value={size} sx={{ fontSize: "12px" }}>
              {size} / page
                </MenuItem>
              ))}
            </CustomSelect>
        <Stack direction="row" spacing={0.5} sx={{ backgroundColor: "#f5f5f5", p: 0.5, borderRadius: 1 }}>
          <IconButton
            size="small"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <IconChevronsLeft size={18} />
            </IconButton>
          <IconButton
            size="small"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <IconChevronLeft size={18} />
            </IconButton>
          <IconButton size="small" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <IconChevronRight size={18} />
            </IconButton>
          <IconButton
            size="small"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <IconChevronsRight size={18} />
            </IconButton>
        </Stack>
      </Box>
      </Stack>
  );
}

export default DataTable;


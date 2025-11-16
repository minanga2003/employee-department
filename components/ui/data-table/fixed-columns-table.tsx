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
  TableFooter,
  TableHead,
  TableRow,
  Typography,
  styled,
  TableRow as MuiTableRow,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  ColumnDef,
  ColumnOrderState,
  ColumnResizeMode,
  ColumnSizingState,
  Row,
  RowData,
  SortingState,
  Updater,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconGripVertical,
} from "@tabler/icons-react";
import { IconChevronRight as IconChevronRightExpand } from "@tabler/icons-react";

import CustomSelect from "@/components/forms/select/custom-select";

const DEFAULT_FIXED_COLUMNS_COUNT = 4;

interface CustomColumnMeta {
  isFixed?: boolean;
  hideSort?: boolean;
  isFirstDataColumn?: boolean;
  headerAlign?: "left" | "center" | "right";
  hideDragHandle?: boolean;
}

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends unknown, TValue> extends CustomColumnMeta {}
  interface TableMeta<TData extends RowData> {
    selectRow?: (rowId: string) => void;
    clearRowSelection?: () => void;
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

const StyledTableCell = styled(TableCell, {
  shouldForwardProp: (prop) =>
    prop !== "isFixed" && prop !== "isLastFixed" && prop !== "stickySide",
})<{
  isFixed?: boolean;
  isLastFixed?: boolean;
  stickySide?: "left" | "right";
}>(({ theme, isFixed, isLastFixed, stickySide }) => ({
  padding: "2px 12px",
  height: 25,
  borderBottom: `1px solid ${theme.palette.divider}`,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  position: "relative",
  "&.MuiTableCell-head": {
    backgroundColor: theme.palette.primary.light,
    overflow: "visible",
    zIndex: 3,
    fontWeight: 600,
    fontSize: "0.75rem",
  },
  "&[data-column-id='expander']": {
    padding: 0,
  },
  ...(isFixed && {
    position: "sticky",
    backgroundColor: theme.palette.grey[50],
    ...(stickySide === "left" && {
      left: 0,
      zIndex: 2,
    }),
    ...(stickySide === "right" && {
      right: 0,
      zIndex: 2,
    }),
    "&.MuiTableCell-head": {
      zIndex: 4,
      backgroundColor: theme.palette.primary.light,
    },
  }),
  ...(isFixed &&
    isLastFixed &&
    stickySide === "left" && {
      boxShadow: "5px 0 5px -5px rgba(0,0,0,0.12)",
    }),
  ...(isFixed &&
    isLastFixed &&
    stickySide === "right" && {
      boxShadow: "-5px 0 5px -5px rgba(0,0,0,0.12)",
    }),
  "&.highlight-row": {
    backgroundColor: `${theme.palette.primary.light} !important`,
  },
}));

const ResizeHandle = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isResizing",
})<{ isResizing?: boolean }>(({ theme, isResizing }) => ({
  position: "absolute",
  right: -2,
  top: 0,
  bottom: 0,
  width: 4,
  cursor: "col-resize",
  userSelect: "none",
  touchAction: "none",
  backgroundColor: isResizing ? theme.palette.primary.main : "transparent",
  opacity: isResizing ? 0.5 : 0,
  transition: "opacity 0.2s ease",
  zIndex: 5,
  "&:hover": {
    opacity: 0.5,
    backgroundColor: theme.palette.primary.main,
  },
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 1,
    backgroundColor: isResizing ? theme.palette.primary.dark : theme.palette.grey[400],
  },
}));

export type FixedColumnsTableProps<T extends object> = {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  renderSubComponent?: (props: { row: Row<T> }) => React.ReactElement | null;
  getRowCanExpand?: (row: Row<T>) => boolean;
  onRowExpand?: (row: T, isExpanded: boolean) => void;
  isServerPagination?: boolean;
  fetchData?: (pageIndex: number, pageSize: number) => void;
  totalRows?: number;
  firstColumnWidth?: number;
  expanderColumnWidth?: number;
  fixedColumnsCount?: number;
  isLoading?: boolean;
  isShowFooter?: boolean;
  getRowClassName?: (row: T) => string;
  getStableRowId?: (row: T) => string | number | undefined;
};

export function FixedColumnsDataTable<T extends object>({
  data,
  columns: userColumns,
  renderSubComponent,
  getRowCanExpand,
  onRowExpand,
  isServerPagination = false,
  fetchData,
  totalRows = 0,
  firstColumnWidth = 60,
  expanderColumnWidth = 48,
  fixedColumnsCount = DEFAULT_FIXED_COLUMNS_COUNT,
  isLoading = false,
  isShowFooter = false,
  getRowClassName,
  getStableRowId,
}: FixedColumnsTableProps<T>) {
  const isExpandable = Boolean(renderSubComponent && getRowCanExpand);

  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(12);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([]);
  const [expanded, setExpanded] = React.useState({});
  const [draggedColumnId, setDraggedColumnId] = React.useState<string | null>(null);
  const [resizingColumnId, setResizingColumnId] = React.useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = React.useState<string | null>(null);

  const [columns, setColumns] = React.useState(() => {
    let cols = [...userColumns].map((column, index) => ({
      ...column,
      meta: {
        ...column.meta,
        isFixed: index < fixedColumnsCount,
        isFirstDataColumn: index === 0,
      },
    }));

    if (cols.length > 0) {
      const first = cols[0];
      cols[0] = {
        ...first,
        size: firstColumnWidth,
        minSize: firstColumnWidth,
        maxSize: firstColumnWidth * 2,
      };
    }

    if (isExpandable) {
      cols = [
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
                  row.getToggleExpandedHandler()();
                  onRowExpand?.(row.original, !row.getIsExpanded());
                }}
                sx={{ p: 0.5, display: "flex", justifyContent: "center" }}
              >
                {row.getIsExpanded() ? (
                  <IconChevronDown size={16} />
                ) : (
                  <IconChevronRightExpand size={16} />
                )}
              </IconButton>
            );
          },
          size: expanderColumnWidth,
          minSize: expanderColumnWidth,
          maxSize: expanderColumnWidth,
          enableResizing: false,
          enableSorting: false,
          meta: {
            isFixed: true,
            hideSort: true,
            isFirstDataColumn: false,
            hideDragHandle: true,
          },
        },
        ...cols,
      ];
    }

    return cols;
  });

  React.useEffect(() => {
    setColumns(() => {
      let cols = [...userColumns].map((column, index) => ({
        ...column,
        meta: {
          ...column.meta,
          isFixed: index < fixedColumnsCount,
          isFirstDataColumn: index === 0,
        },
      }));

      if (cols.length > 0) {
        const first = cols[0];
        cols[0] = {
          ...first,
          size: firstColumnWidth,
          minSize: firstColumnWidth,
          maxSize: firstColumnWidth * 2,
        };
      }

      if (isExpandable) {
        cols = [
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
                    row.getToggleExpandedHandler()();
                    onRowExpand?.(row.original, !row.getIsExpanded());
                  }}
                  sx={{ p: 0.5, display: "flex", justifyContent: "center" }}
                >
                  {row.getIsExpanded() ? (
                    <IconChevronDown size={16} />
                  ) : (
                    <IconChevronRightExpand size={16} />
                  )}
                </IconButton>
              );
            },
            size: expanderColumnWidth,
            minSize: expanderColumnWidth,
            maxSize: expanderColumnWidth,
            enableResizing: false,
            enableSorting: false,
            meta: {
              isFixed: true,
              hideSort: true,
              isFirstDataColumn: false,
              hideDragHandle: true,
            },
          },
          ...cols,
        ];
      }

      return cols;
    });
  }, [
    expanderColumnWidth,
    firstColumnWidth,
    fixedColumnsCount,
    isExpandable,
    onRowExpand,
    userColumns,
  ]);

  React.useEffect(() => {
    if (columnOrder.length === 0) {
      const initial = columns.map((column, index) => {
        const col: any = column;
        const id = col.id ?? col.accessorKey ?? index;
        return String(id);
      });
      setColumnOrder(initial);
    }
  }, [columnOrder.length, columns]);

  const getRowId = React.useCallback(
    (originalRow: T, index: number) => {
      const stable = getStableRowId?.(originalRow);
      return (stable ?? index).toString();
    },
    [getStableRowId]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: isExpandable ? getExpandedRowModel() : undefined,
    getRowCanExpand: isExpandable ? getRowCanExpand : undefined,
    enableColumnResizing: true,
    columnResizeMode: "onChange" as ColumnResizeMode,
    manualPagination: isServerPagination,
    pageCount: isServerPagination ? Math.ceil(totalRows / pageSize) : undefined,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
      columnVisibility,
      columnOrder,
      columnSizing,
      ...(isExpandable && { expanded }),
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onExpandedChange: setExpanded,
    onPaginationChange: (updater: Updater<{ pageIndex: number; pageSize: number }>) => {
      const next =
        typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
      setPageSize(next.pageSize);
      if (isServerPagination) {
        fetchData?.(next.pageIndex, next.pageSize);
      }
    },
    defaultColumn: {
      minSize: 80,
      size: 120,
      maxSize: 500,
    },
    getRowId,
    meta: {
      selectRow: (rowId: string) => setSelectedRowId(rowId),
      clearRowSelection: () => setSelectedRowId(null),
    },
  });

  const getFixedLeftPosition = (index: number) => {
    const headers = table.getHeaderGroups()[0]?.headers ?? [];
    let position = 0;
    for (let i = 0; i < index; i += 1) {
      const header = headers[i];
      if (header && header.column.getIsVisible()) {
        position += header.getSize();
      }
    }
    return position;
  };

  const isFixedColumn = (header: any) => header.column.columnDef.meta?.isFixed === true;

  const isLastFixedColumn = (header: any) => {
    const headers = table.getHeaderGroups()[0]?.headers ?? [];
    const fixedHeaders = headers.filter((h) => h.column.columnDef.meta?.isFixed);
    const lastFixed = fixedHeaders[fixedHeaders.length - 1];
    return lastFixed?.id === header.id;
  };

  const startResize = React.useCallback(
    (header: any) => (event: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
      event.stopPropagation();
      event.preventDefault?.();
      setResizingColumnId(header.id);
      const handler = header.getResizeHandler();
      handler?.(event);
      const end = () => setResizingColumnId(null);
      window.addEventListener("mouseup", end, { once: true });
      window.addEventListener("touchend", end, { once: true });
      window.addEventListener("pointerup", end, { once: true });
    },
    []
  );

  const handleDragStart = (event: React.DragEvent, columnId: string) => {
    const column = table.getColumn(columnId);
    if (column?.columnDef.meta?.isFixed) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/plain", columnId);
    event.dataTransfer.effectAllowed = "move";
    setDraggedColumnId(columnId);
    (event.currentTarget as HTMLElement).style.opacity = "0.5";
  };

  const handleDragOver = (event: React.DragEvent, targetColumnId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const targetColumn = table.getColumn(targetColumnId);
    if (targetColumn?.columnDef.meta?.isFixed) return;
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (event: React.DragEvent, targetColumnId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const draggedId = event.dataTransfer.getData("text/plain");
    const targetColumn = table.getColumn(targetColumnId);
    if (!draggedId || targetColumn?.columnDef.meta?.isFixed) return;
    if (draggedId === targetColumnId) return;

    setColumnOrder((current) => {
      const next = [...current];
      const draggedIndex = next.indexOf(draggedId);
      const targetIndex = next.indexOf(targetColumnId);
      if (draggedIndex >= 0 && targetIndex >= 0) {
        next.splice(draggedIndex, 1);
        next.splice(targetIndex, 0, draggedId);
      }
      table.setColumnOrder(next);
      return next;
    });
    setDraggedColumnId(null);
  };

  const handleDragEnd = (event: React.DragEvent) => {
    setDraggedColumnId(null);
    (event.currentTarget as HTMLElement).style.opacity = "1";
  };

  const renderHeaderCell = (header: any) => {
    const isFixed = isFixedColumn(header);
    const isLastFixed = isLastFixedColumn(header);
    const isDraggable =
      !isFixed && header.column.id !== "expander" && header.column.id !== "options";
    const leftPosition = isFixed ? getFixedLeftPosition(header.index) : undefined;
    const isResizing = resizingColumnId === header.id;
    const computedSize = header.getSize();
    const headerAlign: "left" | "center" | "right" =
      header.column.columnDef.meta?.headerAlign ?? "left";
    const justify =
      headerAlign === "center" ? "center" : headerAlign === "right" ? "flex-end" : "flex-start";
    const canSort = header.column.id !== "expander" && !header.column.columnDef.meta?.hideSort;

    const SortIcon = () => {
      const sortState = header.column.getIsSorted();
      if (sortState === "asc") return <IconArrowUp size={14} style={{ marginLeft: 4 }} />;
      if (sortState === "desc") return <IconArrowDown size={14} style={{ marginLeft: 4 }} />;
      return <IconArrowsSort size={14} style={{ marginLeft: 4 }} />;
    };

    return (
      <StyledTableCell
        key={header.id}
        isFixed={isFixed}
        isLastFixed={isLastFixed}
        stickySide="left"
        colSpan={header.colSpan}
        data-column-id={header.column.id}
        draggable={isDraggable && resizingColumnId !== header.id && !header.column.columnDef.meta?.hideDragHandle}
        onDragStart={(event) => {
          if (isDraggable && !header.column.columnDef.meta?.hideDragHandle) {
            handleDragStart(event, header.column.id);
          }
        }}
        onDragOver={(event) => {
          if (isDraggable && !header.column.columnDef.meta?.hideDragHandle) {
            handleDragOver(event, header.column.id);
          }
        }}
        onDrop={(event) => {
          if (isDraggable && !header.column.columnDef.meta?.hideDragHandle) {
            handleDrop(event, header.column.id);
          }
        }}
        onDragEnd={(event) => {
          if (isDraggable && !header.column.columnDef.meta?.hideDragHandle) {
            handleDragEnd(event);
          }
        }}
        style={{
          left: leftPosition,
          cursor: isDraggable ? "move" : "default",
          width: computedSize,
          minWidth: computedSize,
          maxWidth: computedSize,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%" }}>
          {isDraggable && !header.column.columnDef.meta?.hideDragHandle && (
            <IconGripVertical size={12} style={{ cursor: "move" }} />
          )}
          <Box
            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: justify,
              width: "100%",
              whiteSpace: "nowrap",
              cursor: canSort ? "pointer" : "default",
              color: isFixed ? "primary.main" : "inherit",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: canSort ? "pointer" : "default",
                color: isFixed ? "primary.main" : "inherit",
              }}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </Typography>
            {canSort && <SortIcon />}
          </Box>
        </Stack>
        {header.column.getCanResize() && (
          <ResizeHandle
            isResizing={isResizing}
            onMouseDown={startResize(header)}
            onTouchStart={startResize(header)}
            onPointerDown={startResize(header)}
            onClick={(event) => event.stopPropagation()}
            onDragStart={(event) => event.preventDefault()}
          />
        )}
      </StyledTableCell>
    );
  };

  const renderDataCell = (cell: any) => {
    const isFixed = cell.column.columnDef.meta?.isFixed === true;
    const headers = table.getHeaderGroups()[0]?.headers ?? [];
    const columnIndex = headers.findIndex((header) => header.column.id === cell.column.id);
    const leftPosition = isFixed ? getFixedLeftPosition(columnIndex) : undefined;
    const computedSize = cell.column.getSize();
    const fixedHeaders = headers.filter((header) => header.column.columnDef.meta?.isFixed);
    const lastFixedId = fixedHeaders[fixedHeaders.length - 1]?.id;
    const isLastFixed = lastFixedId === cell.column.id;
    const isRowHighlighted = cell.row.id === selectedRowId;
    const extraRowClass = getRowClassName?.(cell.row.original) ?? "";

    return (
      <StyledTableCell
        key={cell.id}
        isFixed={isFixed}
        isLastFixed={isLastFixed}
        stickySide="left"
        data-column-id={cell.column.id}
        className={`${isRowHighlighted ? "highlight-row" : ""} ${extraRowClass}`}
        style={{
          left: leftPosition,
          width: computedSize,
          minWidth: computedSize,
          maxWidth: computedSize,
        }}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </StyledTableCell>
    );
  };

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [hasHOverflow, setHasHOverflow] = React.useState(false);

  React.useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const element = containerRef.current;
    if (!element) return;
    const checkOverflow = () => {
      const hasOverflow = element.scrollWidth > element.clientWidth;
      // Only update state when the value actually changes to avoid unnecessary re-renders
      setHasHOverflow((prev) => (prev !== hasOverflow ? hasOverflow : prev));
    };
    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(element);
    window.addEventListener("resize", checkOverflow);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
    // We intentionally run this effect only once on mount. ResizeObserver and the window
    // resize listener will keep `hasHOverflow` in sync with layout changes, and limiting
    // re-runs prevents update loops that can trigger "Maximum update depth exceeded" errors.
  }, []);

  const rows = table.getRowModel().rows;

  return (
    <Box>
      <TableContainer
        ref={containerRef}
        sx={{
          position: "relative",
          overflowX: rows.length ? "auto" : "hidden",
          scrollbarGutter: rows.length && hasHOverflow ? "stable" : undefined,
          scrollbarWidth: rows.length ? "thin" : undefined,
          scrollbarColor: rows.length
            ? (theme) => `${theme.palette.primary.main} ${theme.palette.primary.light}`
            : undefined,
          "&::-webkit-scrollbar": {
            height: rows.length ? 10 : 0,
          },
          "&::-webkit-scrollbar-thumb": rows.length
            ? {
                backgroundColor: (theme) => theme.palette.primary.main,
                borderRadius: 8,
                border: (theme) => `2px solid ${theme.palette.primary.light}`,
              }
            : {},
          "&::-webkit-scrollbar-track": rows.length
            ? { backgroundColor: (theme) => theme.palette.primary.light }
            : {},
          "&::-webkit-scrollbar-corner": rows.length
            ? { backgroundColor: (theme) => theme.palette.primary.light }
            : {},
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: "4px 4px 0 0",
          "& table": { minWidth: "100%" },
        }}
      >
        <Table
          sx={{
            tableLayout: "fixed",
            width: table.getTotalSize(),
            borderCollapse: "separate",
            borderSpacing: 0,
            whiteSpace: "nowrap",
          }}
        >
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => renderHeaderCell(header))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <React.Fragment key={row.id}>
                <StyledTableRow
                  className={`${row.id === selectedRowId ? "highlight-row" : ""} ${
                    getRowClassName?.(row.original) ?? ""
                  }`}
                  hover
                  onClick={() => setSelectedRowId((prev) => (prev === row.id ? null : row.id))}
                  sx={{ cursor: "pointer" }}
                >
                  {row.getVisibleCells().map((cell) => renderDataCell(cell))}
                </StyledTableRow>
                {isExpandable && row.getIsExpanded() && renderSubComponent && (
                  <MuiTableRow>
                    <TableCell colSpan={row.getVisibleCells().length} sx={{ p: 0, border: 0 }}>
                      <Box sx={{ p: 2, backgroundColor: "grey.50" }}>
                        {renderSubComponent({ row })}
                      </Box>
                    </TableCell>
                  </MuiTableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
          {isShowFooter && (
            <TableFooter>
              {table.getFooterGroups().map((footerGroup) => (
                <TableRow key={footerGroup.id}>
                  {footerGroup.headers.map((header) => {
                    const isFixed = isFixedColumn(header);
                    const isLastFixed = isLastFixedColumn(header);
                    const leftPosition = isFixed ? getFixedLeftPosition(header.index) : undefined;
                    const computedSize = header.getSize();
                    return (
                      <StyledTableCell
                        key={header.id}
                        isFixed={isFixed}
                        isLastFixed={isLastFixed}
                        stickySide="left"
                        colSpan={header.colSpan}
                        data-column-id={header.column.id}
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          backgroundColor: "#fafafa",
                        }}
                        style={{
                          left: leftPosition,
                          width: computedSize,
                          minWidth: computedSize,
                          maxWidth: computedSize,
                        }}
                      >
                        {flexRender(header.column.columnDef.footer, header.getContext())}
                      </StyledTableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableFooter>
          )}
        </Table>
      </TableContainer>
      <Divider />
      <TablePagination
        table={table}
        isServerPagination={isServerPagination}
        isLoading={isLoading}
      />
    </Box>
  );
}

type PaginationProps<T extends object> = {
  table: ReturnType<typeof useReactTable<T>>;
  isServerPagination: boolean;
  isLoading: boolean;
};

const TablePagination = <T extends object,>({
  table,
  isServerPagination,
  isLoading,
}: PaginationProps<T>) => {
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
          {isServerPagination || isLoading
            ? "Fetching data..."
            : `${table.getPrePaginationRowModel().rows.length} Rows`}
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
            minWidth: 90,
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
          <IconButton
            size="small"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
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
};
export default FixedColumnsDataTable;
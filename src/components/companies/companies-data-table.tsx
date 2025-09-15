"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import type { RouterOutputs } from "@/trpc/react";

type Company = RouterOutputs["company"]["getAll"][0];

interface CompaniesDataTableProps {
  data: Company[];
  // Optional props for different display modes
  hideSponsorColumn?: boolean; // Hide sponsor column when showing single sponsor's companies
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconCircleCheckFilled,
  IconExternalLink,
  IconLayoutColumns,
} from "@tabler/icons-react";
import { formatDate } from "@/lib/format";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileCompanyCard } from "./mobile-company-card";
import { useCompanyDrawer } from "./company-drawer-context";

// Create flexible columns that can adapt based on props
const createColumns = (hideSponsorColumn = false): ColumnDef<Company>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 48,
  },
  {
    accessorKey: "company",
    header: "Company",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.asset}</span>
    ),
    enableHiding: false,
    size: 384,
  },
  // Conditionally include sponsor column
  ...(hideSponsorColumn
    ? []
    : [
        {
          accessorKey: "sponsor",
          header: "Sponsor",
          cell: ({ row }) => (
            <Badge variant="outline" className="text-muted-foreground px-1.5">
              {row.original.sponsor.name}
            </Badge>
          ),
          size: 224,
        } as ColumnDef<Company>,
      ]),
  {
    accessorKey: "invested",
    header: () => <div className="w-full text-center">Invested</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {row.original.dateInvested
          ? formatDate(row.original.dateInvested, {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            })
          : "-"}
      </div>
    ),
    size: 160,
  },
  {
    accessorKey: "sector",
    header: "Sector",
    cell: ({ row }) => (
      <div className="w-40 truncate">{row.original.sector ?? "-"}</div>
    ),
    size: 224,
  },
  {
    accessorKey: "location",
    header: () => <div className="w-full text-center">Location</div>,
    cell: ({ row }) => (
      <div className="w-32 truncate text-center">
        {row.original.location ?? "-"}
      </div>
    ),
    size: 192,
  },
  {
    accessorKey: "status",
    header: () => <div className="w-full text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status || "ACTIVE"; // Default to ACTIVE if status is missing
      return (
        <div className="flex justify-center">
          <Badge variant="outline" className="px-2 py-1">
            {status === "EXITED" ? (
              <span className="relative mr-2 inline-block size-2 rounded-full bg-rose-500" />
            ) : (
              <IconCircleCheckFilled className="mr-2 size-4 fill-emerald-500" />
            )}
            {status === "ACTIVE" ? "Active" : "Exited"}
          </Badge>
        </div>
      );
    },
    size: 160,
  },
  {
    accessorKey: "source",
    header: () => <div className="w-full text-center">Source</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.webpage ? (
          <a
            href={row.original.webpage}
            target="_blank"
            rel="noreferrer"
            className="text-foreground inline-flex items-center gap-1 hover:text-blue-600"
            aria-label="Open source link"
          >
            <IconExternalLink className="size-4" />
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    ),
    size: 96,
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem>View</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Remove</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    size: 64,
  },
];

export function CompaniesDataTable({
  data,
  hideSponsorColumn = false,
}: CompaniesDataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const { openCompanyDrawer } = useCompanyDrawer();

  const columns = React.useMemo(
    () => createColumns(hideSponsorColumn),
    [hideSponsorColumn],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const isMobile = useIsMobile();

  React.useEffect(() => {
    table.resetRowSelection();
    table.resetPagination();
  }, [data, table]);

  const handleRowClick = React.useCallback(
    (companyId: string) => {
      const company = data.find((c) => c.id === companyId);
      if (company) {
        openCompanyDrawer(company);
      }
    },
    [data, openCompanyDrawer],
  );

  const [sponsorFilter, setSponsorFilter] = React.useState<string | undefined>(
    undefined,
  );
  const [sectorFilter, setSectorFilter] = React.useState<string | undefined>(
    undefined,
  );

  React.useEffect(() => {
    if (hideSponsorColumn) return;
    const sponsorColumn = table.getColumn("sponsor");
    if (sponsorColumn) {
      sponsorColumn.setFilterValue(sponsorFilter ?? "");
    }
  }, [sponsorFilter, table, hideSponsorColumn]);

  React.useEffect(() => {
    table.getColumn("sector")?.setFilterValue(sectorFilter ?? "");
  }, [sectorFilter, table]);

  if (isMobile) {
    const mobileData = table.getRowModel().rows.map((row) => row.original);
    return (
      <div className="flex flex-col gap-4 p-4">
        {mobileData.map((company) => (
          <MobileCompanyCard key={company.id} company={company} />
        ))}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  const content = (
    <div className="flex flex-col gap-4">
      {/* Header Section */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!hideSponsorColumn && (
              <Select
                value={sponsorFilter}
                onValueChange={(v) => setSponsorFilter(v)}
              >
                <SelectTrigger className="hidden w-44 md:inline-flex" size="sm">
                  <SelectValue placeholder="Filter: Sponsor" />
                </SelectTrigger>
                <SelectContent align="start">
                  {[...new Set(data.map((r) => r.sponsor.name))]
                    .sort()
                    .map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={sectorFilter}
              onValueChange={(v) => setSectorFilter(v)}
            >
              <SelectTrigger className="hidden w-40 md:inline-flex" size="sm">
                <SelectValue placeholder="Filter: Sector" />
              </SelectTrigger>
              <SelectContent align="start">
                {[
                  ...new Set(
                    data.map((r) => r.sector).filter(Boolean) as string[],
                  ),
                ]
                  .sort()
                  .map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide(),
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" onClick={() => exportCsv(table)}>
              Export
            </Button>
          </div>
        </div>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table className="w-full" style={{ tableLayout: "fixed" }}>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8 [&_td]:truncate [&_td]:whitespace-nowrap">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (
                        target.closest('input[type="checkbox"]') ||
                        target.closest("button") ||
                        target.closest('[role="button"]')
                      ) {
                        return;
                      }
                      handleRowClick(row.original.id);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No companies.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return content;
}

function exportCsv(table: ReturnType<typeof useReactTable<Company>>) {
  const rows = table.getRowModel().rows.map((r) => r.original);
  const headers = [
    "Company",
    "Sponsor",
    "Invested",
    "Sector",
    "Location",
    "Source",
    "Status",
  ];
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      [
        safeCsv(r.asset ?? ""),
        safeCsv(r.sponsor.name ?? ""),
        safeCsv(
          r.dateInvested
            ? formatDate(r.dateInvested, {
                year: "numeric",
                month: "numeric",
                day: "numeric",
              })
            : "",
        ),
        safeCsv(r.sector ?? ""),
        safeCsv(r.location ?? ""),
        safeCsv(r.webpage ?? ""),
        safeCsv((r.status || "ACTIVE") === "ACTIVE" ? "Active" : "Exited"),
      ].join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "companies.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function safeCsv(v: string | undefined) {
  if (!v) return "";
  if (v.includes(",") || v.includes("\n") || v.includes('"')) {
    return `"${v.replaceAll('"', '""')}"`;
  }
  return v;
}

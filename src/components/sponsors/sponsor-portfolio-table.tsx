"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";

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
import { Input } from "@/components/ui/input";
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
  IconExternalLink,
  IconLayoutColumns,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { CompanyDrawer } from "@/components/companies/company-drawer";
import type { PortfolioCompany, Comment, Watchlist } from "@prisma/client";
import type { RouterOutputs } from "@/trpc/react";

interface SponsorPortfolioTableProps {
  companies: (PortfolioCompany & {
    comments: Comment[];
    watchlistedBy: Watchlist[];
  })[];
  sponsorName: string;
}

type PortfolioCompanyRow = SponsorPortfolioTableProps["companies"][number];

const columns: ColumnDef<PortfolioCompanyRow>[] = [
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
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.asset}</span>
      </div>
    ),
    enableHiding: false,
    size: 300,
  },
  {
    accessorKey: "invested",
    header: () => <div className="text-right">Date Invested</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {row.original.dateInvested
          ? new Date(row.original.dateInvested).toLocaleDateString()
          : "-"}
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "sector",
    header: "Sector",
    cell: ({ row }) => (
      <div className="max-w-32 truncate">
        {row.original.sector ? (
          <Badge variant="outline">{row.original.sector}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    ),
    size: 150,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <div className="max-w-32 truncate">{row.original.location ?? "-"}</div>
    ),
    size: 120,
  },
  {
    accessorKey: "comments",
    header: () => <div className="text-center">Comments</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant="secondary" className="text-xs">
          {row.original.comments?.length ?? 0}
        </Badge>
      </div>
    ),
    size: 80,
  },
  {
    accessorKey: "watchers",
    header: () => <div className="text-center">Watchers</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant="secondary" className="text-xs">
          {row.original.watchlistedBy.length}
        </Badge>
      </div>
    ),
    size: 80,
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) =>
      row.original.webpage ? (
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
      ),
    size: 80,
  },
  {
    id: "actions",
    cell: ({ row: _ }) => (
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
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem>Add to Watchlist</DropdownMenuItem>
          <DropdownMenuItem>Add Comment</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Remove</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    size: 64,
  },
];

export function SponsorPortfolioTable({
  companies,
  sponsorName,
}: SponsorPortfolioTableProps) {
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
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  type Company = RouterOutputs["company"]["getAll"][0];
  const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(
    null,
  );

  // Handle row click to open drawer
  const handleRowClick = React.useCallback(
    (companyId: string) => {
      const company = companies.find((c) => c.id === companyId);
      if (company) {
        // We can now pass through directly because page query includes relations
        setSelectedCompany(company as unknown as Company);
        setDrawerOpen(true);
      }
    },
    [companies],
  );

  // Keep the original Prisma shape; format dates in cells instead
  const data: PortfolioCompanyRow[] = React.useMemo(
    () => companies,
    [companies],
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
    getRowId: (row) => row.id,
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
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header Section */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            Portfolio Companies
          </h3>
          <p className="text-muted-foreground text-sm">
            All companies in {sponsorName}&apos;s portfolio ({companies.length}{" "}
            total)
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <IconSearch className="text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search companies..."
                value={
                  (table.getColumn("company")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table.getColumn("company")?.setFilterValue(event.target.value)
                }
                className="w-64 pl-8"
              />
            </div>
            <Select
              value={
                (table.getColumn("sector")?.getFilterValue() as string) ?? "all"
              }
              onValueChange={(value) =>
                table
                  .getColumn("sector")
                  ?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {Array.from(
                  new Set(data.map((item) => item.sector).filter(Boolean)),
                ).map((sector) => (
                  <SelectItem key={sector} value={sector!}>
                    {sector}
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
            <Button variant="outline" size="sm">
              <IconPlus />
              <span className="hidden lg:inline">Add Company</span>
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
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
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={
                      "hover:bg-muted/50 cursor-pointer transition-colors"
                    }
                    onClick={(e) => {
                      // Don't trigger row click when clicking on checkboxes or action buttons
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
                    No companies found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <span className="text-sm font-medium">Rows per page</span>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20">
                  <SelectValue />
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

      {/* Company Drawer */}
      <CompanyDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        data={selectedCompany}
      />
    </div>
  );
}

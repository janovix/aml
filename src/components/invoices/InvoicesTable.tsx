"use client";

import { useMemo } from "react";
import { Eye, Receipt } from "lucide-react";
import Link from "next/link";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useServerTable } from "@/hooks/useServerTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listInvoices } from "@/lib/api/invoices";
import type { InvoiceEntity } from "@/types/invoice";
import {
	DataTable,
	type ColumnDef,
	type FilterDef,
} from "@/components/data-table";

const VOUCHER_TYPE_LABELS: Record<string, string> = {
	I: "Ingreso",
	E: "Egreso",
	T: "Traslado",
	N: "Nómina",
	P: "Pago",
};

const INVOICE_FILTER_IDS = ["voucherTypeCode", "currencyCode"];

interface InvoiceRow {
	id: string;
	uuid: string;
	uuidShort: string;
	issuerName: string;
	issuerRfc: string;
	receiverName: string;
	receiverRfc: string;
	total: number;
	currencyCode: string;
	issueDate: string;
	voucherTypeCode: string;
	hasOperation: boolean;
	invoice: InvoiceEntity;
}

export function InvoicesTable(): React.ReactElement {
	const { navigateTo, orgPath } = useOrgNavigation();

	const {
		data: invoices,
		isLoading,
		isLoadingMore,
		hasMore,
		pagination,
		filterMeta,
		handleLoadMore,
		urlFilterProps,
	} = useServerTable<InvoiceEntity>({
		fetcher: async ({ page, limit, filters, jwt }) => {
			return listInvoices({
				page,
				limit,
				jwt: jwt ?? undefined,
				filters,
			});
		},
		allowedFilterIds: INVOICE_FILTER_IDS,
		paginationMode: "infinite-scroll",
		itemsPerPage: 20,
	});

	const invoicesData: InvoiceRow[] = useMemo(
		() =>
			invoices.map((inv) => ({
				id: inv.id,
				uuid: inv.uuid ?? inv.id,
				uuidShort: inv.uuid
					? `${inv.uuid.slice(0, 8)}...`
					: `${inv.id.slice(0, 8)}...`,
				issuerName: inv.issuerName,
				issuerRfc: inv.issuerRfc,
				receiverName: inv.receiverName,
				receiverRfc: inv.receiverRfc,
				total: parseFloat(inv.total),
				currencyCode: inv.currencyCode,
				issueDate: inv.issueDate,
				voucherTypeCode: inv.voucherTypeCode,
				hasOperation: false,
				invoice: inv,
			})),
		[invoices],
	);

	const columns: ColumnDef<InvoiceRow>[] = useMemo(
		() => [
			{
				id: "uuid",
				header: "UUID",
				accessorKey: "uuidShort",
				cell: (item) => (
					<div className="flex flex-col min-w-0">
						<Link
							href={orgPath(`/invoices/${item.id}`)}
							className="font-medium text-foreground hover:text-primary truncate font-mono text-xs"
							onClick={(e) => e.stopPropagation()}
						>
							{item.uuidShort}
						</Link>
					</div>
				),
			},
			{
				id: "issuer",
				header: "Emisor",
				accessorKey: "issuerName",
				sortable: true,
				cell: (item) => (
					<div className="flex flex-col min-w-0">
						<span className="font-medium text-foreground truncate text-sm">
							{item.issuerName}
						</span>
						<span className="text-xs text-muted-foreground font-mono">
							{item.issuerRfc}
						</span>
					</div>
				),
			},
			{
				id: "receiver",
				header: "Receptor",
				accessorKey: "receiverName",
				sortable: true,
				hideOnMobile: true,
				cell: (item) => (
					<div className="flex flex-col min-w-0">
						<span className="font-medium text-foreground truncate text-sm">
							{item.receiverName}
						</span>
						<span className="text-xs text-muted-foreground font-mono">
							{item.receiverRfc}
						</span>
					</div>
				),
			},
			{
				id: "total",
				header: "Total",
				accessorKey: "total",
				sortable: true,
				className: "text-right",
				cell: (item) => (
					<div className="flex flex-col items-end">
						<span className="font-semibold tabular-nums text-foreground">
							{new Intl.NumberFormat("es-MX", {
								style: "currency",
								currency: item.currencyCode || "MXN",
								minimumFractionDigits: 0,
								maximumFractionDigits: 2,
							}).format(item.total)}
						</span>
						<span className="text-[10px] text-muted-foreground font-medium">
							{item.currencyCode}
						</span>
					</div>
				),
			},
			{
				id: "issueDate",
				header: "Fecha",
				accessorKey: "issueDate",
				sortable: true,
				cell: (item) => {
					const date = new Date(item.issueDate);
					return (
						<div className="flex flex-col">
							<span className="text-sm text-foreground tabular-nums">
								{date.toLocaleDateString("es-MX", {
									day: "2-digit",
									month: "short",
								})}
							</span>
							<span className="text-xs text-muted-foreground tabular-nums">
								{date.getFullYear()}
							</span>
						</div>
					);
				},
			},
			{
				id: "voucherType",
				header: "Tipo",
				accessorKey: "voucherTypeCode",
				hideOnMobile: true,
				cell: (item) => (
					<Badge variant="outline" className="text-xs">
						{VOUCHER_TYPE_LABELS[item.voucherTypeCode] ?? item.voucherTypeCode}
					</Badge>
				),
			},
			{
				id: "linked",
				header: "Vinculada",
				accessorKey: "hasOperation",
				hideOnMobile: true,
				cell: (item) =>
					item.hasOperation ? (
						<Badge variant="default" className="text-xs">
							Sí
						</Badge>
					) : (
						<span className="text-xs text-muted-foreground">—</span>
					),
			},
		],
		[orgPath],
	);

	const filterDefs: FilterDef[] = useMemo(
		() => [
			{
				id: "voucherTypeCode",
				label: "Tipo",
				icon: Receipt,
				options: Object.entries(VOUCHER_TYPE_LABELS).map(([value, label]) => ({
					value,
					label,
				})),
			},
		],
		[],
	);

	const renderActions = (item: InvoiceRow) => (
		<Button
			variant="ghost"
			size="sm"
			className="h-8 w-8 p-0"
			onClick={() => navigateTo(`/invoices/${item.id}`)}
		>
			<Eye className="h-4 w-4" />
		</Button>
	);

	return (
		<DataTable
			data={invoicesData}
			columns={columns}
			filters={filterDefs}
			serverFilterMeta={filterMeta}
			serverTotal={pagination?.total}
			searchKeys={[
				"issuerName",
				"issuerRfc",
				"receiverName",
				"receiverRfc",
				"uuidShort",
			]}
			searchPlaceholder="Buscar facturas..."
			emptyMessage="No se encontraron facturas"
			emptyIcon={Receipt}
			emptyActionLabel="Subir XML"
			emptyActionHref={orgPath("/invoices/upload")}
			loadingMessage="Cargando facturas..."
			isLoading={isLoading}
			selectable
			getId={(item) => item.id}
			actions={renderActions}
			paginationMode="infinite-scroll"
			onLoadMore={handleLoadMore}
			hasMore={hasMore}
			isLoadingMore={isLoadingMore}
			{...urlFilterProps}
		/>
	);
}

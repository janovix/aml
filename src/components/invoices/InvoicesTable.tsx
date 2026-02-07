"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Eye, FileText, Receipt } from "lucide-react";
import Link from "next/link";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useJwt } from "@/hooks/useJwt";
import { showFetchError } from "@/lib/toast-utils";
import { useOrgStore } from "@/lib/org-store";
import { listInvoices } from "@/lib/api/invoices";
import type { InvoiceEntity } from "@/types/invoice";
import { DataTable, type ColumnDef } from "@/components/data-table";

const VOUCHER_TYPE_LABELS: Record<string, string> = {
	I: "Ingreso",
	E: "Egreso",
	T: "Traslado",
	N: "Nómina",
	P: "Pago",
};

/**
 * Flattened row for the invoices data table
 */
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
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();

	const [invoices, setInvoices] = useState<InvoiceEntity[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const ITEMS_PER_PAGE = 20;

	const hasLoadedForOrgRef = useRef<string | null>(null);

	// Initial load
	useEffect(() => {
		if (isJwtLoading || !jwt || !currentOrg?.id) {
			if (!currentOrg?.id && !isJwtLoading) {
				setInvoices([]);
				setIsLoading(false);
				hasLoadedForOrgRef.current = null;
			}
			return;
		}

		if (hasLoadedForOrgRef.current === currentOrg.id) return;

		const fetchInvoices = async () => {
			try {
				setIsLoading(true);
				setCurrentPage(1);
				setInvoices([]);

				const response = await listInvoices({
					page: 1,
					limit: ITEMS_PER_PAGE,
					jwt,
				});
				setInvoices(response.data);
				setHasMore(response.pagination.page < response.pagination.totalPages);
				hasLoadedForOrgRef.current = currentOrg.id;
			} catch (error) {
				hasLoadedForOrgRef.current = currentOrg.id;
				console.error("Error fetching invoices:", error);
				showFetchError("invoices-table", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchInvoices();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [jwt, isJwtLoading, currentOrg?.id]);

	// Load more
	const handleLoadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore || isJwtLoading || !jwt || !currentOrg?.id)
			return;

		try {
			setIsLoadingMore(true);
			const nextPage = currentPage + 1;
			const response = await listInvoices({
				page: nextPage,
				limit: ITEMS_PER_PAGE,
				jwt,
			});

			setInvoices((prev) => [...prev, ...response.data]);
			setCurrentPage(nextPage);
			setHasMore(response.pagination.page < response.pagination.totalPages);
		} catch (error) {
			console.error("Error loading more invoices:", error);
			showFetchError("invoices-table-more", error);
		} finally {
			setIsLoadingMore(false);
		}
	}, [currentPage, hasMore, isLoadingMore, isJwtLoading, jwt, currentOrg?.id]);

	// Silent refresh
	const silentRefresh = useCallback(async () => {
		if (!jwt || isJwtLoading || !currentOrg?.id) return;

		try {
			const response = await listInvoices({
				page: 1,
				limit: ITEMS_PER_PAGE,
				jwt,
			});
			setInvoices(response.data);
			setCurrentPage(1);
			setHasMore(response.pagination.page < response.pagination.totalPages);
		} catch {
			// Silently ignore
		}
	}, [jwt, isJwtLoading, currentOrg?.id]);

	useAutoRefresh(silentRefresh, {
		enabled: !isLoading && !!jwt && !!currentOrg?.id && currentPage === 1,
		interval: 30000,
	});

	// Build rows
	const invoicesData: InvoiceRow[] = useMemo(() => {
		return invoices.map((inv) => ({
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
			hasOperation: false, // Will be enriched if operation link exists
			invoice: inv,
		}));
	}, [invoices]);

	// Columns
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

	// Row actions
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
			filters={[]}
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
		/>
	);
}

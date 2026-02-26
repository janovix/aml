"use client";

import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	Eye,
	Trash2,
	FileSpreadsheet,
	Users,
	MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useServerTable } from "@/hooks/useServerTable";
import { listImports, deleteImport, type Import } from "@/lib/api/imports";
import {
	DataTable,
	type ColumnDef,
	type FilterDef,
} from "@/components/data-table";

interface ImportsTableProps {
	refreshTrigger?: number;
}

const STATUS_CONFIG: Record<
	string,
	{
		label: string;
		variant: "default" | "secondary" | "destructive" | "outline";
	}
> = {
	PENDING: { label: "Pendiente", variant: "secondary" },
	VALIDATING: { label: "Validando", variant: "outline" },
	PROCESSING: { label: "Procesando", variant: "default" },
	COMPLETED: { label: "Completado", variant: "default" },
	FAILED: { label: "Fallido", variant: "destructive" },
};

const ENTITY_TYPE_CONFIG: Record<
	string,
	{ label: string; icon: typeof Users }
> = {
	CLIENT: { label: "Clientes", icon: Users },
	OPERATION: { label: "Operaciones", icon: FileSpreadsheet },
};

const IMPORT_FILTER_IDS = ["status", "entityType"];

export function ImportsTable({
	refreshTrigger: _refreshTrigger,
}: ImportsTableProps) {
	const { navigateTo } = useOrgNavigation();
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const {
		data: imports,
		isLoading,
		isLoadingMore,
		hasMore,
		pagination,
		filterMeta,
		handleLoadMore,
		refresh,
		urlFilterProps,
	} = useServerTable<Import>({
		fetcher: async ({ page, limit, filters, jwt }) => {
			const response = await listImports({
				page,
				limit,
				jwt: jwt ?? undefined,
				filters,
			});
			return response;
		},
		allowedFilterIds: IMPORT_FILTER_IDS,
		paginationMode: "infinite-scroll",
		itemsPerPage: 20,
		autoRefresh: true,
	});

	const handleDelete = async () => {
		if (!deleteId) return;
		setIsDeleting(true);
		try {
			await deleteImport({ id: deleteId });
			setDeleteId(null);
			refresh();
		} catch (error) {
			console.error("Failed to delete import:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	const columns: ColumnDef<Import>[] = useMemo(
		() => [
			{
				id: "file",
				header: "Archivo",
				accessorKey: "fileName",
				sortable: true,
				cell: (item) => (
					<div className="flex flex-col">
						<span className="font-medium truncate max-w-[200px]">
							{item.fileName}
						</span>
						<span className="text-xs text-muted-foreground font-mono">
							{item.id.slice(0, 8)}...
						</span>
					</div>
				),
			},
			{
				id: "entityType",
				header: "Tipo",
				accessorKey: "entityType",
				cell: (item) => {
					const config =
						ENTITY_TYPE_CONFIG[item.entityType] ?? ENTITY_TYPE_CONFIG.CLIENT;
					const EntityIcon = config.icon;
					return (
						<div className="flex items-center gap-2">
							<EntityIcon className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm">{config.label}</span>
						</div>
					);
				},
			},
			{
				id: "status",
				header: "Estado",
				accessorKey: "status",
				cell: (item) => {
					const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
					return <Badge variant={config.variant}>{config.label}</Badge>;
				},
			},
			{
				id: "progress",
				header: "Progreso",
				accessorKey: "processedRows",
				hideOnMobile: true,
				cell: (item) => {
					const progress =
						item.totalRows > 0
							? Math.round((item.processedRows / item.totalRows) * 100)
							: 0;
					return (
						<div className="flex flex-col gap-1 min-w-[120px]">
							<div className="flex items-center gap-2">
								<div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
									<div
										className={cn(
											"h-full transition-all duration-300",
											item.status === "FAILED"
												? "bg-destructive"
												: item.status === "COMPLETED"
													? "bg-green-500"
													: "bg-primary",
										)}
										style={{ width: `${progress}%` }}
									/>
								</div>
								<span className="text-xs text-muted-foreground tabular-nums">
									{progress}%
								</span>
							</div>
							<div className="flex gap-2 text-[10px] text-muted-foreground">
								<span className="text-green-600">{item.successCount} ✓</span>
								<span className="text-yellow-600">{item.warningCount} ⚠</span>
								<span className="text-red-600">{item.errorCount} ✗</span>
								{item.skippedCount > 0 && (
									<span className="text-amber-600">{item.skippedCount} ⏭</span>
								)}
							</div>
						</div>
					);
				},
			},
			{
				id: "createdAt",
				header: "Fecha",
				accessorKey: "createdAt",
				sortable: true,
				cell: (item) => {
					try {
						return (
							<span className="text-sm text-muted-foreground">
								{formatDistanceToNow(new Date(item.createdAt), {
									addSuffix: true,
									locale: es,
								})}
							</span>
						);
					} catch {
						return (
							<span className="text-sm text-muted-foreground">
								{item.createdAt}
							</span>
						);
					}
				},
			},
		],
		[],
	);

	const filterDefs: FilterDef[] = useMemo(
		() => [
			{
				id: "status",
				label: "Estado",
				icon: FileSpreadsheet,
				options: [
					{ value: "PENDING", label: "Pendiente" },
					{ value: "VALIDATING", label: "Validando" },
					{ value: "PROCESSING", label: "Procesando" },
					{ value: "COMPLETED", label: "Completado" },
					{ value: "FAILED", label: "Fallido" },
				],
			},
			{
				id: "entityType",
				label: "Tipo",
				icon: Users,
				options: [
					{ value: "CLIENT", label: "Clientes" },
					{ value: "OPERATION", label: "Operaciones" },
				],
			},
		],
		[],
	);

	const renderActions = (item: Import) => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-40">
				<DropdownMenuItem
					className="gap-2"
					onClick={() => navigateTo(`/import/${item.id}`)}
				>
					<Eye className="h-4 w-4" />
					Ver detalle
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-2 text-destructive"
					onClick={() => setDeleteId(item.id)}
					disabled={
						item.status === "PROCESSING" || item.status === "VALIDATING"
					}
				>
					<Trash2 className="h-4 w-4" />
					Eliminar
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	return (
		<>
			<DataTable
				data={imports}
				columns={columns}
				filters={filterDefs}
				serverFilterMeta={filterMeta}
				serverTotal={pagination?.total}
				searchKeys={["fileName", "id"]}
				searchPlaceholder="Buscar importaciones..."
				emptyMessage="No hay importaciones"
				emptyIcon={FileSpreadsheet}
				loadingMessage="Cargando importaciones..."
				isLoading={isLoading}
				getId={(item) => item.id}
				actions={renderActions}
				onRowClick={(item) => navigateTo(`/import/${item.id}`)}
				paginationMode="infinite-scroll"
				onLoadMore={handleLoadMore}
				hasMore={hasMore}
				isLoadingMore={isLoadingMore}
				{...urlFilterProps}
			/>

			<AlertDialog
				open={!!deleteId}
				onOpenChange={(open) => !open && setDeleteId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar importación?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. Se eliminará la importación y
							todos sus resultados asociados.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "Eliminando..." : "Eliminar"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

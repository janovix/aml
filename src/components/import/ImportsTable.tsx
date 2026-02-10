"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Eye,
	Trash2,
	FileSpreadsheet,
	Users,
	RefreshCw,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { useJwt } from "@/hooks/useJwt";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { listImports, deleteImport, type Import } from "@/lib/api/imports";
import { cn } from "@/lib/utils";
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

export function ImportsTable({ refreshTrigger }: ImportsTableProps) {
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { navigateTo } = useOrgNavigation();
	const [imports, setImports] = useState<Import[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const pageSize = 10;

	const fetchImports = useCallback(async () => {
		if (!jwt) return;

		setIsLoading(true);
		try {
			const result = await listImports({
				jwt,
				page,
				limit: pageSize,
			});
			setImports(result.data);
			setTotal(result.pagination.total);
			setTotalPages(result.pagination.totalPages);
		} catch (error) {
			console.error("Failed to fetch imports:", error);
		} finally {
			setIsLoading(false);
		}
	}, [jwt, page, pageSize]);

	useEffect(() => {
		if (!isJwtLoading && jwt) {
			fetchImports();
		}
	}, [fetchImports, isJwtLoading, jwt, refreshTrigger]);

	const handleView = (importId: string) => {
		navigateTo(`/import/${importId}`);
	};

	const handleDelete = async () => {
		if (!deleteId || !jwt) return;

		setIsDeleting(true);
		try {
			await deleteImport({ id: deleteId, jwt });
			setDeleteId(null);
			fetchImports();
		} catch (error) {
			console.error("Failed to delete import:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	const formatDate = (dateString: string) => {
		try {
			return formatDistanceToNow(new Date(dateString), {
				addSuffix: true,
				locale: es,
			});
		} catch {
			return dateString;
		}
	};

	if (isLoading || isJwtLoading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-8 w-24" />
				</div>
				<div className="border rounded-lg">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Archivo</TableHead>
								<TableHead>Tipo</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead>Progreso</TableHead>
								<TableHead>Fecha</TableHead>
								<TableHead className="w-[100px]">Acciones</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{[...Array(5)].map((_, i) => (
								<TableRow key={i}>
									<TableCell>
										<Skeleton className="h-5 w-32" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-20" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-28" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-8 w-16" />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		);
	}

	if (imports.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-semibold">No hay importaciones</h3>
				<p className="text-muted-foreground mt-1">
					Crea tu primera importación para comenzar
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					{total} importación{total !== 1 ? "es" : ""} encontrada
					{total !== 1 ? "s" : ""}
				</p>
				<Button variant="ghost" size="sm" onClick={fetchImports}>
					<RefreshCw className="h-4 w-4 mr-2" />
					Actualizar
				</Button>
			</div>

			<div className="border rounded-lg">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Archivo</TableHead>
							<TableHead>Tipo</TableHead>
							<TableHead>Estado</TableHead>
							<TableHead>Progreso</TableHead>
							<TableHead>Fecha</TableHead>
							<TableHead className="w-[100px]">Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{imports.map((imp) => {
							const statusConfig =
								STATUS_CONFIG[imp.status] || STATUS_CONFIG.PENDING;
							const entityConfig =
								ENTITY_TYPE_CONFIG[imp.entityType] || ENTITY_TYPE_CONFIG.CLIENT;
							const EntityIcon = entityConfig.icon;
							const progress =
								imp.totalRows > 0
									? Math.round((imp.processedRows / imp.totalRows) * 100)
									: 0;

							return (
								<TableRow
									key={imp.id}
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => handleView(imp.id)}
								>
									<TableCell>
										<div className="flex flex-col">
											<span className="font-medium truncate max-w-[200px]">
												{imp.fileName}
											</span>
											<span className="text-xs text-muted-foreground">
												{imp.id}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<EntityIcon className="h-4 w-4 text-muted-foreground" />
											<span>{entityConfig.label}</span>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant={statusConfig.variant}>
											{statusConfig.label}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex flex-col gap-1">
											<div className="flex items-center gap-2">
												<div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
													<div
														className={cn(
															"h-full transition-all duration-300",
															imp.status === "FAILED"
																? "bg-destructive"
																: imp.status === "COMPLETED"
																	? "bg-green-500"
																	: "bg-primary",
														)}
														style={{ width: `${progress}%` }}
													/>
												</div>
												<span className="text-xs text-muted-foreground">
													{progress}%
												</span>
											</div>
											<div className="flex gap-2 text-xs text-muted-foreground">
												<span className="text-green-600">
													{imp.successCount} ✓
												</span>
												<span className="text-yellow-600">
													{imp.warningCount} ⚠
												</span>
												<span className="text-red-600">{imp.errorCount} ✗</span>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<span className="text-sm text-muted-foreground">
											{formatDate(imp.createdAt)}
										</span>
									</TableCell>
									<TableCell>
										<div
											className="flex items-center gap-1"
											onClick={(e) => e.stopPropagation()}
										>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleView(imp.id)}
											>
												<Eye className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setDeleteId(imp.id)}
												disabled={
													imp.status === "PROCESSING" ||
													imp.status === "VALIDATING"
												}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						Página {page} de {totalPages}
					</p>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page === totalPages}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}

			{/* Delete confirmation dialog */}
			<AlertDialog
				open={!!deleteId}
				onOpenChange={(open) => !open && setDeleteId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar importación?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. Se eliminará la importación y
							todos sus resultados de fila asociados.
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
		</div>
	);
}

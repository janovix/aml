"use client";

import { useState, useMemo } from "react";
import {
	FileText,
	Calendar,
	FileCheck2,
	Send,
	CheckCircle2,
	Clock,
	MoreHorizontal,
	Download,
	Eye,
	Trash2,
	Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@algtools/ui";
import { useToast } from "@/hooks/use-toast";
import {
	DataTable,
	type ColumnDef,
	type FilterDef,
} from "@/components/data-table";
import { PageHero, type StatCard } from "@/components/page-hero";
import { formatProperNoun } from "@/lib/utils";

/**
 * Report type
 */
export type ReportType = "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";

/**
 * Report status
 */
export type ReportStatus = "DRAFT" | "GENERATED" | "SUBMITTED" | "ACKNOWLEDGED";

/**
 * Report entity
 * TODO: Replace with actual API type when reports API is implemented
 */
export interface Report {
	id: string;
	name: string;
	type: ReportType;
	status: ReportStatus;
	period: string;
	generatedAt?: string;
	submittedAt?: string;
	recordCount: number;
	createdBy: string;
	createdAt: string;
}

const typeConfig: Record<ReportType, { label: string; bgColor: string }> = {
	MONTHLY: { label: "Mensual", bgColor: "bg-sky-500/20 text-sky-400" },
	QUARTERLY: {
		label: "Trimestral",
		bgColor: "bg-violet-500/20 text-violet-400",
	},
	ANNUAL: { label: "Anual", bgColor: "bg-amber-500/20 text-amber-400" },
	CUSTOM: { label: "Personalizado", bgColor: "bg-zinc-500/20 text-zinc-400" },
};

const statusConfig: Record<
	ReportStatus,
	{ label: string; icon: React.ReactNode; color: string }
> = {
	DRAFT: {
		label: "Borrador",
		icon: <Clock className="h-4 w-4" />,
		color: "text-zinc-400",
	},
	GENERATED: {
		label: "Generado",
		icon: <FileCheck2 className="h-4 w-4" />,
		color: "text-sky-400",
	},
	SUBMITTED: {
		label: "Enviado",
		icon: <Send className="h-4 w-4" />,
		color: "text-amber-400",
	},
	ACKNOWLEDGED: {
		label: "Acusado",
		icon: <CheckCircle2 className="h-4 w-4" />,
		color: "text-emerald-400",
	},
};

/**
 * Mock reports data
 * TODO: Replace with API call when reports endpoint is available
 */
const mockReports: Report[] = [
	{
		id: "RPT-001",
		name: "Reporte Mensual Diciembre 2024",
		type: "MONTHLY",
		status: "DRAFT",
		period: "Diciembre 2024",
		generatedAt: undefined,
		submittedAt: undefined,
		recordCount: 10,
		createdBy: "Sistema",
		createdAt: "2024-12-01T00:00:00Z",
	},
	{
		id: "RPT-002",
		name: "Reporte Mensual Noviembre 2024",
		type: "MONTHLY",
		status: "SUBMITTED",
		period: "Noviembre 2024",
		generatedAt: "2024-12-10T09:00:00Z",
		submittedAt: "2024-12-15T14:30:00Z",
		recordCount: 8,
		createdBy: "Admin",
		createdAt: "2024-11-01T00:00:00Z",
	},
	{
		id: "RPT-003",
		name: "Reporte Trimestral Q4 2024",
		type: "QUARTERLY",
		status: "GENERATED",
		period: "Q4 2024",
		generatedAt: "2024-12-28T10:00:00Z",
		submittedAt: undefined,
		recordCount: 25,
		createdBy: "Sistema",
		createdAt: "2024-10-01T00:00:00Z",
	},
	{
		id: "RPT-004",
		name: "Reporte Anual 2024",
		type: "ANNUAL",
		status: "DRAFT",
		period: "2024",
		generatedAt: undefined,
		submittedAt: undefined,
		recordCount: 0,
		createdBy: "Sistema",
		createdAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "RPT-005",
		name: "Reporte Mensual Octubre 2024",
		type: "MONTHLY",
		status: "ACKNOWLEDGED",
		period: "Octubre 2024",
		generatedAt: "2024-11-08T11:00:00Z",
		submittedAt: "2024-11-12T16:00:00Z",
		recordCount: 12,
		createdBy: "Admin",
		createdAt: "2024-10-01T00:00:00Z",
	},
	{
		id: "RPT-006",
		name: "Auditoría Especial Q3",
		type: "CUSTOM",
		status: "SUBMITTED",
		period: "Jul-Sep 2024",
		generatedAt: "2024-10-15T09:00:00Z",
		submittedAt: "2024-10-20T10:30:00Z",
		recordCount: 18,
		createdBy: "Auditor",
		createdAt: "2024-07-01T00:00:00Z",
	},
];

export function ReportsTable(): React.ReactElement {
	const router = useRouter();
	const { toast } = useToast();
	// TODO: Replace with API call when reports endpoint is available
	const [reports] = useState<Report[]>(mockReports);
	const [isLoading] = useState(false);

	// Column definitions
	const columns: ColumnDef<Report>[] = useMemo(
		() => [
			{
				id: "report",
				header: "Reporte",
				accessorKey: "name",
				sortable: true,
				cell: (item) => {
					const typeCfg = typeConfig[item.type];
					const statusCfg = statusConfig[item.status];

					return (
						<div className="flex items-center gap-3">
							{/* Type badge */}
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<span
											className={`flex items-center justify-center h-8 w-8 rounded-lg ${typeCfg.bgColor}`}
										>
											<FileText className="h-4 w-4" />
										</span>
									</TooltipTrigger>
									<TooltipContent side="right">
										<p>{typeCfg.label}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<div className="flex flex-col min-w-0">
								<div className="flex items-center gap-2">
									<span className="font-medium text-foreground truncate">
										{formatProperNoun(item.name)}
									</span>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<span className={statusCfg.color}>
													{statusCfg.icon}
												</span>
											</TooltipTrigger>
											<TooltipContent>
												<p>{statusCfg.label}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
								<span className="text-xs text-muted-foreground">
									Por: {item.createdBy}
								</span>
							</div>
						</div>
					);
				},
			},
			{
				id: "period",
				header: "Período",
				accessorKey: "period",
				hideOnMobile: true,
				cell: (item) => (
					<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Calendar className="h-3.5 w-3.5 flex-shrink-0" />
						<span>{item.period}</span>
					</div>
				),
			},
			{
				id: "recordCount",
				header: "Registros",
				accessorKey: "recordCount",
				sortable: true,
				className: "text-center",
				cell: (item) => (
					<span className="font-medium tabular-nums text-foreground">
						{item.recordCount}
					</span>
				),
			},
			{
				id: "submittedAt",
				header: "Envío",
				accessorKey: "submittedAt",
				sortable: true,
				cell: (item) => {
					if (!item.submittedAt) {
						return <span className="text-muted-foreground text-sm">—</span>;
					}
					const date = new Date(item.submittedAt);
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
		],
		[],
	);

	// Filter definitions
	const filterDefs: FilterDef[] = useMemo(
		() => [
			{
				id: "type",
				label: "Tipo",
				icon: FileText,
				options: [
					{
						value: "MONTHLY",
						label: "Mensual",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-sky-500/20 text-sky-400">
								<FileText className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "QUARTERLY",
						label: "Trimestral",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-violet-500/20 text-violet-400">
								<FileText className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "ANNUAL",
						label: "Anual",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-amber-500/20 text-amber-400">
								<FileText className="h-3 w-3" />
							</span>
						),
					},
					{
						value: "CUSTOM",
						label: "Personalizado",
						icon: (
							<span className="flex items-center justify-center h-5 w-5 rounded bg-zinc-500/20 text-zinc-400">
								<FileText className="h-3 w-3" />
							</span>
						),
					},
				],
			},
			{
				id: "status",
				label: "Estado",
				icon: Clock,
				options: [
					{
						value: "DRAFT",
						label: "Borrador",
						icon: <Clock className="h-3.5 w-3.5 text-zinc-400" />,
					},
					{
						value: "GENERATED",
						label: "Generado",
						icon: <FileCheck2 className="h-3.5 w-3.5 text-sky-400" />,
					},
					{
						value: "SUBMITTED",
						label: "Enviado",
						icon: <Send className="h-3.5 w-3.5 text-amber-400" />,
					},
					{
						value: "ACKNOWLEDGED",
						label: "Acusado",
						icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
					},
				],
			},
		],
		[],
	);

	const handleDownload = (report: Report) => {
		// TODO: Implement actual download when API is available
		toast({
			title: "Descargando...",
			description: `Descargando ${report.name}`,
		});
	};

	const handleDelete = (report: Report) => {
		// TODO: Implement actual delete when API is available
		toast({
			title: "Reporte eliminado",
			description: `${report.name} ha sido eliminado.`,
		});
	};

	// Row actions
	const renderActions = (item: Report) => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuItem
					className="gap-2"
					onClick={() => router.push(`/reports/${item.id}`)}
				>
					<Eye className="h-4 w-4" />
					Ver detalle
				</DropdownMenuItem>
				{item.status === "DRAFT" && (
					<DropdownMenuItem className="gap-2">
						<FileCheck2 className="h-4 w-4" />
						Generar reporte
					</DropdownMenuItem>
				)}
				{item.status === "GENERATED" && (
					<DropdownMenuItem className="gap-2">
						<Send className="h-4 w-4" />
						Enviar a SAT
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="gap-2"
					onClick={() => handleDownload(item)}
				>
					<Download className="h-4 w-4" />
					Descargar XML
				</DropdownMenuItem>
				{item.status === "DRAFT" && (
					<DropdownMenuItem
						className="gap-2 text-destructive"
						onClick={() => handleDelete(item)}
					>
						<Trash2 className="h-4 w-4" />
						Eliminar
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);

	// Compute stats from reports data
	const stats: StatCard[] = useMemo(() => {
		const totalReports = reports.length;
		const draftReports = reports.filter((r) => r.status === "DRAFT").length;
		const submittedReports = reports.filter(
			(r) => r.status === "SUBMITTED" || r.status === "ACKNOWLEDGED",
		).length;
		const totalRecords = reports.reduce((sum, r) => sum + r.recordCount, 0);

		return [
			{
				label: "Total Reportes",
				value: totalReports,
				icon: FileText,
			},
			{
				label: "Borradores",
				value: draftReports,
				icon: Clock,
				variant: "primary",
			},
			{
				label: "Enviados",
				value: submittedReports,
				icon: Send,
			},
			{
				label: "Total Registros",
				value: totalRecords,
				icon: FileCheck2,
			},
		];
	}, [reports]);

	return (
		<div className="space-y-6">
			<PageHero
				title="Reportes"
				subtitle="Gestión y seguimiento de reportes AML"
				icon={FileText}
				stats={stats}
				ctaLabel="Nuevo Reporte"
				ctaIcon={Plus}
				onCtaClick={() => router.push("/reports/new")}
			/>
			<DataTable
				data={reports}
				columns={columns}
				filters={filterDefs}
				searchKeys={["id", "name", "period", "createdBy"]}
				searchPlaceholder="Buscar por nombre, período..."
				emptyMessage="No se encontraron reportes"
				loadingMessage="Cargando reportes..."
				isLoading={isLoading}
				selectable
				getId={(item) => item.id}
				actions={renderActions}
				paginationMode="infinite-scroll"
				hasMore={false}
			/>
		</div>
	);
}

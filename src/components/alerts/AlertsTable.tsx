"use client";

import { useState, useMemo } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Button,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Badge,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
} from "@algtools/ui";
import {
	MoreHorizontal,
	Eye,
	ChevronDown,
	ChevronRight,
	AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Alert } from "@/types/alert";
import { mockAlerts } from "@/data/mockAlerts";
import {
	groupAlertsByFiscalMonth,
	getFiscalMonthDisplayName,
} from "@/lib/fiscalMonth";

const statusLabels: Record<Alert["status"], string> = {
	pending: "Pendiente",
	in_review: "En Revisión",
	resolved: "Resuelto",
	dismissed: "Descartado",
};

const severityLabels: Record<Alert["severity"], string> = {
	low: "Baja",
	medium: "Media",
	high: "Alta",
	critical: "Crítica",
};

const sourceLabels: Record<Alert["source"], string> = {
	manual: "Manual",
	olap: "OLAP",
	system: "Sistema",
};

const severityColors: Record<Alert["severity"], string> = {
	low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
	medium:
		"bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
	high: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
	critical: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

const statusColors: Record<Alert["status"], string> = {
	pending:
		"bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
	in_review:
		"bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
	resolved:
		"bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
	dismissed:
		"bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
};

export function AlertsTable(): React.ReactElement {
	const router = useRouter();
	const { toast } = useToast();
	const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
		new Set([groupAlertsByFiscalMonth(mockAlerts)[0]?.fiscalMonth || ""]),
	);
	const [isLoading] = useState(false);

	const groupedAlerts = useMemo(() => {
		return groupAlertsByFiscalMonth(mockAlerts);
	}, []);

	const toggleMonth = (fiscalMonth: string): void => {
		const newExpanded = new Set(expandedMonths);
		if (newExpanded.has(fiscalMonth)) {
			newExpanded.delete(fiscalMonth);
		} else {
			newExpanded.add(fiscalMonth);
		}
		setExpandedMonths(newExpanded);
	};

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const handleViewDetails = (alert: Alert): void => {
		router.push(`/alertas/${alert.id}`);
	};

	return (
		<div className="space-y-4">
			{groupedAlerts.map((group) => {
				const isExpanded = expandedMonths.has(group.fiscalMonth);
				const pendingCount = group.alerts.filter(
					(a) => a.status === "pending",
				).length;
				const criticalCount = group.alerts.filter(
					(a) => a.severity === "critical",
				).length;

				return (
					<Card key={group.fiscalMonth}>
						<CardHeader className="pb-3">
							<Collapsible
								open={isExpanded}
								onOpenChange={() => toggleMonth(group.fiscalMonth)}
							>
								<CollapsibleTrigger asChild>
									<button className="flex w-full items-center justify-between text-left">
										<div className="flex items-center gap-3">
											{isExpanded ? (
												<ChevronDown className="h-5 w-5 text-muted-foreground" />
											) : (
												<ChevronRight className="h-5 w-5 text-muted-foreground" />
											)}
											<div>
												<CardTitle className="text-lg font-semibold">
													{getFiscalMonthDisplayName(group.fiscalMonth)}
												</CardTitle>
												<p className="text-sm text-muted-foreground mt-1">
													{group.alerts.length} aviso
													{group.alerts.length !== 1 ? "s" : ""}
													{pendingCount > 0 &&
														` · ${pendingCount} pendiente${pendingCount !== 1 ? "s" : ""}`}
													{criticalCount > 0 &&
														` · ${criticalCount} crítico${criticalCount !== 1 ? "s" : ""}`}
												</p>
											</div>
										</div>
									</button>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<CardContent className="p-0 pt-4">
										<div className="overflow-x-auto">
											<Table>
												<TableHeader>
													<TableRow className="hover:bg-transparent">
														<TableHead className="min-w-[200px]">
															Título
														</TableHead>
														<TableHead className="hidden md:table-cell">
															Estado
														</TableHead>
														<TableHead className="hidden lg:table-cell">
															Severidad
														</TableHead>
														<TableHead className="hidden sm:table-cell">
															Origen
														</TableHead>
														<TableHead className="hidden xl:table-cell">
															Cliente RFC
														</TableHead>
														<TableHead className="hidden lg:table-cell">
															Detectado
														</TableHead>
														<TableHead className="w-12 pr-6">
															<span className="sr-only">Acciones</span>
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{isLoading ? (
														<TableRow>
															<TableCell
																colSpan={7}
																className="text-center py-8 text-muted-foreground"
															>
																Cargando avisos...
															</TableCell>
														</TableRow>
													) : group.alerts.length === 0 ? (
														<TableRow>
															<TableCell
																colSpan={7}
																className="text-center py-8 text-muted-foreground"
															>
																No hay avisos en este período fiscal
															</TableCell>
														</TableRow>
													) : (
														group.alerts.map((alert) => (
															<TableRow
																key={alert.id}
																className="cursor-pointer transition-colors hover:bg-muted/50"
															>
																<TableCell>
																	<div className="flex items-start gap-2">
																		{alert.severity === "critical" && (
																			<AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
																		)}
																		<div>
																			<div className="font-medium text-foreground">
																				{alert.title}
																			</div>
																			<div className="text-sm text-muted-foreground mt-1 line-clamp-2">
																				{alert.description}
																			</div>
																		</div>
																	</div>
																</TableCell>
																<TableCell className="hidden md:table-cell">
																	<Badge
																		variant="outline"
																		className={cn(
																			"font-medium",
																			statusColors[alert.status],
																		)}
																	>
																		{statusLabels[alert.status]}
																	</Badge>
																</TableCell>
																<TableCell className="hidden lg:table-cell">
																	<Badge
																		variant="outline"
																		className={cn(
																			"font-medium",
																			severityColors[alert.severity],
																		)}
																	>
																		{severityLabels[alert.severity]}
																	</Badge>
																</TableCell>
																<TableCell className="hidden sm:table-cell">
																	<Badge
																		variant="outline"
																		className="font-medium"
																	>
																		{sourceLabels[alert.source]}
																	</Badge>
																</TableCell>
																<TableCell className="hidden xl:table-cell font-mono text-sm text-muted-foreground">
																	{alert.clientRfc || "—"}
																</TableCell>
																<TableCell className="hidden lg:table-cell text-muted-foreground">
																	{formatDate(alert.detectedAt)}
																</TableCell>
																<TableCell
																	className="pr-6"
																	onClick={(e) => e.stopPropagation()}
																>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-8 w-8"
																		onClick={() => handleViewDetails(alert)}
																		aria-label={`Ver detalles de ${alert.title}`}
																	>
																		<Eye className="h-4 w-4" />
																	</Button>
																</TableCell>
															</TableRow>
														))
													)}
												</TableBody>
											</Table>
										</div>
									</CardContent>
								</CollapsibleContent>
							</Collapsible>
						</CardHeader>
					</Card>
				);
			})}
		</div>
	);
}

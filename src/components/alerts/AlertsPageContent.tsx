"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertsKpiCards } from "@/components/alerts/AlertsKpiCards";
import { AlertsTable } from "@/components/alerts/AlertsTable";
import { AlertsFilters } from "@/components/alerts/AlertsFilters";
import { Button } from "@algtools/ui";
import { Plus } from "lucide-react";

export function AlertsPageContent(): React.ReactElement {
	const router = useRouter();
	const [activeFilters, setActiveFilters] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [severityFilter, setSeverityFilter] = useState("");
	const [sourceFilter, setSourceFilter] = useState("");

	const handleApplyFilters = (): void => {
		const filters: string[] = [];
		if (searchQuery) filters.push(`Búsqueda: "${searchQuery}"`);
		if (statusFilter && statusFilter !== "all")
			filters.push(`Estado: ${statusFilter}`);
		if (severityFilter && severityFilter !== "all")
			filters.push(`Severidad: ${severityFilter}`);
		if (sourceFilter && sourceFilter !== "all")
			filters.push(`Origen: ${sourceFilter}`);
		setActiveFilters(filters);
	};

	const handleClearFilters = (): void => {
		setSearchQuery("");
		setStatusFilter("all");
		setSeverityFilter("all");
		setSourceFilter("all");
		setActiveFilters([]);
	};

	const handleRemoveFilter = (filter: string): void => {
		setActiveFilters(activeFilters.filter((f) => f !== filter));
		// Reset corresponding filter
		if (filter.startsWith("Búsqueda:")) setSearchQuery("");
		if (filter.startsWith("Estado:")) setStatusFilter("all");
		if (filter.startsWith("Severidad:")) setSeverityFilter("all");
		if (filter.startsWith("Origen:")) setSourceFilter("all");
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Avisos</h1>
					<p className="text-muted-foreground">
						Gestión y monitoreo de alertas de cumplimiento AML
					</p>
				</div>
				<Button
					className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4 sm:gap-2 rounded-lg p-0 bg-primary hover:bg-primary/90"
					onClick={() => router.push("/alertas/new")}
					aria-label="Nuevo Aviso"
				>
					<Plus className="h-4 w-4 text-primary-foreground" />
					<span className="hidden sm:inline text-primary-foreground">
						Nuevo Aviso
					</span>
				</Button>
			</div>

			<AlertsKpiCards />

			<AlertsFilters
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				statusFilter={statusFilter}
				onStatusChange={setStatusFilter}
				severityFilter={severityFilter}
				onSeverityChange={setSeverityFilter}
				sourceFilter={sourceFilter}
				onSourceChange={setSourceFilter}
				activeFilters={activeFilters}
				onApplyFilters={handleApplyFilters}
				onClearFilters={handleClearFilters}
				onRemoveFilter={handleRemoveFilter}
			/>

			<AlertsTable />
		</div>
	);
}

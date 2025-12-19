"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KpiCards } from "@/components/clients/KpiCards";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientsFilters } from "@/components/clients/ClientsFilters";
import { Button } from "@algtools/ui";
import { Plus } from "lucide-react";

export function ClientsPageContent(): React.ReactElement {
	const router = useRouter();
	const [activeFilters, setActiveFilters] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [riskFilter, setRiskFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("");

	const handleApplyFilters = (): void => {
		const filters: string[] = [];
		if (searchQuery) filters.push(`Búsqueda: "${searchQuery}"`);
		if (riskFilter) filters.push(`Riesgo: ${riskFilter}`);
		if (statusFilter) filters.push(`Estado: ${statusFilter}`);
		setActiveFilters(filters);
	};

	const handleClearFilters = (): void => {
		setSearchQuery("");
		setRiskFilter("");
		setStatusFilter("");
		setActiveFilters([]);
	};

	const handleRemoveFilter = (filter: string): void => {
		setActiveFilters(activeFilters.filter((f) => f !== filter));
		// Reset corresponding filter
		if (filter.startsWith("Búsqueda:")) setSearchQuery("");
		if (filter.startsWith("Riesgo:")) setRiskFilter("");
		if (filter.startsWith("Estado:")) setStatusFilter("");
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
				<Button
					className="h-10 w-10 sm:h-auto sm:w-auto sm:px-4 sm:gap-2 rounded-lg p-0 bg-primary hover:bg-primary/90"
					onClick={() => router.push("/clients/new")}
					aria-label="Nuevo Cliente"
				>
					<Plus className="h-4 w-4 text-primary-foreground" />
					<span className="hidden sm:inline text-primary-foreground">
						Nuevo Cliente
					</span>
				</Button>
			</div>

			<KpiCards />

			<ClientsFilters
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				riskFilter={riskFilter}
				onRiskChange={setRiskFilter}
				statusFilter={statusFilter}
				onStatusChange={setStatusFilter}
				activeFilters={activeFilters}
				onApplyFilters={handleApplyFilters}
				onClearFilters={handleClearFilters}
				onRemoveFilter={handleRemoveFilter}
			/>

			<ClientsTable />
		</div>
	);
}

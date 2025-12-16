"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TransactionsKpiCards } from "@/components/transactions/TransactionsKpiCards";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { TransactionsFilters } from "@/components/transactions/TransactionsFilters";
import { Button } from "@/components/ui/button";
import { Menu, Plus, X } from "lucide-react";

export function TransactionsPageContent(): React.ReactElement {
	const router = useRouter();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [activeFilters, setActiveFilters] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [channelFilter, setChannelFilter] = useState("");

	const handleApplyFilters = (): void => {
		const filters: string[] = [];
		if (searchQuery) filters.push(`Búsqueda: "${searchQuery}"`);
		if (typeFilter && typeFilter !== "all") filters.push(`Tipo: ${typeFilter}`);
		if (statusFilter && statusFilter !== "all")
			filters.push(`Estado: ${statusFilter}`);
		if (channelFilter && channelFilter !== "all")
			filters.push(`Canal: ${channelFilter}`);
		setActiveFilters(filters);
	};

	const handleClearFilters = (): void => {
		setSearchQuery("");
		setTypeFilter("");
		setStatusFilter("");
		setChannelFilter("");
		setActiveFilters([]);
	};

	const handleRemoveFilter = (filter: string): void => {
		setActiveFilters(activeFilters.filter((f) => f !== filter));
		// Reset corresponding filter
		if (filter.startsWith("Búsqueda:")) setSearchQuery("");
		if (filter.startsWith("Tipo:")) setTypeFilter("");
		if (filter.startsWith("Estado:")) setStatusFilter("");
		if (filter.startsWith("Canal:")) setChannelFilter("");
	};

	return (
		<div className="flex h-screen w-full overflow-hidden bg-background">
			{mobileMenuOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => setMobileMenuOpen(false)}
					aria-hidden="true"
				/>
			)}

			<div
				className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
			>
				<div className="flex h-full flex-col bg-sidebar border-r">
					<div className="flex h-16 items-center justify-between border-b px-4">
						<div className="flex items-center gap-2">
							<span className="text-lg font-bold text-foreground">
								AML Platform
							</span>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setMobileMenuOpen(false)}
							aria-label="Cerrar menú"
						>
							<X className="h-5 w-5" />
						</Button>
					</div>
					<AppSidebar
						collapsed={false}
						onToggle={() => setMobileMenuOpen(false)}
						isMobile={true}
					/>
				</div>
			</div>

			<AppSidebar
				collapsed={sidebarCollapsed}
				onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
			/>

			<main className="flex flex-1 min-h-0 min-w-0 w-full flex-col">
				<header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-3 sm:px-6">
					<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
						<Button
							variant="ghost"
							size="icon"
							className="lg:hidden shrink-0"
							onClick={() => setMobileMenuOpen(true)}
							aria-label="Abrir menú"
						>
							<Menu className="h-5 w-5" />
						</Button>
						<div className="min-w-0">
							<h1 className="text-xl font-semibold text-foreground truncate">
								Transacciones
							</h1>
							<p className="text-sm text-muted-foreground hidden sm:block truncate">
								Monitoreo y análisis de transacciones
							</p>
						</div>
					</div>
					<Button
						className="gap-2 shrink-0 ml-2"
						onClick={() => router.push("/transactions/new")}
					>
						<Plus className="h-4 w-4" />
						<span className="hidden sm:inline">Nueva Transacción</span>
					</Button>
				</header>

				<div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
					<TransactionsKpiCards />

					<TransactionsFilters
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						typeFilter={typeFilter}
						onTypeChange={setTypeFilter}
						statusFilter={statusFilter}
						onStatusChange={setStatusFilter}
						channelFilter={channelFilter}
						onChannelChange={setChannelFilter}
						activeFilters={activeFilters}
						onApplyFilters={handleApplyFilters}
						onClearFilters={handleClearFilters}
						onRemoveFilter={handleRemoveFilter}
					/>

					<TransactionsTable
						searchQuery={searchQuery}
						typeFilter={typeFilter}
						statusFilter={statusFilter}
						channelFilter={channelFilter}
					/>
				</div>
			</main>
		</div>
	);
}

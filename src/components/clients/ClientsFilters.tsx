"use client";

import { useState } from "react";
import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Badge,
	cn,
} from "@algtools/ui";
import { Search, ChevronDown, SlidersHorizontal, X } from "lucide-react";

interface ClientsFiltersProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	riskFilter: string;
	onRiskChange: (value: string) => void;
	statusFilter: string;
	onStatusChange: (value: string) => void;
	activeFilters: string[];
	onApplyFilters: () => void;
	onClearFilters: () => void;
	onRemoveFilter: (filter: string) => void;
}

export function ClientsFilters({
	searchQuery,
	onSearchChange,
	riskFilter,
	onRiskChange,
	statusFilter,
	onStatusChange,
	activeFilters,
	onApplyFilters,
	onClearFilters,
	onRemoveFilter,
}: ClientsFiltersProps): React.ReactElement {
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

	const hasFilters = searchQuery || riskFilter || statusFilter;
	const hasActiveFilters = activeFilters.length > 0;

	return (
		<section
			aria-label="Filtros de búsqueda"
			className="space-y-3 sm:space-y-4"
		>
			{/* Search input */}
			<div className="space-y-2">
				<Label htmlFor="search-clients" className="sr-only">
					Buscar clientes
				</Label>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="search-clients"
						type="search"
						placeholder="Buscar por nombre o RFC..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pl-10"
					/>
				</div>
			</div>

			{/* Quick filters */}
			<div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2">
				<div className="w-full sm:w-[160px]">
					<Label htmlFor="risk-filter" className="sr-only">
						Nivel de Riesgo
					</Label>
					<Select value={riskFilter} onValueChange={onRiskChange}>
						<SelectTrigger id="risk-filter">
							<SelectValue placeholder="Nivel de Riesgo" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todos los niveles</SelectItem>
							<SelectItem value="Alto">Alto</SelectItem>
							<SelectItem value="Medio">Medio</SelectItem>
							<SelectItem value="Bajo">Bajo</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="w-full sm:w-[140px]">
					<Label htmlFor="status-filter" className="sr-only">
						Estado
					</Label>
					<Select value={statusFilter} onValueChange={onStatusChange}>
						<SelectTrigger id="status-filter">
							<SelectValue placeholder="Estado" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todos</SelectItem>
							<SelectItem value="Activo">Activo</SelectItem>
							<SelectItem value="En Revisión">En Revisión</SelectItem>
							<SelectItem value="Bloqueado">Bloqueado</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Action buttons */}
			<div className="flex items-center gap-2 sm:ml-0">
				<Button
					onClick={onApplyFilters}
					disabled={!hasFilters}
					size="default"
					className="w-full sm:w-auto"
				>
					Aplicar
				</Button>
				{hasFilters && (
					<Button
						variant="outline"
						onClick={onClearFilters}
						size="default"
						className="w-full sm:w-auto bg-transparent"
					>
						Limpiar
					</Button>
				)}
			</div>

			{/* Advanced filters toggle */}
			<Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
				<CollapsibleTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="gap-2 text-muted-foreground hover:text-foreground"
					>
						<SlidersHorizontal className="h-4 w-4" />
						Búsqueda avanzada
						<ChevronDown
							className={cn(
								"h-4 w-4 transition-transform duration-200",
								isAdvancedOpen && "rotate-180",
							)}
						/>
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent className="pt-3 sm:pt-4">
					<div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
						<div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<div className="space-y-2">
								<Label htmlFor="date-from">Fecha desde</Label>
								<Input id="date-from" type="date" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="date-to">Fecha hasta</Label>
								<Input id="date-to" type="date" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="sector">Sector</Label>
								<Select>
									<SelectTrigger id="sector">
										<SelectValue placeholder="Seleccionar sector" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="financial">Financiero</SelectItem>
										<SelectItem value="commercial">Comercial</SelectItem>
										<SelectItem value="industrial">Industrial</SelectItem>
										<SelectItem value="services">Servicios</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="alert-count">Avisos mínimos</Label>
								<Input id="alert-count" type="number" min="0" placeholder="0" />
							</div>
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>

			{/* Active filter chips */}
			{hasActiveFilters && (
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-sm text-muted-foreground">
						Filtros activos:
					</span>
					{activeFilters.map((filter) => (
						<Badge
							key={filter}
							variant="secondary"
							className="gap-1 pl-2.5 pr-1.5 py-1"
						>
							{filter}
							<button
								onClick={() => onRemoveFilter(filter)}
								className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
								aria-label={`Remover filtro: ${filter}`}
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
					<Button
						variant="ghost"
						size="sm"
						onClick={onClearFilters}
						className="h-7 text-xs text-muted-foreground hover:text-foreground"
					>
						Limpiar todos
					</Button>
				</div>
			)}
		</section>
	);
}

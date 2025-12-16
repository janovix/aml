"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, SlidersHorizontal, X } from "lucide-react";

interface TransactionsFiltersProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	typeFilter: string;
	onTypeChange: (value: string) => void;
	statusFilter: string;
	onStatusChange: (value: string) => void;
	channelFilter: string;
	onChannelChange: (value: string) => void;
	activeFilters: string[];
	onApplyFilters: () => void;
	onClearFilters: () => void;
	onRemoveFilter: (filter: string) => void;
}

export function TransactionsFilters({
	searchQuery,
	onSearchChange,
	typeFilter,
	onTypeChange,
	statusFilter,
	onStatusChange,
	channelFilter,
	onChannelChange,
	activeFilters,
	onApplyFilters,
	onClearFilters,
	onRemoveFilter,
}: TransactionsFiltersProps): React.ReactElement {
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

	const hasFilters = searchQuery || typeFilter || statusFilter || channelFilter;
	const hasActiveFilters = activeFilters.length > 0;

	return (
		<section
			aria-label="Filtros de búsqueda"
			className="space-y-3 sm:space-y-4"
		>
			{/* Main filter bar */}
			<div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row sm:items-end">
				{/* Search input */}
				<div className="flex-1 space-y-2">
					<Label htmlFor="search-transactions" className="sr-only">
						Buscar transacciones
					</Label>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							id="search-transactions"
							type="search"
							placeholder="Buscar por cliente, referencia o descripción..."
							value={searchQuery}
							onChange={(e) => onSearchChange(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>

				{/* Quick filters */}
				<div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2">
					<div className="w-full sm:w-[160px]">
						<Label htmlFor="type-filter" className="sr-only">
							Tipo de Transacción
						</Label>
						<Select value={typeFilter} onValueChange={onTypeChange}>
							<SelectTrigger id="type-filter">
								<SelectValue placeholder="Tipo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos los tipos</SelectItem>
								<SelectItem value="DEPOSITO">Depósito</SelectItem>
								<SelectItem value="RETIRO">Retiro</SelectItem>
								<SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
								<SelectItem value="PAGO">Pago</SelectItem>
								<SelectItem value="COBRANZA">Cobranza</SelectItem>
								<SelectItem value="OTRO">Otro</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="w-full sm:w-[160px]">
						<Label htmlFor="status-filter" className="sr-only">
							Estado
						</Label>
						<Select value={statusFilter} onValueChange={onStatusChange}>
							<SelectTrigger id="status-filter">
								<SelectValue placeholder="Estado" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								<SelectItem value="COMPLETADA">Completada</SelectItem>
								<SelectItem value="PENDIENTE">Pendiente</SelectItem>
								<SelectItem value="EN_REVISION">En Revisión</SelectItem>
								<SelectItem value="RECHAZADA">Rechazada</SelectItem>
								<SelectItem value="CANCELADA">Cancelada</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="w-full sm:w-[160px]">
						<Label htmlFor="channel-filter" className="sr-only">
							Canal
						</Label>
						<Select value={channelFilter} onValueChange={onChannelChange}>
							<SelectTrigger id="channel-filter">
								<SelectValue placeholder="Canal" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos los canales</SelectItem>
								<SelectItem value="BANCA_EN_LINEA">Banca en Línea</SelectItem>
								<SelectItem value="CAJERO_AUTOMATICO">
									Cajero Automático
								</SelectItem>
								<SelectItem value="SUCURSAL">Sucursal</SelectItem>
								<SelectItem value="MOVIL">Móvil</SelectItem>
								<SelectItem value="TRANSFERENCIA_ELECTRONICA">
									Transferencia Electrónica
								</SelectItem>
								<SelectItem value="OTRO">Otro</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Action buttons */}
					<div className="flex items-center gap-2 sm:ml-2">
						<Button
							onClick={onApplyFilters}
							disabled={!hasFilters}
							size="default"
							className="flex-1 sm:flex-none"
						>
							Aplicar
						</Button>
						{hasFilters && (
							<Button
								variant="outline"
								onClick={onClearFilters}
								size="default"
								className="flex-1 sm:flex-none bg-transparent"
							>
								Limpiar
							</Button>
						)}
					</div>
				</div>
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
							className={`h-4 w-4 transition-transform duration-200 ${
								isAdvancedOpen ? "rotate-180" : ""
							}`}
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
								<Label htmlFor="amount-min">Monto mínimo</Label>
								<Input
									id="amount-min"
									type="number"
									min="0"
									placeholder="0.00"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="amount-max">Monto máximo</Label>
								<Input
									id="amount-max"
									type="number"
									min="0"
									placeholder="0.00"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="risk-score">Puntuación de riesgo mínima</Label>
								<Input
									id="risk-score"
									type="number"
									min="0"
									max="100"
									placeholder="0"
								/>
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

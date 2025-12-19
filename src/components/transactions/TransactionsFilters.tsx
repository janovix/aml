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
	cn,
} from "@algtools/ui";
import { Search, ChevronDown, SlidersHorizontal } from "lucide-react";
import type { ListTransactionsOptions } from "@/lib/api/transactions";

interface TransactionsFiltersProps {
	filters: ListTransactionsOptions;
	onFiltersChange: (filters: ListTransactionsOptions) => void;
}

export function TransactionsFilters({
	filters,
	onFiltersChange,
}: TransactionsFiltersProps): React.ReactElement {
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
	const [localFilters, setLocalFilters] = useState({
		search: "",
		operationType: filters.operationType || "",
		vehicleType: filters.vehicleType || "",
		startDate: filters.startDate ? filters.startDate.split("T")[0] : "",
		endDate: filters.endDate ? filters.endDate.split("T")[0] : "",
	});

	const handleApplyFilters = (): void => {
		const newFilters: ListTransactionsOptions = {};
		if (localFilters.operationType) {
			newFilters.operationType = localFilters.operationType as
				| "purchase"
				| "sale";
		}
		if (localFilters.vehicleType) {
			newFilters.vehicleType = localFilters.vehicleType as
				| "land"
				| "marine"
				| "air";
		}
		if (localFilters.startDate) {
			newFilters.startDate = new Date(
				localFilters.startDate + "T00:00:00Z",
			).toISOString();
		}
		if (localFilters.endDate) {
			newFilters.endDate = new Date(
				localFilters.endDate + "T23:59:59Z",
			).toISOString();
		}
		onFiltersChange(newFilters);
	};

	const handleClearFilters = (): void => {
		setLocalFilters({
			search: "",
			operationType: "",
			vehicleType: "",
			startDate: "",
			endDate: "",
		});
		onFiltersChange({});
	};

	return (
		<Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
			<section
				aria-label="Filtros de búsqueda"
				className="space-y-3 sm:space-y-4"
			>
				{/* Search input */}
				<div className="space-y-2">
					<Label htmlFor="search-transactions" className="sr-only">
						Buscar transacciones
					</Label>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
						<Input
							id="search-transactions"
							type="search"
							placeholder="Buscar por cliente o folio..."
							className="pl-10"
							value={localFilters.search}
							onChange={(e) =>
								setLocalFilters({ ...localFilters, search: e.target.value })
							}
						/>
					</div>
				</div>

				{/* Advanced search toggle */}
				<CollapsibleTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="w-full sm:w-auto gap-2 text-muted-foreground hover:text-foreground"
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

				{/* Quick filters */}
				<div className="flex gap-2.5 sm:flex-row sm:items-center sm:gap-2">
					<div className="w-full sm:w-[160px]">
						<Label htmlFor="type-filter" className="sr-only">
							Tipo de Transacción
						</Label>
						<Select
							value={localFilters.operationType}
							onValueChange={(value) =>
								setLocalFilters({
									...localFilters,
									operationType: value === "all" ? "" : value,
								})
							}
						>
							<SelectTrigger id="type-filter">
								<SelectValue placeholder="Tipo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								<SelectItem value="purchase">Compra</SelectItem>
								<SelectItem value="sale">Venta</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="w-full sm:w-[140px]">
						<Label htmlFor="vehicle-type-filter" className="sr-only">
							Tipo de Vehículo
						</Label>
						<Select
							value={localFilters.vehicleType}
							onValueChange={(value) =>
								setLocalFilters({
									...localFilters,
									vehicleType: value === "all" ? "" : value,
								})
							}
						>
							<SelectTrigger id="vehicle-type-filter">
								<SelectValue placeholder="Vehículo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								<SelectItem value="land">Terrestre</SelectItem>
								<SelectItem value="marine">Marítimo</SelectItem>
								<SelectItem value="air">Aéreo</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Action buttons */}
				<Button
					size="default"
					className="w-full sm:w-auto"
					onClick={handleApplyFilters}
				>
					Aplicar
				</Button>

				{/* Advanced filters */}
				<CollapsibleContent className="pt-3 sm:pt-4">
					<div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
						<div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<div className="space-y-2">
								<Label htmlFor="date-from">Fecha desde</Label>
								<Input
									id="date-from"
									type="date"
									value={localFilters.startDate}
									onChange={(e) =>
										setLocalFilters({
											...localFilters,
											startDate: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="date-to">Fecha hasta</Label>
								<Input
									id="date-to"
									type="date"
									value={localFilters.endDate}
									onChange={(e) =>
										setLocalFilters({
											...localFilters,
											endDate: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="amount-min">Monto mínimo</Label>
								<Input id="amount-min" type="number" placeholder="$0" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="amount-max">Monto máximo</Label>
								<Input id="amount-max" type="number" placeholder="Sin límite" />
							</div>
						</div>
					</div>
				</CollapsibleContent>
			</section>
		</Collapsible>
	);
}

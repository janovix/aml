"use client";

import type { FilterDef } from "./types";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FilterDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	filters: FilterDef[];
	activeFilters: Record<string, string[]>;
	onToggleFilter: (filterId: string, value: string) => void;
	onClearAll: () => void;
}

export function FilterDrawer({
	isOpen,
	onClose,
	filters,
	activeFilters,
	onToggleFilter,
	onClearAll,
}: FilterDrawerProps) {
	const activeCount = Object.values(activeFilters).reduce(
		(acc, arr) => acc + arr.length,
		0,
	);

	return (
		<>
			{/* Backdrop */}
			<div
				className={cn(
					"fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300",
					isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
				)}
				onClick={onClose}
			/>

			{/* Drawer */}
			<div
				className={cn(
					"fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-xl transition-transform duration-300 ease-out",
					"max-h-[85vh] flex flex-col",
					isOpen ? "translate-y-0" : "translate-y-full",
				)}
			>
				{/* Handle */}
				<div className="flex justify-center pt-3 pb-2">
					<div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
				</div>

				{/* Header */}
				<div className="flex items-center justify-between px-4 pb-3 border-b border-border">
					<div>
						<h3 className="font-semibold text-foreground">Filtros</h3>
						{activeCount > 0 && (
							<p className="text-xs text-muted-foreground">
								{activeCount} filtro{activeCount !== 1 ? "s" : ""} activo
								{activeCount !== 1 ? "s" : ""}
							</p>
						)}
					</div>
					<div className="flex items-center gap-2">
						{activeCount > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={onClearAll}
								className="text-muted-foreground h-8"
							>
								Limpiar
							</Button>
						)}
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							className="h-8 w-8"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Filter Content */}
				<div className="flex-1 overflow-y-auto p-4 space-y-5">
					{filters.map((filter) => {
						const Icon = filter.icon;
						const selectedValues = activeFilters[filter.id] || [];

						return (
							<div key={filter.id} className="space-y-2.5">
								<label className="flex items-center gap-2 text-sm font-medium text-foreground">
									<Icon className="h-4 w-4 text-muted-foreground" />
									{filter.label}
								</label>
								<div className="grid grid-cols-2 gap-2">
									{filter.options.map((option) => {
										const isSelected = selectedValues.includes(option.value);
										return (
											<button
												key={option.value}
												onClick={() => onToggleFilter(filter.id, option.value)}
												className={cn(
													"flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all",
													"border text-left",
													isSelected
														? "bg-primary/10 border-primary text-foreground"
														: "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50",
												)}
											>
												<span className="flex-shrink-0">
													{option.icon || (
														<div className="w-4 h-4 rounded-full bg-muted" />
													)}
												</span>
												<span className="flex-1 truncate">{option.label}</span>
												{isSelected && (
													<Check className="h-4 w-4 text-primary flex-shrink-0" />
												)}
											</button>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>

				{/* Footer */}
				<div className="p-4 border-t border-border bg-card">
					<Button onClick={onClose} className="w-full">
						Aplicar Filtros
					</Button>
				</div>
			</div>
		</>
	);
}

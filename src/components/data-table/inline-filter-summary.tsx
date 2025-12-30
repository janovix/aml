"use client";

import type { ActiveFilter } from "./types";
import { X, Filter } from "lucide-react";

interface InlineFilterSummaryProps {
	activeFilters: ActiveFilter[];
	onRemoveFilter: (filterId: string, value: string) => void;
	onClearAll: () => void;
	onOpenFilters: () => void;
	compact?: boolean;
	filterButtonText?: string;
	clearAllText?: string;
	filterText?: string;
	filtersText?: string;
}

export function InlineFilterSummary({
	activeFilters,
	onRemoveFilter,
	onClearAll,
	onOpenFilters,
	compact = false,
	filterButtonText = "Filtrar",
	clearAllText = "Limpiar todo",
	filterText = "filtro",
	filtersText = "filtros",
}: InlineFilterSummaryProps) {
	const totalCount = activeFilters.reduce((acc, f) => acc + f.values.length, 0);

	if (totalCount === 0) {
		return (
			<button
				onClick={onOpenFilters}
				className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors border border-dashed border-border"
			>
				<Filter className="h-3.5 w-3.5" />
				<span>{filterButtonText}</span>
			</button>
		);
	}

	if (compact) {
		return (
			<button
				onClick={onOpenFilters}
				className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 transition-colors"
			>
				<Filter className="h-3.5 w-3.5" />
				<span>
					{totalCount} {totalCount !== 1 ? filtersText : filterText}
				</span>
			</button>
		);
	}

	return (
		<div className="flex items-center gap-1.5 flex-wrap">
			{activeFilters.map((filter) =>
				filter.values.map(({ value, label, icon }) => (
					<span
						key={`${filter.filterId}-${value}`}
						className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-md text-xs bg-secondary/80 text-foreground border border-border"
					>
						{icon && <span className="flex-shrink-0">{icon}</span>}
						<span className="max-w-[100px] truncate">{label}</span>
						<button
							onClick={() => onRemoveFilter(filter.filterId, value)}
							aria-label={`Eliminar filtro ${label}`}
							className="p-0.5 rounded hover:bg-muted transition-colors"
						>
							<X className="h-3 w-3 text-muted-foreground" />
						</button>
					</span>
				)),
			)}
			<button
				onClick={onClearAll}
				className="px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
			>
				{clearAllText}
			</button>
		</div>
	);
}

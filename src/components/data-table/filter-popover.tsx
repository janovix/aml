"use client";

import type { FilterDef } from "./types";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface FilterPopoverProps {
	filter: FilterDef;
	activeValues: string[];
	onToggleFilter: (value: string) => void;
	onClear: () => void;
}

export function FilterPopover({
	filter,
	activeValues,
	onToggleFilter,
	onClear,
}: FilterPopoverProps) {
	const Icon = filter.icon;
	const activeCount = activeValues.length;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					className={cn(
						"flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
						"border hover:bg-secondary/50",
						activeCount > 0
							? "bg-primary/5 border-primary/30 text-foreground"
							: "bg-transparent border-border text-muted-foreground hover:text-foreground",
					)}
				>
					<Icon className="h-3.5 w-3.5" />
					<span className="hidden sm:inline">{filter.label}</span>
					{activeCount > 0 && (
						<Badge
							variant="secondary"
							className="h-4 px-1 text-[10px] bg-primary text-primary-foreground ml-0.5"
						>
							{activeCount}
						</Badge>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-0" align="start">
				<div className="px-3 py-2.5 border-b border-border">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">{filter.label}</span>
						{activeCount > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={onClear}
								className="h-6 px-2 text-xs text-muted-foreground"
							>
								Limpiar
							</Button>
						)}
					</div>
				</div>
				<div className="p-2 max-h-64 overflow-y-auto">
					{filter.options.map((option) => {
						const isSelected = activeValues.includes(option.value);
						return (
							<button
								key={option.value}
								onClick={() => onToggleFilter(option.value)}
								className={cn(
									"w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
									"hover:bg-secondary/50",
									isSelected && "bg-primary/5",
								)}
							>
								<span
									className={cn(
										"flex items-center justify-center h-4 w-4 rounded border transition-colors",
										isSelected ? "bg-primary border-primary" : "border-border",
									)}
								>
									{isSelected && (
										<Check className="h-3 w-3 text-primary-foreground" />
									)}
								</span>
								{option.icon && (
									<span className="flex-shrink-0">{option.icon}</span>
								)}
								<span className="flex-1 text-left text-foreground">
									{option.label}
								</span>
							</button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}

"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompletenessResult } from "@/types/completeness";
import type { FieldRequirement, FieldTier } from "@/types/completeness";
import { TIER_COLORS } from "@/types/completeness";
import { Button } from "@/components/ui/button";

interface MissingFieldsListProps {
	result: CompletenessResult;
	/** Called when user clicks a field to navigate/scroll to it */
	onFieldClick?: (fieldPath: string) => void;
	className?: string;
	/** Initially expanded */
	defaultOpen?: boolean;
}

/**
 * Expandable list of missing fields grouped by tier.
 * Each item shows the field name, tier explanation, and an optional action.
 */
export function MissingFieldsList({
	result,
	onFieldClick,
	className,
	defaultOpen = false,
}: MissingFieldsListProps): React.ReactElement | null {
	const [isOpen, setIsOpen] = React.useState(defaultOpen);

	if (result.missing.length === 0) {
		return null;
	}

	const grouped = groupByTier(result.missing.map((m) => m.field));

	return (
		<div className={cn("rounded-lg border", className)}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
			>
				<span>Campos faltantes ({result.missing.length})</span>
				{isOpen ? (
					<ChevronDown className="h-4 w-4 text-muted-foreground" />
				) : (
					<ChevronRight className="h-4 w-4 text-muted-foreground" />
				)}
			</button>

			{isOpen && (
				<div className="border-t px-3 py-2 space-y-3">
					{(
						["sat_required", "alert_required", "kyc_optional"] as FieldTier[]
					).map((tier) => {
						const fields = grouped[tier];
						if (!fields || fields.length === 0) return null;

						const tierConfig = TIER_COLORS[tier];

						return (
							<div key={tier}>
								<div className="flex items-center gap-1.5 mb-1.5">
									<span
										className={cn("h-2 w-2 rounded-full", tierConfig.dot)}
									/>
									<span className={cn("text-xs font-medium", tierConfig.text)}>
										{tierConfig.label} ({fields.length})
									</span>
								</div>
								<ul className="space-y-0.5 ml-3.5">
									{fields.map((field) => (
										<li
											key={field.fieldPath}
											className="flex items-center justify-between text-xs"
										>
											<span className="text-muted-foreground">
												{field.label}
											</span>
											{onFieldClick && (
												<Button
													variant="link"
													size="sm"
													className="h-auto p-0 text-xs"
													onClick={() => onFieldClick(field.fieldPath)}
												>
													Llenar
												</Button>
											)}
										</li>
									))}
								</ul>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

function groupByTier(
	fields: FieldRequirement[],
): Partial<Record<FieldTier, FieldRequirement[]>> {
	const result: Partial<Record<FieldTier, FieldRequirement[]>> = {};
	for (const field of fields) {
		if (!result[field.tier]) {
			result[field.tier] = [];
		}
		result[field.tier]!.push(field);
	}
	return result;
}

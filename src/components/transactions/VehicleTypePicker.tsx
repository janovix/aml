"use client";

import * as React from "react";
import { Car, Ship, Plane, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";
import type { TransactionVehicleType } from "@/types/transaction";

export interface VehicleTypeConfig {
	type: TransactionVehicleType;
	labelKey: "txnVehicleTypeLand" | "txnVehicleTypeMarine" | "txnVehicleTypeAir";
}

export const vehicleTypeConfigs: VehicleTypeConfig[] = [
	{ type: "land", labelKey: "txnVehicleTypeLand" },
	{ type: "marine", labelKey: "txnVehicleTypeMarine" },
	{ type: "air", labelKey: "txnVehicleTypeAir" },
];

const vehicleOptions = {
	land: {
		icon: Car,
		colors: {
			border: "border-sky-200 dark:border-sky-800",
			borderSelected: "border-sky-400 dark:border-sky-500",
			background: "bg-white dark:bg-sky-950/30",
			backgroundSelected: "bg-sky-50 dark:bg-sky-900/50",
			icon: "text-sky-400 dark:text-sky-500",
			iconSelected: "text-sky-500 dark:text-sky-400",
			ring: "ring-sky-400/30 dark:ring-sky-500/30",
			focusRing:
				"focus-visible:ring-sky-400/30 dark:focus-visible:ring-sky-500/30",
			checkBg: "bg-sky-500",
		},
	},
	marine: {
		icon: Ship,
		colors: {
			border: "border-teal-200 dark:border-teal-800",
			borderSelected: "border-teal-400 dark:border-teal-500",
			background: "bg-white dark:bg-teal-950/30",
			backgroundSelected: "bg-teal-50 dark:bg-teal-900/50",
			icon: "text-teal-400 dark:text-teal-500",
			iconSelected: "text-teal-500 dark:text-teal-400",
			ring: "ring-teal-400/30 dark:ring-teal-500/30",
			focusRing:
				"focus-visible:ring-teal-400/30 dark:focus-visible:ring-teal-500/30",
			checkBg: "bg-teal-500",
		},
	},
	air: {
		icon: Plane,
		colors: {
			border: "border-amber-200 dark:border-amber-800",
			borderSelected: "border-amber-400 dark:border-amber-500",
			background: "bg-white dark:bg-amber-950/30",
			backgroundSelected: "bg-amber-50 dark:bg-amber-900/50",
			icon: "text-amber-400 dark:text-amber-500",
			iconSelected: "text-amber-500 dark:text-amber-400",
			ring: "ring-amber-400/30 dark:ring-amber-500/30",
			focusRing:
				"focus-visible:ring-amber-400/30 dark:focus-visible:ring-amber-500/30",
			checkBg: "bg-amber-500",
		},
	},
};

export interface VehicleTypePickerProps {
	value: TransactionVehicleType | "";
	onChange: (value: TransactionVehicleType) => void;
	disabled?: boolean;
	className?: string;
	id?: string;
}

export function VehicleTypePicker({
	value,
	onChange,
	disabled = false,
	className,
	id,
}: VehicleTypePickerProps): React.ReactElement {
	const { t } = useLanguage();
	const [hoveredType, setHoveredType] =
		React.useState<TransactionVehicleType | null>(null);

	return (
		<div
			id={id}
			role="radiogroup"
			aria-label={t("txnVehicleType")}
			className={cn(
				"grid grid-cols-3 gap-3",
				disabled && "opacity-50 pointer-events-none",
				className,
			)}
		>
			{vehicleTypeConfigs.map((config) => {
				const isSelected = value === config.type;
				const isHovered = hoveredType === config.type;
				const option = vehicleOptions[config.type];
				const { colors } = option;
				const Icon = option.icon;
				const label = t(config.labelKey);

				return (
					<button
						key={config.type}
						type="button"
						role="radio"
						aria-checked={isSelected}
						aria-label={label}
						disabled={disabled}
						onClick={() => onChange(config.type)}
						onMouseEnter={() => setHoveredType(config.type)}
						onMouseLeave={() => setHoveredType(null)}
						className={cn(
							// Base styles
							"relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer",
							"transition-all duration-300 ease-out",
							"focus:outline-none focus-visible:ring-4",
							"min-h-[100px]",

							// Default state
							!isSelected && [
								colors.border,
								colors.background,
								"hover:shadow-md",
								colors.focusRing,
							],

							// Selected state
							isSelected && [
								colors.borderSelected,
								colors.backgroundSelected,
								"shadow-md",
								colors.ring,
								"ring-4",
							],

							// Disabled state
							disabled && "cursor-not-allowed",
						)}
					>
						{/* Selection indicator - checkmark */}
						<div
							className={cn(
								"absolute top-2 right-2 flex items-center justify-center",
								"w-5 h-5 rounded-full transition-all duration-300",
								isSelected ? [colors.checkBg, "scale-100"] : "scale-0",
							)}
						>
							<Check
								className={cn(
									"h-3 w-3 text-white transition-all duration-200",
									isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50",
								)}
								strokeWidth={3}
							/>
						</div>

						{/* Icon with hover animation */}
						<div
							className={cn(
								"transition-transform duration-300 ease-out",
								isSelected || isHovered ? "scale-110" : "scale-100",
							)}
						>
							<Icon
								className={cn(
									"h-8 w-8 transition-colors duration-300",
									isSelected ? colors.iconSelected : colors.icon,
								)}
								strokeWidth={1.5}
							/>
						</div>

						{/* Label */}
						<span
							className={cn(
								"text-sm font-medium transition-colors duration-300",
								isSelected ? colors.iconSelected : "text-muted-foreground",
								isHovered && !isSelected && colors.icon,
							)}
						>
							{label}
						</span>
					</button>
				);
			})}
		</div>
	);
}

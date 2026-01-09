"use client";

import * as React from "react";
import { User, Building2, Landmark, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";
import type { PersonType } from "@/types/client";
import type { TranslationKeys } from "@/lib/translations";

export interface PersonTypeConfig {
	type: PersonType;
	labelKey: TranslationKeys;
	descriptionKey: TranslationKeys;
}

export const personTypeConfigs: PersonTypeConfig[] = [
	{
		type: "physical",
		labelKey: "clientPersonPhysical",
		descriptionKey: "clientPersonPhysicalDesc",
	},
	{
		type: "moral",
		labelKey: "clientPersonMoral",
		descriptionKey: "clientPersonMoralDesc",
	},
	{
		type: "trust",
		labelKey: "clientTrust",
		descriptionKey: "clientTrustDesc",
	},
];

const personTypeOptions = {
	physical: {
		icon: User,
		colors: {
			border: "border-sky-200 dark:border-sky-800",
			borderSelected: "border-sky-400 dark:border-sky-500",
			background: "bg-white dark:bg-sky-950/30",
			backgroundSelected: "bg-sky-50 dark:bg-sky-900/50",
			iconBg: "bg-sky-100 dark:bg-sky-900/60",
			iconBgSelected: "bg-sky-200 dark:bg-sky-800/80",
			icon: "text-sky-500 dark:text-sky-400",
			iconSelected: "text-sky-600 dark:text-sky-300",
			ring: "ring-sky-400/30 dark:ring-sky-500/30",
			checkBg: "bg-sky-500",
		},
	},
	moral: {
		icon: Building2,
		colors: {
			border: "border-violet-200 dark:border-violet-800",
			borderSelected: "border-violet-400 dark:border-violet-500",
			background: "bg-white dark:bg-violet-950/30",
			backgroundSelected: "bg-violet-50 dark:bg-violet-900/50",
			iconBg: "bg-violet-100 dark:bg-violet-900/60",
			iconBgSelected: "bg-violet-200 dark:bg-violet-800/80",
			icon: "text-violet-500 dark:text-violet-400",
			iconSelected: "text-violet-600 dark:text-violet-300",
			ring: "ring-violet-400/30 dark:ring-violet-500/30",
			checkBg: "bg-violet-500",
		},
	},
	trust: {
		icon: Landmark,
		colors: {
			border: "border-amber-200 dark:border-amber-800",
			borderSelected: "border-amber-400 dark:border-amber-500",
			background: "bg-white dark:bg-amber-950/30",
			backgroundSelected: "bg-amber-50 dark:bg-amber-900/50",
			iconBg: "bg-amber-100 dark:bg-amber-900/60",
			iconBgSelected: "bg-amber-200 dark:bg-amber-800/80",
			icon: "text-amber-500 dark:text-amber-400",
			iconSelected: "text-amber-600 dark:text-amber-300",
			ring: "ring-amber-400/30 dark:ring-amber-500/30",
			checkBg: "bg-amber-500",
		},
	},
};

export interface PersonTypePickerProps {
	value: PersonType;
	onChange: (value: PersonType) => void;
	disabled?: boolean;
	className?: string;
	id?: string;
}

export function PersonTypePicker({
	value,
	onChange,
	disabled = false,
	className,
	id,
}: PersonTypePickerProps): React.ReactElement {
	const { t } = useLanguage();
	const [hoveredType, setHoveredType] = React.useState<PersonType | null>(null);

	return (
		<div
			id={id}
			role="radiogroup"
			aria-label={t("clientPersonType")}
			className={cn(
				"grid grid-cols-1 sm:grid-cols-3 gap-3",
				disabled && "opacity-50 pointer-events-none",
				className,
			)}
		>
			{personTypeConfigs.map((config) => {
				const isSelected = value === config.type;
				const isHovered = hoveredType === config.type;
				const option = personTypeOptions[config.type];
				const { colors } = option;
				const Icon = option.icon;
				const label = t(config.labelKey);
				const description = t(config.descriptionKey);

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
							"relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer text-left",
							"transition-all duration-300 ease-out",
							"focus:outline-none focus-visible:ring-4",
							"min-h-[88px]",

							// Default state
							!isSelected && [
								colors.border,
								colors.background,
								"hover:shadow-md",
								`focus-visible:${colors.ring}`,
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

						{/* Icon with background and hover animation */}
						<div
							className={cn(
								"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
								isSelected ? colors.iconBgSelected : colors.iconBg,
							)}
						>
							<div
								className={cn(
									"transition-transform duration-300 ease-out",
									isSelected || isHovered ? "scale-110" : "scale-100",
								)}
							>
								<Icon
									className={cn(
										"h-5 w-5 transition-colors duration-300",
										isSelected ? colors.iconSelected : colors.icon,
									)}
									strokeWidth={1.75}
								/>
							</div>
						</div>

						{/* Label and description */}
						<div className="flex-1 min-w-0 pr-6">
							<span
								className={cn(
									"block text-sm font-semibold transition-colors duration-300",
									isSelected ? colors.iconSelected : "text-foreground",
									isHovered && !isSelected && colors.icon,
								)}
							>
								{label}
							</span>
							<span className="block text-xs text-muted-foreground mt-0.5 leading-tight">
								{description}
							</span>
						</div>
					</button>
				);
			})}
		</div>
	);
}

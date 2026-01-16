"use client";

import { Languages } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";

const languages = [
	{ key: "en", label: "EN" },
	{ key: "es", label: "ES" },
] as const;

type LanguageKey = "en" | "es";

export type LanguageSwitcherProps = {
	className?: string;
	/** Size of the switcher */
	size?: "sm" | "md" | "lg";
	/** Shape of the button */
	shape?: "rounded" | "squared" | "pill";
	/** Mini variant shows only an icon */
	variant?: "default" | "mini";
	/** Show language icon in default variant */
	showIcon?: boolean;
	/** Dropdown alignment */
	align?: "start" | "center" | "end";
	/** Dropdown side */
	side?: "top" | "bottom" | "left" | "right";
};

const sizeClasses = {
	sm: {
		container: "h-7 p-0.5 text-xs",
		button: "h-6 px-2",
		buttonMini: "h-7 w-7",
		icon: "size-3",
		iconMini: "size-3.5",
	},
	md: {
		container: "h-8 p-0.5 text-xs",
		button: "h-7 px-2.5",
		buttonMini: "h-8 w-8",
		icon: "size-3.5",
		iconMini: "size-4",
	},
	lg: {
		container: "h-9 p-0.5 text-sm",
		button: "h-8 px-3",
		buttonMini: "h-9 w-9",
		icon: "size-4",
		iconMini: "size-4.5",
	},
};

const shapeClasses = {
	rounded: "rounded-md",
	squared: "rounded-sm",
	pill: "rounded-full",
};

export function LanguageSwitcher({
	className,
	size = "sm",
	shape = "rounded",
	variant = "default",
	showIcon = true,
	align = "center",
	side = "top",
}: LanguageSwitcherProps) {
	const { language, setLanguage, t } = useLanguage();
	const sizes = sizeClasses[size];
	const shapeClass = shapeClasses[shape];

	const currentLanguage = language as LanguageKey;

	// Mini variant - dropdown with language icon
	if (variant === "mini") {
		return (
			<DropdownMenu modal={false}>
				<Tooltip>
					<TooltipTrigger asChild>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className={cn(sizes.buttonMini, shapeClass, className)}
							>
								<Languages className={sizes.iconMini} />
							</Button>
						</DropdownMenuTrigger>
					</TooltipTrigger>
					<TooltipContent side="right" sideOffset={8}>
						{t("languageLabel")}
					</TooltipContent>
				</Tooltip>
				<DropdownMenuContent
					side={side}
					align={align}
					sideOffset={8}
					className="min-w-0 w-auto"
				>
					{languages.map(({ key, label }) => (
						<DropdownMenuItem
							key={key}
							onClick={() => setLanguage(key)}
							className={cn(
								"justify-center text-xs font-semibold cursor-pointer px-3",
								currentLanguage === key && "bg-accent",
							)}
						>
							{label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	// Default variant - segmented control
	return (
		<div
			className={cn(
				"relative isolate flex items-center bg-background ring-1 ring-border",
				sizes.container,
				shapeClass,
				className,
			)}
		>
			{showIcon && (
				<Languages
					className={cn(sizes.icon, "ml-1.5 mr-1.5 text-muted-foreground")}
				/>
			)}
			{languages.map(({ key, label }) => {
				const isActive = currentLanguage === key;

				return (
					<button
						aria-label={label}
						className={cn("relative font-semibold", sizes.button, shapeClass)}
						key={key}
						onClick={() => setLanguage(key)}
						type="button"
					>
						<AnimatePresence>
							{isActive && (
								<motion.div
									className={cn("absolute inset-0 bg-secondary", shapeClass)}
									layoutId="activeLanguage"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ type: "spring", duration: 0.5 }}
								/>
							)}
						</AnimatePresence>
						<span
							className={cn(
								"relative z-10",
								isActive ? "text-foreground" : "text-muted-foreground",
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

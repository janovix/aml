"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useCallback } from "react";
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

const themes = [
	{
		key: "system",
		icon: Monitor,
		labelKey: "themeSystem",
	},
	{
		key: "light",
		icon: Sun,
		labelKey: "themeLight",
	},
	{
		key: "dark",
		icon: Moon,
		labelKey: "themeDark",
	},
] as const;

type ThemeKey = "system" | "light" | "dark";

export type ThemeSwitcherProps = {
	className?: string;
	/** Size of the switcher */
	size?: "sm" | "md" | "lg";
	/** Shape of the button */
	shape?: "rounded" | "pill";
	/** Mini variant shows only current theme icon as dropdown */
	variant?: "default" | "mini";
	/** Dropdown alignment (for mini variant) */
	align?: "start" | "center" | "end";
	/** Dropdown side (for mini variant) */
	side?: "top" | "bottom" | "left" | "right";
};

const sizeClasses = {
	sm: {
		container: "h-7 p-0.5",
		button: "h-6 w-6",
		buttonMini: "h-7 w-7",
		icon: "h-3.5 w-3.5",
		iconMini: "h-3.5 w-3.5",
	},
	md: {
		container: "h-8 p-1",
		button: "h-6 w-6",
		buttonMini: "h-8 w-8",
		icon: "h-4 w-4",
		iconMini: "h-4 w-4",
	},
	lg: {
		container: "h-9 p-1",
		button: "h-7 w-7",
		buttonMini: "h-9 w-9",
		icon: "h-4 w-4",
		iconMini: "h-4.5 w-4.5",
	},
};

const shapeClasses = {
	rounded: "rounded-md",
	pill: "rounded-full",
};

export function ThemeSwitcher({
	className,
	size = "sm",
	shape = "rounded",
	variant = "default",
	align = "center",
	side = "top",
}: ThemeSwitcherProps) {
	const { theme, setTheme } = useTheme();
	const { t } = useLanguage();
	const [mounted, setMounted] = useState(false);
	const sizes = sizeClasses[size];
	const shapeClass = shapeClasses[shape];

	const handleThemeClick = useCallback(
		(themeKey: ThemeKey) => {
			setTheme(themeKey);
		},
		[setTheme],
	);

	// Prevent hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div
				className={cn(
					variant === "mini" ? sizes.buttonMini : sizes.container,
					shapeClass,
					variant === "default" && "bg-background ring-1 ring-border",
					className,
				)}
			/>
		);
	}

	const currentTheme = theme as ThemeKey;
	const CurrentIcon =
		themes.find((t) => t.key === currentTheme)?.icon || Monitor;

	// Mini variant - dropdown with current theme icon
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
								<CurrentIcon className={sizes.iconMini} />
							</Button>
						</DropdownMenuTrigger>
					</TooltipTrigger>
					<TooltipContent side="right" sideOffset={8}>
						{t("themeLabel")}
					</TooltipContent>
				</Tooltip>
				<DropdownMenuContent side={side} align={align} sideOffset={8}>
					{themes.map(({ key, icon: Icon, labelKey }) => (
						<DropdownMenuItem
							key={key}
							onClick={() => handleThemeClick(key)}
							className={cn(
								"gap-2 cursor-pointer",
								currentTheme === key && "bg-accent",
							)}
						>
							<Icon className="h-4 w-4" />
							<span>{t(labelKey)}</span>
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
				"relative isolate flex bg-background ring-1 ring-border",
				sizes.container,
				shapeClass,
				className,
			)}
		>
			{themes.map(({ key, icon: Icon, labelKey }) => {
				const isActive = currentTheme === key;

				return (
					<button
						aria-label={t(labelKey)}
						className={cn("relative", sizes.button, shapeClass)}
						key={key}
						onClick={() => handleThemeClick(key)}
						type="button"
					>
						<AnimatePresence>
							{isActive && (
								<motion.div
									className={cn("absolute inset-0 bg-secondary", shapeClass)}
									layoutId="activeTheme"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ type: "spring", duration: 0.5 }}
								/>
							)}
						</AnimatePresence>
						<Icon
							className={cn(
								"relative z-10 m-auto",
								sizes.icon,
								isActive ? "text-foreground" : "text-muted-foreground",
							)}
						/>
					</button>
				);
			})}
		</div>
	);
}

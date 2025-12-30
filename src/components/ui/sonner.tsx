"use client";

import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			icons={{
				success: <CircleCheckIcon className="size-4" />,
				info: <InfoIcon className="size-4" />,
				warning: <TriangleAlertIcon className="size-4" />,
				error: <OctagonXIcon className="size-4" />,
				loading: <Loader2Icon className="size-4 animate-spin" />,
			}}
			toastOptions={{
				classNames: {
					toast:
						"group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
					description: "group-[.toast]:text-muted-foreground",
					actionButton:
						"group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
					cancelButton:
						"group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
					success:
						"group-[.toaster]:bg-emerald-50 dark:group-[.toaster]:bg-emerald-950/20 group-[.toaster]:border-emerald-200 dark:group-[.toaster]:border-emerald-800 group-[.toaster]:text-emerald-900 dark:group-[.toaster]:text-emerald-100",
					error:
						"group-[.toaster]:bg-red-50 dark:group-[.toaster]:bg-red-950/20 group-[.toaster]:border-red-200 dark:group-[.toaster]:border-red-800 group-[.toaster]:text-red-900 dark:group-[.toaster]:text-red-100",
					warning:
						"group-[.toaster]:bg-amber-50 dark:group-[.toaster]:bg-amber-950/20 group-[.toaster]:border-amber-200 dark:group-[.toaster]:border-amber-800 group-[.toaster]:text-amber-900 dark:group-[.toaster]:text-amber-100",
					info: "group-[.toaster]:bg-blue-50 dark:group-[.toaster]:bg-blue-950/20 group-[.toaster]:border-blue-200 dark:group-[.toaster]:border-blue-800 group-[.toaster]:text-blue-900 dark:group-[.toaster]:text-blue-100",
				},
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };

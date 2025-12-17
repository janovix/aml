// Local compatibility layer for `@algtools/ui`.
//
// The upstream aml-app-dev reference app imports primitives from `@algtools/ui`.
// This repo uses local shadcn/ui components under `src/components/ui/*`.
// We provide the same import surface so reference components/pages can be used
// without requiring the private package.

import type React from "react";

import { cn } from "@/lib/utils";

export { cn };

export { Button, buttonVariants } from "@/components/ui/button";
export { Badge, badgeVariants } from "@/components/ui/badge";
export { Checkbox } from "@/components/ui/checkbox";
export {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
export {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export { Input } from "@/components/ui/input";
export { Label } from "@/components/ui/label";
export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
export { Separator } from "@/components/ui/separator";
export { Textarea } from "@/components/ui/textarea";
export {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
export { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
export {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
} from "@/components/ui/combobox";
export {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
export {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export function Spinner({
	size = "md",
	className,
	...props
}: React.ComponentProps<"div"> & { size?: "sm" | "md" | "lg" }) {
	const sizeClass =
		size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

	return (
		<div
			data-slot="spinner"
			className={cn(
				"inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
				sizeClass,
				className,
			)}
			aria-label="Loading"
			role="status"
			{...props}
		/>
	);
}

// App-level convenience exports present in the reference app.
export { ThemeSwitcher } from "@/components/ThemeSwitcher";

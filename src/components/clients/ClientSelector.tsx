"use client";

import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { Client } from "@/types/client";
import { useClientSearch } from "@/hooks/useClientSearch";
import { getClientDisplayName } from "@/types/client";
import { useIsMobile } from "@/hooks/use-mobile";

type OptionRenderer = (option: Client, isSelected: boolean) => React.ReactNode;

interface ClientSelectorProps {
	label?: string;
	value?: string;
	placeholder?: string;
	searchPlaceholder?: string;
	helperText?: string;
	emptyState?: string;
	disabled?: boolean;
	required?: boolean;
	pageSize?: number;
	debounceMs?: number;
	autoFocusSearch?: boolean;
	onChange?: (client: Client | null) => void;
	onValueChange?: (value: string | null) => void;
	getOptionValue?: (client: Client) => string;
	renderOption?: OptionRenderer;
	className?: string;
	/** Callback when "Create New Client" button is clicked */
	onCreateNew?: () => void;
}

function Spinner({
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

const defaultRenderOption: OptionRenderer = (client, isSelected) => {
	const displayName = getClientDisplayName(client) || client.rfc;
	return (
		<div className="flex w-full items-center justify-between gap-3">
			<div className="flex flex-col">
				<span className="text-sm font-medium text-foreground">
					{displayName}
				</span>
				<span className="text-xs text-muted-foreground">{client.rfc}</span>
			</div>
			{isSelected && (
				<Check
					className="h-4 w-4 text-primary"
					aria-hidden="true"
					data-testid="client-selector-check-icon"
				/>
			)}
		</div>
	);
};

interface ClientSelectorCommandContentProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	searchPlaceholder: string;
	autoFocusSearch: boolean;
	onCreateNew?: () => void;
	loading: boolean;
	error: string | null;
	mappedItems: Array<{ client: Client; value: string; label: string }>;
	emptyState: string;
	selectedClient: Client | null;
	getOptionValue?: (client: Client) => string;
	renderOption: OptionRenderer;
	onSelect: (value: string) => void;
	listRef: React.RefObject<HTMLDivElement | null>;
	shouldShowSummary: boolean;
	resultSummary: string;
	isMobile?: boolean;
}

function ClientSelectorCommandContent({
	searchTerm,
	onSearchChange,
	searchPlaceholder,
	autoFocusSearch,
	onCreateNew,
	loading,
	error,
	mappedItems,
	emptyState,
	selectedClient,
	getOptionValue,
	renderOption,
	onSelect,
	listRef,
	shouldShowSummary,
	resultSummary,
	isMobile = false,
}: ClientSelectorCommandContentProps): React.ReactElement {
	return (
		<Command
			shouldFilter={false}
			className={cn(isMobile && "flex flex-col h-full")}
		>
			<CommandInput
				value={searchTerm}
				onValueChange={onSearchChange}
				placeholder={searchPlaceholder}
				autoFocus={autoFocusSearch}
				className={cn(isMobile && "sticky top-0 z-10")}
			/>

			{/* Create New Client button - always visible at top */}
			{onCreateNew && (
				<>
					<div className="px-2 py-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="w-full justify-start gap-2 text-primary hover:text-primary"
							onClick={onCreateNew}
						>
							<Plus className="h-4 w-4" />
							Crear nuevo cliente
						</Button>
					</div>
					<CommandSeparator />
				</>
			)}

			{loading && (
				<div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
					<Spinner size="sm" />
					Buscando clientes…
				</div>
			)}

			{!loading && error && (
				<div className="px-3 py-4 text-sm text-destructive">{error}</div>
			)}

			{!loading && !error && (
				<>
					<CommandList
						ref={listRef}
						className={cn(
							isMobile
								? "flex-1 overflow-y-auto overscroll-contain"
								: "max-h-[300px]",
						)}
					>
						{mappedItems.length === 0 ? (
							<CommandEmpty>
								<div className="flex flex-col items-center gap-3 py-2">
									<span>{emptyState}</span>
									{onCreateNew && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="gap-2 bg-transparent"
											onClick={onCreateNew}
										>
											<Plus className="h-4 w-4" />
											Crear nuevo cliente
										</Button>
									)}
								</div>
							</CommandEmpty>
						) : (
							<CommandGroup heading="Clientes">
								{mappedItems.map(({ client, value: optionValue }) => {
									const isSelected = selectedClient
										? (getOptionValue
												? getOptionValue(selectedClient)
												: selectedClient.id) === optionValue
										: false;

									return (
										<CommandItem
											key={optionValue}
											value={optionValue}
											onSelect={() => onSelect(optionValue)}
											className={cn(isMobile && "py-3")}
										>
											{renderOption(client, isSelected)}
										</CommandItem>
									);
								})}
							</CommandGroup>
						)}
					</CommandList>
					{shouldShowSummary && (
						<div
							className={cn(
								"border-t px-3 py-2",
								isMobile
									? "sticky bottom-0 bg-background pb-[env(safe-area-inset-bottom)]"
									: "bg-popover",
							)}
						>
							<p
								className="text-[11px] text-muted-foreground"
								aria-live="polite"
							>
								{resultSummary}
							</p>
						</div>
					)}
				</>
			)}
		</Command>
	);
}

export function ClientSelector({
	label,
	value,
	placeholder,
	searchPlaceholder = "Buscar cliente por nombre o RFC...",
	helperText,
	emptyState = "No se encontraron clientes para tu búsqueda.",
	disabled = false,
	required = false,
	pageSize,
	debounceMs,
	autoFocusSearch = true,
	onChange,
	onValueChange,
	getOptionValue,
	renderOption = defaultRenderOption,
	className,
	onCreateNew,
}: ClientSelectorProps): React.ReactElement {
	const labelId = useId();
	const listRef = useRef<HTMLDivElement>(null);
	const isMobile = useIsMobile();
	const resolvedPlaceholder =
		placeholder ??
		(label ? `Seleccionar ${label.toLowerCase()}` : "Seleccionar cliente");
	const isControlled = value !== undefined;

	const [selectedLabel, setSelectedLabel] = useState(value ?? "");
	const [selectedClient, setSelectedClient] = useState<Client | null>(null);
	const [open, setOpen] = useState(false);
	const [showResults, setShowResults] = useState(false);

	const { items, pagination, loading, error, searchTerm, setSearchTerm } =
		useClientSearch({
			pageSize,
			debounceMs,
			enabled: !disabled,
		});

	const mappedItems = useMemo(
		() =>
			items.map((client) => ({
				client,
				value: getOptionValue ? getOptionValue(client) : client.id,
				label: getClientDisplayName(client) || client.rfc,
			})),
		[items, getOptionValue],
	);

	useEffect(() => {
		if (!isControlled) {
			return;
		}

		setSelectedLabel(value ?? "");

		if (!value) {
			setSelectedClient(null);
			return;
		}

		const match = items.find(
			(client) =>
				(getOptionValue ? getOptionValue(client) : client.id) === value,
		);
		setSelectedClient(match ?? null);
	}, [isControlled, value, items, getOptionValue]);

	const handleSelect = (optionValue: string): void => {
		const match = mappedItems.find((entry) => entry.value === optionValue);
		if (!match) {
			return;
		}

		setSelectedClient(match.client);
		const labelValue = match.label;

		if (!isControlled) {
			setSelectedLabel(labelValue);
		}

		setSearchTerm("");
		setShowResults(false);
		setOpen(false);

		onValueChange?.(optionValue);
		onChange?.(match.client);
	};

	const handleSearchChange = (next: string): void => {
		setShowResults(true);
		setSearchTerm(next);
	};

	const handleOpenChange = (next: boolean): void => {
		setOpen(next);
		setShowResults(next);
	};

	const handleCreateNew = (): void => {
		setOpen(false);
		onCreateNew?.();
	};

	const resultSummary = useMemo(() => {
		if (loading) {
			return "Buscando clientes...";
		}

		if (error) {
			return error;
		}

		if (!pagination) {
			return "";
		}

		return `Mostrando ${items.length} de ${pagination.total} clientes`;
	}, [loading, error, pagination, items.length]);

	const shouldShowSummary = open && showResults && Boolean(resultSummary);

	const triggerButton = (
		<Button
			variant="outline"
			role="combobox"
			aria-expanded={open}
			aria-labelledby={label ? labelId : undefined}
			disabled={disabled}
			className="w-full justify-between text-left font-normal bg-transparent"
		>
			<span className="truncate">{selectedLabel || resolvedPlaceholder}</span>
			<span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
				<span className="hidden sm:inline">cliente</span>
				<ChevronsUpDown
					className="h-4 w-4 shrink-0 opacity-50"
					aria-hidden="true"
				/>
			</span>
		</Button>
	);

	const commandContentProps: ClientSelectorCommandContentProps = {
		searchTerm,
		onSearchChange: handleSearchChange,
		searchPlaceholder,
		autoFocusSearch,
		onCreateNew: onCreateNew ? handleCreateNew : undefined,
		loading,
		error,
		mappedItems,
		emptyState,
		selectedClient,
		getOptionValue,
		renderOption,
		onSelect: handleSelect,
		listRef,
		shouldShowSummary,
		resultSummary,
		isMobile,
	};

	return (
		<div className={cn("space-y-2", className)}>
			{label && (
				<Label id={labelId} className="text-sm font-medium text-foreground">
					{label}
					{required && <span className="ml-1 text-destructive">*</span>}
				</Label>
			)}

			{isMobile ? (
				<Dialog open={open} onOpenChange={handleOpenChange}>
					<DialogTrigger asChild>{triggerButton}</DialogTrigger>
					<DialogContent
						className="h-dvh max-h-dvh w-screen max-w-none m-0 p-0 rounded-none flex flex-col gap-0 border-0 [&>button]:hidden"
						showCloseButton={false}
					>
						{/* Fixed header with close button */}
						<DialogHeader className="flex-none px-4 pt-[env(safe-area-inset-top)] pb-2 border-b bg-background">
							<div className="flex items-center justify-between">
								<DialogTitle className="text-base font-semibold">
									{label || "Seleccionar cliente"}
									{required && <span className="ml-1 text-destructive">*</span>}
								</DialogTitle>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 -mr-2"
									onClick={() => setOpen(false)}
								>
									<X className="h-4 w-4" />
									<span className="sr-only">Cerrar</span>
								</Button>
							</div>
						</DialogHeader>
						{/* Flex-grow content area that adapts to keyboard */}
						<div className="flex-1 min-h-0 overflow-hidden">
							<ClientSelectorCommandContent {...commandContentProps} />
						</div>
					</DialogContent>
				</Dialog>
			) : (
				<Popover open={open} onOpenChange={handleOpenChange}>
					<PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
					<PopoverContent
						className="w-[--radix-popover-trigger-width] p-0"
						align="start"
					>
						<ClientSelectorCommandContent {...commandContentProps} />
					</PopoverContent>
				</Popover>
			)}

			{helperText && (
				<p className="text-xs text-muted-foreground">{helperText}</p>
			)}
		</div>
	);
}

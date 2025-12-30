"use client";

import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
import type { Client } from "@/types/client";
import { useClientSearch } from "@/hooks/useClientSearch";
import { getClientDisplayName } from "@/types/client";

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

	return (
		<div className={cn("space-y-2", className)}>
			{label && (
				<Label id={labelId} className="text-sm font-medium text-foreground">
					{label}
					{required && <span className="ml-1 text-destructive">*</span>}
				</Label>
			)}

			<Popover open={open} onOpenChange={handleOpenChange}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						aria-labelledby={label ? labelId : undefined}
						disabled={disabled}
						className="w-full justify-between text-left font-normal"
					>
						<span className="truncate">
							{selectedLabel || resolvedPlaceholder}
						</span>
						<span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
							<span className="hidden sm:inline">cliente</span>
							<ChevronsUpDown
								className="h-4 w-4 shrink-0 opacity-50"
								aria-hidden="true"
							/>
						</span>
					</Button>
				</PopoverTrigger>

				<PopoverContent
					className="w-[--radix-popover-trigger-width] p-0"
					align="start"
				>
					<Command shouldFilter={false}>
						<CommandInput
							value={searchTerm}
							onValueChange={handleSearchChange}
							placeholder={searchPlaceholder}
							autoFocus={autoFocusSearch}
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
										onClick={handleCreateNew}
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
								<CommandList ref={listRef} className="max-h-[300px]">
									{mappedItems.length === 0 ? (
										<CommandEmpty>
											<div className="flex flex-col items-center gap-3 py-2">
												<span>{emptyState}</span>
												{onCreateNew && (
													<Button
														type="button"
														variant="outline"
														size="sm"
														className="gap-2"
														onClick={handleCreateNew}
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
														onSelect={() => handleSelect(optionValue)}
													>
														{renderOption(client, isSelected)}
													</CommandItem>
												);
											})}
										</CommandGroup>
									)}
								</CommandList>
								{shouldShowSummary && (
									<div className="sticky bottom-0 border-t bg-popover px-3 py-2">
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
				</PopoverContent>
			</Popover>

			{helperText && (
				<p className="text-xs text-muted-foreground">{helperText}</p>
			)}
		</div>
	);
}

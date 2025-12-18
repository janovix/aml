"use client";

import type React from "react";
import { useEffect, useId, useMemo, useState } from "react";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
	Label,
	Spinner,
	cn,
} from "@algtools/ui";
import { Check, ChevronsUpDown } from "lucide-react";
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
	autoFocusSearch = false,
	onChange,
	onValueChange,
	getOptionValue,
	renderOption = defaultRenderOption,
	className,
}: ClientSelectorProps): React.ReactElement {
	const labelId = useId();
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

	const handleSelect = (value: string): void => {
		const match = mappedItems.find((entry) => entry.value === value);
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

		onValueChange?.(value);
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

			<Combobox
				open={open}
				onOpenChange={handleOpenChange}
				type="cliente"
				data={[]}
			>
				<ComboboxTrigger
					className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-left text-sm shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
					aria-labelledby={label ? labelId : undefined}
					disabled={disabled}
				>
					<span className="truncate">
						{selectedLabel || resolvedPlaceholder}
					</span>
					<span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
						<span className="hidden sm:inline">cliente</span>
						<ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
					</span>
				</ComboboxTrigger>

				<ComboboxContent filter={() => 1}>
					<ComboboxInput
						value={searchTerm}
						onValueChange={handleSearchChange}
						placeholder={searchPlaceholder}
						autoComplete="off"
						autoFocus={autoFocusSearch}
					/>

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
						<ComboboxList>
							{mappedItems.length === 0 ? (
								<ComboboxEmpty>{emptyState}</ComboboxEmpty>
							) : (
								<ComboboxGroup heading="Clientes">
									{mappedItems.map(({ client, value: optionValue }) => {
										const isSelected = selectedClient
											? (getOptionValue
													? getOptionValue(selectedClient)
													: selectedClient.id) === optionValue
											: false;

										return (
											<ComboboxItem
												key={optionValue}
												value={optionValue}
												onSelect={() => handleSelect(optionValue)}
											>
												{renderOption(client, isSelected)}
											</ComboboxItem>
										);
									})}
								</ComboboxGroup>
							)}
						</ComboboxList>
					)}
				</ComboboxContent>
			</Combobox>

			{helperText && (
				<p className="text-xs text-muted-foreground">{helperText}</p>
			)}
			{shouldShowSummary && (
				<p className="text-[11px] text-muted-foreground" aria-live="polite">
					{resultSummary}
				</p>
			)}
		</div>
	);
}

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
import type { CatalogItem } from "@/types/catalog";
import { useCatalogSearch } from "@/hooks/useCatalogSearch";
import { LabelWithInfo } from "../ui/LabelWithInfo";

type OptionRenderer = (
	option: CatalogItem,
	isSelected: boolean,
) => React.ReactNode;

interface CatalogSelectorProps {
	catalogKey: string;
	label?: string;
	labelDescription?: string;
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
	typeLabel?: string;
	onChange?: (option: CatalogItem | null) => void;
	onValueChange?: (value: string | null) => void;
	getOptionValue?: (option: CatalogItem) => string;
	renderOption?: OptionRenderer;
	className?: string;
}

const defaultRenderOption: OptionRenderer = (option, isSelected) => (
	<div className="flex w-full items-center justify-between gap-3">
		<span className="text-sm font-medium text-foreground">{option.name}</span>
		{isSelected && (
			<Check
				className="h-4 w-4 text-primary"
				aria-hidden="true"
				data-testid="catalog-selector-check-icon"
			/>
		)}
	</div>
);

export function CatalogSelector({
	catalogKey,
	label,
	labelDescription,
	value,
	placeholder,
	searchPlaceholder = "Buscar en el catálogo...",
	helperText,
	emptyState = "No se encontraron resultados para tu búsqueda.",
	disabled = false,
	required = false,
	pageSize,
	debounceMs,
	autoFocusSearch = false,
	typeLabel,
	onChange,
	onValueChange,
	getOptionValue,
	renderOption = defaultRenderOption,
	className,
}: CatalogSelectorProps): React.ReactElement {
	const labelId = useId();
	const resolvedPlaceholder =
		placeholder ??
		(label ? `Seleccionar ${label.toLowerCase()}` : "Seleccionar opción");
	const resolvedType = typeLabel ?? label?.toLowerCase() ?? "opción";
	const isControlled = value !== undefined;

	const [selectedLabel, setSelectedLabel] = useState(value ?? "");
	const [selectedOption, setSelectedOption] = useState<CatalogItem | null>(
		null,
	);
	const [open, setOpen] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const [pagesSearchedForValue, setPagesSearchedForValue] = useState(0);
	const [lastSearchedValue, setLastSearchedValue] = useState<
		string | undefined
	>(value);

	const {
		items,
		pagination,
		loading,
		loadingMore,
		error,
		searchTerm,
		setSearchTerm,
		loadMore,
		hasMore,
	} = useCatalogSearch({
		catalogKey,
		pageSize,
		debounceMs,
		enabled: !disabled,
	});

	const mappedItems = useMemo(
		() =>
			items.map((item) => ({
				item,
				value: getOptionValue ? getOptionValue(item) : (item.id ?? item.name),
				label: item.name,
			})),
		[items, getOptionValue],
	);

	// Reset search counter when value changes
	useEffect(() => {
		if (value !== lastSearchedValue) {
			setPagesSearchedForValue(0);
			setLastSearchedValue(value);
		}
	}, [value, lastSearchedValue]);

	// Effect to find and set the selected item when value or items change
	useEffect(() => {
		if (!isControlled) {
			return;
		}

		if (!value) {
			setSelectedLabel("");
			setSelectedOption(null);
			return;
		}

		// Find the item by comparing the value (ID) with the item's ID or computed value
		const match = items.find((entry) => {
			const entryValue = getOptionValue
				? getOptionValue(entry)
				: (entry.id ?? entry.name);
			return entryValue === value;
		});

		if (match) {
			setSelectedOption(match);
			setSelectedLabel(match.name);
			setPagesSearchedForValue(0); // Reset search counter when found
		} else if (
			!loading &&
			!loadingMore &&
			items.length > 0 &&
			hasMore &&
			pagesSearchedForValue < 5
		) {
			// If we have items loaded but no match, try loading more pages
			// Limit to 5 pages to avoid infinite loops
			setPagesSearchedForValue((prev) => prev + 1);
			loadMore().catch(() => {
				// Ignore errors, will fall back to showing value
			});
		} else if (!loading && !loadingMore && !match) {
			// After searching or if no more pages, show the value as fallback
			setSelectedLabel(value);
		}
	}, [
		isControlled,
		value,
		items,
		getOptionValue,
		loading,
		loadingMore,
		hasMore,
		loadMore,
		pagesSearchedForValue,
	]);

	const handleSelect = (value: string): void => {
		const match = mappedItems.find((entry) => entry.value === value);
		if (!match) {
			return;
		}

		setSelectedOption(match.item);
		const labelValue = match.item.name;

		if (!isControlled) {
			setSelectedLabel(labelValue);
		}

		setSearchTerm("");
		setShowResults(false);
		setOpen(false);

		onValueChange?.(value);
		onChange?.(match.item);
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
			return "Buscando resultados...";
		}

		if (error) {
			return error;
		}

		if (!pagination) {
			return "";
		}

		return `Mostrando ${items.length} de ${pagination.total} resultados`;
	}, [loading, error, pagination, items.length]);

	const shouldShowSummary = open && showResults && Boolean(resultSummary);

	return (
		<div className={cn("space-y-2", className)}>
			{label &&
				(labelDescription ? (
					<LabelWithInfo
						htmlFor={labelId}
						description={labelDescription}
						required={required}
					>
						{label}
					</LabelWithInfo>
				) : (
					<Label id={labelId} className="text-sm font-medium text-foreground">
						{label}
						{required && <span className="ml-1 text-destructive">*</span>}
					</Label>
				))}

			<Combobox
				open={open}
				onOpenChange={handleOpenChange}
				type={resolvedType}
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
						<span className="hidden sm:inline">{resolvedType}</span>
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
							Buscando resultados…
						</div>
					)}

					{!loading && error && (
						<div className="px-3 py-4 text-sm text-destructive">{error}</div>
					)}

					{!loading && !error && (
						<>
							<ComboboxList
								onScrollToBottom={
									hasMore && !loadingMore ? loadMore : undefined
								}
							>
								{mappedItems.length === 0 ? (
									<ComboboxEmpty>{emptyState}</ComboboxEmpty>
								) : (
									<ComboboxGroup heading="Resultados">
										{mappedItems.map(({ item, value: optionValue }) => {
											const isSelected = selectedOption
												? (getOptionValue
														? getOptionValue(selectedOption)
														: (selectedOption.id ?? selectedOption.name)) ===
													optionValue
												: false;

											return (
												<ComboboxItem
													key={optionValue}
													value={optionValue}
													onSelect={() => handleSelect(optionValue)}
												>
													{renderOption(item, isSelected)}
												</ComboboxItem>
											);
										})}
									</ComboboxGroup>
								)}
								{loadingMore && (
									<div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
										<Spinner size="sm" />
										Cargando más resultados...
									</div>
								)}
							</ComboboxList>
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
				</ComboboxContent>
			</Combobox>

			{helperText && (
				<p className="text-xs text-muted-foreground">{helperText}</p>
			)}
		</div>
	);
}

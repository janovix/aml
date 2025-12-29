"use client";

import type React from "react";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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
	const listRef = useRef<HTMLDivElement>(null);
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

	const handleSelect = (optionValue: string): void => {
		const match = mappedItems.find((entry) => entry.value === optionValue);
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

		onValueChange?.(optionValue);
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

	// Handle infinite scroll
	const handleScroll = useCallback(async () => {
		const list = listRef.current;
		if (!list || loadingMore || loading || !hasMore) {
			return;
		}

		const { scrollTop, scrollHeight, clientHeight } = list;
		const threshold = 50; // Trigger when 50px from bottom

		if (scrollTop + clientHeight >= scrollHeight - threshold) {
			try {
				await loadMore();
			} catch {
				// Ignore errors
			}
		}
	}, [loadMore, loadingMore, loading, hasMore]);

	// Set up scroll listener
	useEffect(() => {
		const list = listRef.current;
		if (!list || !open) {
			return;
		}

		list.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			list.removeEventListener("scroll", handleScroll);
		};
	}, [handleScroll, open]);

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
							<span className="hidden sm:inline">{resolvedType}</span>
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
								<CommandList ref={listRef} className="max-h-[300px]">
									{mappedItems.length === 0 ? (
										<CommandEmpty>{emptyState}</CommandEmpty>
									) : (
										<CommandGroup heading="Resultados">
											{mappedItems.map(({ item, value: optionValue }) => {
												const isSelected = selectedOption
													? (getOptionValue
															? getOptionValue(selectedOption)
															: (selectedOption.id ?? selectedOption.name)) ===
														optionValue
													: false;

												return (
													<CommandItem
														key={optionValue}
														value={optionValue}
														onSelect={() => handleSelect(optionValue)}
													>
														{renderOption(item, isSelected)}
													</CommandItem>
												);
											})}
										</CommandGroup>
									)}
									{loadingMore && (
										<div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
											<Spinner size="sm" />
											Cargando más resultados...
										</div>
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

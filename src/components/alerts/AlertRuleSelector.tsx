"use client";

import type React from "react";
import {
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
	useCallback,
} from "react";
import { Check, ChevronsUpDown, AlertTriangle } from "lucide-react";
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
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useJwt } from "@/hooks/useJwt";
import {
	listAlertRules,
	type AlertRule,
	type AlertSeverity,
} from "@/lib/api/alerts";

const severityConfig: Record<
	AlertSeverity,
	{ label: string; dotColor: string }
> = {
	LOW: { label: "Baja", dotColor: "bg-zinc-400" },
	MEDIUM: { label: "Media", dotColor: "bg-amber-400" },
	HIGH: { label: "Alta", dotColor: "bg-orange-500" },
	CRITICAL: { label: "Crítica", dotColor: "bg-red-500" },
};

type OptionRenderer = (
	option: AlertRule,
	isSelected: boolean,
) => React.ReactNode;

interface AlertRuleSelectorProps {
	label?: string;
	value?: string;
	placeholder?: string;
	searchPlaceholder?: string;
	helperText?: string;
	emptyState?: string;
	disabled?: boolean;
	required?: boolean;
	autoFocusSearch?: boolean;
	onChange?: (rule: AlertRule | null) => void;
	onValueChange?: (value: string | null) => void;
	renderOption?: OptionRenderer;
	className?: string;
	/** Only show rules that can be manually triggered */
	manualTriggerable?: boolean;
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

const defaultRenderOption: OptionRenderer = (rule, isSelected) => {
	const severityCfg = severityConfig[rule.severity];
	return (
		<div className="flex w-full items-center justify-between gap-3">
			<div className="flex flex-col gap-0.5">
				<div className="flex items-center gap-2">
					<span
						className={`h-2 w-2 rounded-full shrink-0 ${severityCfg.dotColor}`}
					/>
					<span className="text-sm font-medium text-foreground">
						{rule.id} -{" "}
						{rule.name.length > 60 ? `${rule.name.slice(0, 60)}...` : rule.name}
					</span>
				</div>
				{rule.description && (
					<span className="text-xs text-muted-foreground line-clamp-1 ml-4">
						{rule.description}
					</span>
				)}
			</div>
			{isSelected && (
				<Check className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
			)}
		</div>
	);
};

interface AlertRuleSelectorCommandContentProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	searchPlaceholder: string;
	autoFocusSearch: boolean;
	loading: boolean;
	error: string | null;
	mappedItems: Array<{ rule: AlertRule; value: string; label: string }>;
	emptyState: string;
	selectedRule: AlertRule | null;
	renderOption: OptionRenderer;
	onSelect: (value: string) => void;
	listRef: React.RefObject<HTMLDivElement | null>;
	shouldShowSummary: boolean;
	resultSummary: string;
	isMobile?: boolean;
}

function AlertRuleSelectorCommandContent({
	searchTerm,
	onSearchChange,
	searchPlaceholder,
	autoFocusSearch,
	loading,
	error,
	mappedItems,
	emptyState,
	selectedRule,
	renderOption,
	onSelect,
	listRef,
	shouldShowSummary,
	resultSummary,
	isMobile = false,
}: AlertRuleSelectorCommandContentProps): React.ReactElement {
	return (
		<Command shouldFilter={false}>
			<CommandInput
				value={searchTerm}
				onValueChange={onSearchChange}
				placeholder={searchPlaceholder}
				autoFocus={autoFocusSearch}
			/>

			{loading && (
				<div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
					<Spinner size="sm" />
					Buscando reglas de alerta…
				</div>
			)}

			{!loading && error && (
				<div className="px-3 py-4 text-sm text-destructive">{error}</div>
			)}

			{!loading && !error && (
				<>
					<CommandList
						ref={listRef}
						className={cn(isMobile ? "max-h-[60vh]" : "max-h-[300px]")}
					>
						{mappedItems.length === 0 ? (
							<CommandEmpty>
								<div className="flex flex-col items-center gap-3 py-2">
									<span>{emptyState}</span>
								</div>
							</CommandEmpty>
						) : (
							<CommandGroup heading="Reglas de Alerta">
								{mappedItems.map(({ rule, value: optionValue }) => {
									const isSelected = selectedRule
										? selectedRule.id === optionValue
										: false;

									return (
										<CommandItem
											key={optionValue}
											value={optionValue}
											onSelect={() => onSelect(optionValue)}
										>
											{renderOption(rule, isSelected)}
										</CommandItem>
									);
								})}
							</CommandGroup>
						)}
					</CommandList>
					{shouldShowSummary && (
						<div
							className={cn(
								"sticky bottom-0 border-t px-3 py-2",
								isMobile ? "bg-background" : "bg-popover",
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

export function AlertRuleSelector({
	label,
	value,
	placeholder,
	searchPlaceholder = "Buscar regla de alerta...",
	helperText,
	emptyState = "No se encontraron reglas de alerta.",
	disabled = false,
	required = false,
	autoFocusSearch = true,
	onChange,
	onValueChange,
	renderOption = defaultRenderOption,
	className,
	manualTriggerable = true,
}: AlertRuleSelectorProps): React.ReactElement {
	const labelId = useId();
	const listRef = useRef<HTMLDivElement>(null);
	const isMobile = useIsMobile();
	const { jwt } = useJwt();
	const resolvedPlaceholder =
		placeholder ??
		(label
			? `Seleccionar ${label.toLowerCase()}`
			: "Seleccionar regla de alerta");
	const isControlled = value !== undefined;

	const [selectedLabel, setSelectedLabel] = useState(value ?? "");
	const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
	const [open, setOpen] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [items, setItems] = useState<AlertRule[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState<{ total: number } | null>(null);

	// Fetch alert rules
	const fetchRules = useCallback(
		async (search: string) => {
			if (!jwt) return;

			setLoading(true);
			setError(null);

			try {
				const response = await listAlertRules({
					jwt,
					search: search || undefined,
					active: true,
					limit: 50,
				});

				// Filter to only show rules that can be manually triggered if requested
				let filteredRules = response.data;
				if (manualTriggerable) {
					// All rules can be manually triggered, but we might want to prioritize manual-only ones
					// For now, show all active rules since any can have a manual alert created
				}

				setItems(filteredRules);
				setPagination({ total: response.pagination.total });
			} catch (err) {
				console.error("Error fetching alert rules:", err);
				setError("Error al cargar las reglas de alerta");
			} finally {
				setLoading(false);
			}
		},
		[jwt, manualTriggerable],
	);

	// Initial load
	useEffect(() => {
		if (open && jwt) {
			fetchRules(searchTerm);
		}
	}, [open, jwt, fetchRules, searchTerm]);

	const mappedItems = useMemo(
		() =>
			items.map((rule) => ({
				rule,
				value: rule.id,
				label: `${rule.id} - ${rule.name}`,
			})),
		[items],
	);

	useEffect(() => {
		if (!isControlled) {
			return;
		}

		setSelectedLabel(value ?? "");

		if (!value) {
			setSelectedRule(null);
			return;
		}

		const match = items.find((rule) => rule.id === value);
		setSelectedRule(match ?? null);
	}, [isControlled, value, items]);

	const handleSelect = (optionValue: string): void => {
		const match = mappedItems.find((entry) => entry.value === optionValue);
		if (!match) {
			return;
		}

		setSelectedRule(match.rule);
		const labelValue = match.label;

		if (!isControlled) {
			setSelectedLabel(labelValue);
		}

		setSearchTerm("");
		setShowResults(false);
		setOpen(false);

		onValueChange?.(optionValue);
		onChange?.(match.rule);
	};

	const handleSearchChange = (next: string): void => {
		setShowResults(true);
		setSearchTerm(next);
		fetchRules(next);
	};

	const handleOpenChange = (next: boolean): void => {
		setOpen(next);
		setShowResults(next);
		if (next) {
			fetchRules(searchTerm);
		}
	};

	const resultSummary = useMemo(() => {
		if (loading) {
			return "Buscando reglas...";
		}

		if (error) {
			return error;
		}

		if (!pagination) {
			return "";
		}

		return `Mostrando ${items.length} de ${pagination.total} reglas`;
	}, [loading, error, pagination, items.length]);

	const shouldShowSummary = open && showResults && Boolean(resultSummary);

	const triggerButton = (
		<Button
			variant="outline"
			role="combobox"
			aria-expanded={open}
			aria-labelledby={label ? labelId : undefined}
			disabled={disabled}
			className="w-full justify-between text-left font-normal"
		>
			<span className="truncate">{selectedLabel || resolvedPlaceholder}</span>
			<span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
				<span className="hidden sm:inline">regla</span>
				<ChevronsUpDown
					className="h-4 w-4 shrink-0 opacity-50"
					aria-hidden="true"
				/>
			</span>
		</Button>
	);

	const commandContentProps: AlertRuleSelectorCommandContentProps = {
		searchTerm,
		onSearchChange: handleSearchChange,
		searchPlaceholder,
		autoFocusSearch,
		loading,
		error,
		mappedItems,
		emptyState,
		selectedRule,
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
				<Sheet open={open} onOpenChange={handleOpenChange}>
					<SheetTrigger asChild>{triggerButton}</SheetTrigger>
					<SheetContent
						side="bottom"
						className="h-[85vh] flex flex-col p-0 [&>button]:hidden"
					>
						<SheetHeader className="px-4 pt-4 pb-2 border-b">
							<SheetTitle>
								{label || "Seleccionar regla de alerta"}
								{required && <span className="ml-1 text-destructive">*</span>}
							</SheetTitle>
						</SheetHeader>
						<div className="flex-1 overflow-hidden">
							<AlertRuleSelectorCommandContent {...commandContentProps} />
						</div>
					</SheetContent>
				</Sheet>
			) : (
				<Popover open={open} onOpenChange={handleOpenChange}>
					<PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
					<PopoverContent
						className="w-[--radix-popover-trigger-width] p-0"
						align="start"
					>
						<AlertRuleSelectorCommandContent {...commandContentProps} />
					</PopoverContent>
				</Popover>
			)}

			{helperText && (
				<p className="text-xs text-muted-foreground">{helperText}</p>
			)}
		</div>
	);
}

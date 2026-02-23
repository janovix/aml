"use client";

import type React from "react";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Check, ChevronsUpDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/completeness/FieldLabel";
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
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchExchangeRate } from "@/lib/api/exchange-rates";
import {
	getDecimalPlaces,
	formatCurrencyAmount,
	parseCurrencyAmount,
} from "@/lib/currency-formatting";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useLanguage } from "@/components/LanguageProvider";
import type { FieldTier } from "@/types/completeness";
import { cn } from "@/lib/utils";

export interface MoneyInputProps {
	// Value props
	amount: string;
	currencyCode: string;
	exchangeRate?: string;

	// Change handlers
	onAmountChange: (amount: string) => void;
	onCurrencyChange: (currencyCode: string) => void;
	onExchangeRateChange?: (rate: string) => void;

	// Configuration
	mainCurrency?: string; // The operation's main currency (for exchange rate display)
	label?: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;

	// Field tier for completeness indicator
	tier?: FieldTier;

	// Auto-fetch exchange rate
	autoFetchRate?: boolean; // Default: true

	// HTML id for the amount input
	id?: string;

	// Additional class names
	className?: string;
}

export function MoneyInput({
	amount,
	currencyCode,
	exchangeRate,
	onAmountChange,
	onCurrencyChange,
	onExchangeRateChange,
	mainCurrency = "MXN",
	label,
	placeholder = "0.00",
	disabled = false,
	required = false,
	tier,
	autoFetchRate = true,
	id,
	className,
}: MoneyInputProps): React.JSX.Element {
	const { t } = useLanguage();
	const [isLoadingRate, setIsLoadingRate] = useState(false);
	const [rateError, setRateError] = useState(false);
	const [displayAmount, setDisplayAmount] = useState(amount);
	const [currencyOpen, setCurrencyOpen] = useState(false);
	const lastFetchedRef = useRef<string>("");
	const amountInputRef = useRef<HTMLInputElement>(null);
	const cursorPosRef = useRef<number | null>(null);

	// Get all currencies (cached after first fetch, shared across instances)
	const { currencies, getByCode } = useCurrencies();

	const currentCurrencyItem = getByCode(currencyCode);
	const decimalPlaces = getDecimalPlaces(currencyCode, currentCurrencyItem);

	// Determine if exchange rate should be shown
	const showExchangeRate =
		currencyCode !== mainCurrency && onExchangeRateChange !== undefined;

	// Compute converted amount in main currency
	const convertedAmount = useMemo(() => {
		const numAmount = parseFloat(parseCurrencyAmount(displayAmount));
		const numRate = parseFloat(exchangeRate || "0");
		if (isNaN(numAmount) || numAmount === 0 || isNaN(numRate) || numRate <= 0) {
			return "0.00";
		}
		return (numAmount * numRate).toLocaleString("en-US", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	}, [displayAmount, exchangeRate]);

	// Format exchange rate for display (max 2 decimals)
	const displayExchangeRate = useMemo(() => {
		const rate = parseFloat(exchangeRate || "0");
		if (isNaN(rate) || rate === 0) return exchangeRate || "";
		// Format to max 2 decimals, removing trailing zeros
		return parseFloat(rate.toFixed(2)).toString();
	}, [exchangeRate]);

	// Determine if exchange rate should be editable
	// Only editable if there was an error fetching OR if no rate was fetched
	const isExchangeRateEditable =
		rateError && (!exchangeRate || parseFloat(exchangeRate) <= 0);

	// Format amount when it changes externally
	useEffect(() => {
		if (amount !== displayAmount) {
			setDisplayAmount(amount);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [amount]);

	// Auto-fetch exchange rate when currency changes
	useEffect(() => {
		if (!autoFetchRate || !showExchangeRate || disabled) {
			return;
		}

		const fetchKey = `${currencyCode}_${mainCurrency}`;

		// Skip if same currency
		if (currencyCode === mainCurrency) {
			return;
		}

		// If currency changed (different from last fetch), clear the old rate
		if (
			lastFetchedRef.current &&
			lastFetchedRef.current !== fetchKey &&
			onExchangeRateChange
		) {
			onExchangeRateChange("");
		}

		// Skip if already fetched for this currency pair
		if (lastFetchedRef.current === fetchKey) {
			return;
		}

		// Skip if exchange rate already exists for this currency pair
		if (exchangeRate && parseFloat(exchangeRate) > 0) {
			lastFetchedRef.current = fetchKey;
			return;
		}

		let cancelled = false;

		const fetchRate = async () => {
			setIsLoadingRate(true);
			setRateError(false);

			try {
				const rate = await fetchExchangeRate(currencyCode, mainCurrency);

				if (cancelled) return;

				if (rate && onExchangeRateChange) {
					lastFetchedRef.current = fetchKey;
					onExchangeRateChange(rate.rate.toFixed(6));
					setRateError(false);
				} else {
					setRateError(true);
				}
			} catch (error) {
				console.error("Failed to fetch exchange rate:", error);
				if (!cancelled) {
					setRateError(true);
				}
			} finally {
				if (!cancelled) {
					setIsLoadingRate(false);
				}
			}
		};

		void fetchRate();

		return () => {
			cancelled = true;
		};
	}, [
		currencyCode,
		mainCurrency,
		exchangeRate,
		showExchangeRate,
		autoFetchRate,
		disabled,
		onExchangeRateChange,
	]);

	// Restore cursor position after React re-renders the formatted value
	useEffect(() => {
		if (
			cursorPosRef.current !== null &&
			amountInputRef.current &&
			document.activeElement === amountInputRef.current
		) {
			const pos = cursorPosRef.current;
			amountInputRef.current.setSelectionRange(pos, pos);
			cursorPosRef.current = null;
		}
	});

	// Handle amount input change with live formatting
	const handleAmountChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const rawValue = e.target.value;
			const cursorPos = e.target.selectionStart ?? rawValue.length;

			// Allow empty or negative sign
			if (rawValue === "" || rawValue === "-") {
				cursorPosRef.current = null;
				setDisplayAmount(rawValue);
				onAmountChange(rawValue);
				return;
			}

			// Strip commas to get the raw number string
			const cleaned = rawValue.replace(/,/g, "");

			// Validate: allow digits, optional single dot, optional decimals
			if (!/^-?\d*\.?\d*$/.test(cleaned)) {
				return; // Reject invalid characters
			}

			// Format with thousand separators
			const parts = cleaned.split(".");
			const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

			let formatted: string;
			if (parts.length > 1) {
				// Limit decimal part to currency's decimal places
				const decimalPart = parts[1].slice(0, decimalPlaces);
				formatted = `${integerPart}.${decimalPart}`;
			} else {
				formatted = integerPart;
			}

			// Calculate new cursor position:
			// Count how many commas are before the cursor in old vs new value
			const commasBefore = (rawValue.slice(0, cursorPos).match(/,/g) || [])
				.length;
			// Digits (non-comma chars) before cursor in original
			const digitsBefore = cursorPos - commasBefore;
			// Walk through formatted string to find position after same number of digits
			let newPos = 0;
			let digits = 0;
			for (let i = 0; i < formatted.length; i++) {
				if (digits === digitsBefore) break;
				if (formatted[i] !== ",") digits++;
				newPos = i + 1;
			}
			cursorPosRef.current = newPos;

			setDisplayAmount(formatted);
			onAmountChange(cleaned);
		},
		[onAmountChange, decimalPlaces],
	);

	// Handle amount blur -- ensure trailing decimals are padded
	const handleAmountBlur = useCallback(() => {
		if (displayAmount === "" || displayAmount === "-") {
			return;
		}

		const num = parseFloat(parseCurrencyAmount(displayAmount));
		if (!isNaN(num)) {
			const formatted = formatCurrencyAmount(num, decimalPlaces);
			setDisplayAmount(formatted);
		}
	}, [displayAmount, decimalPlaces]);

	// Handle currency selection from dropdown
	const handleCurrencySelect = useCallback(
		(value: string) => {
			onCurrencyChange(value);
			setCurrencyOpen(false);
		},
		[onCurrencyChange],
	);

	return (
		<TooltipProvider>
			<div className={cn("w-full space-y-2", className)}>
				{/* Label */}
				{label && (
					<FieldLabel tier={tier} htmlFor={id} required={required}>
						{label}
					</FieldLabel>
				)}

				{/* Single compact inline row */}
				<div className="flex items-start w-full">
					{/* Currency + Amount input (unified border) */}
					<div className="flex-1 min-w-0">
						<div
							className={cn(
								"flex items-center border border-input rounded-md bg-card overflow-hidden h-10",
								disabled && "opacity-50 cursor-not-allowed",
								showExchangeRate && "rounded-r-none border-r-0",
							)}
						>
							{/* Currency selector as inline adornment */}
							<Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
								<PopoverTrigger asChild>
									<Button
										variant="ghost"
										role="combobox"
										aria-expanded={currencyOpen}
										className="h-full rounded-none border-r border-input px-2.5 hover:bg-accent/50 shrink-0 gap-1"
										disabled={disabled}
										type="button"
									>
										<span className="text-sm font-medium">{currencyCode}</span>
										<ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-[220px] p-0" align="start">
									<Command>
										<CommandInput placeholder={t("search")} className="h-9" />
										<CommandList>
											<CommandEmpty>{t("noResults")}</CommandEmpty>
											<CommandGroup>
												{currencies.map((item) => {
													const meta = item.metadata as
														| {
																shortName?: string;
																country?: string;
														  }
														| undefined;
													const code = meta?.shortName ?? item.id;
													const country = meta?.country ?? "";
													return (
														<CommandItem
															key={item.id}
															value={code}
															keywords={[item.name, country]}
															onSelect={() => handleCurrencySelect(code)}
														>
															<span className="font-medium shrink-0">
																{code}
															</span>
															<span className="ml-1.5 text-xs text-muted-foreground truncate">
																{item.name}
															</span>
															<Check
																className={cn(
																	"ml-auto h-4 w-4 shrink-0",
																	currencyCode === code
																		? "opacity-100"
																		: "opacity-0",
																)}
															/>
														</CommandItem>
													);
												})}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>

							{/* Amount input (no border, shares the unified container) */}
							<input
								ref={amountInputRef}
								id={id}
								type="text"
								inputMode="decimal"
								placeholder={placeholder}
								value={displayAmount}
								onChange={handleAmountChange}
								onBlur={handleAmountBlur}
								disabled={disabled}
								required={required}
								className="flex-1 h-full px-3 text-sm bg-transparent outline-none min-w-0 disabled:cursor-not-allowed"
							/>
						</div>

						{/* Converted amount label (smooth animation) */}
						<div
							className={cn(
								"overflow-hidden transition-all duration-300 ease-in-out",
								showExchangeRate ? "max-h-6 opacity-100" : "max-h-0 opacity-0",
							)}
						>
							<div className="px-1 pt-1">
								<span className="text-xs text-muted-foreground cursor-help tabular-nums">
									≈ ${convertedAmount} {mainCurrency}
								</span>
							</div>
						</div>
					</div>

					{/* Exchange rate column (compact, to the right) */}
					<div
						className={cn(
							"flex flex-col gap-0.5 w-[80px] shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
							showExchangeRate
								? "opacity-100 max-w-[80px]"
								: "opacity-0 max-w-0 w-0",
						)}
					>
						<span className="text-[10px] text-muted-foreground uppercase tracking-wide px-0.5 truncate -mt-[17px]">
							{currencyCode}→{mainCurrency}
						</span>
						<div className="flex items-center h-10 border border-input rounded-md rounded-l-none overflow-hidden">
							{isLoadingRate ? (
								<span className="px-2 text-xs text-muted-foreground animate-pulse truncate">
									{t("opPaymentExchangeRateFetching")}
								</span>
							) : isExchangeRateEditable ? (
								<div className="flex items-center w-full h-full">
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="pl-1.5 flex items-center text-destructive shrink-0">
												<AlertCircle className="h-3.5 w-3.5" />
											</div>
										</TooltipTrigger>
										<TooltipContent>
											<p>{t("opPaymentExchangeRateFetching")}</p>
										</TooltipContent>
									</Tooltip>
									<input
										id={id ? `${id}-exchange-rate` : undefined}
										type="text"
										inputMode="decimal"
										value={exchangeRate || ""}
										onChange={(e) => onExchangeRateChange?.(e.target.value)}
										placeholder="1.00"
										disabled={disabled}
										className="w-full h-full px-1.5 text-sm font-medium bg-transparent outline-none tabular-nums disabled:cursor-not-allowed"
									/>
								</div>
							) : (
								<Tooltip>
									<TooltipTrigger asChild>
										<div className="w-full h-full px-2 flex items-center text-sm font-medium tabular-nums truncate cursor-help">
											{displayExchangeRate}
										</div>
									</TooltipTrigger>
									<TooltipContent>
										<p className="font-mono">
											1 {currencyCode} = {exchangeRate} {mainCurrency}
										</p>
									</TooltipContent>
								</Tooltip>
							)}
						</div>
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}

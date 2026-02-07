"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/completeness/FieldLabel";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import type { OperationPaymentInput } from "@/types/operation";
import { useLanguage } from "@/components/LanguageProvider";
import { getCatalogCode } from "@/lib/catalog-utils";
import { fetchExchangeRate } from "@/lib/api/exchange-rates";

interface OperationPaymentFormProps {
	payments: OperationPaymentInput[];
	onChange: (payments: OperationPaymentInput[]) => void;
	disabled?: boolean;
	/** The operation-level currency code (used to determine when exchange rates are needed) */
	operationCurrency?: string;
}

const DEFAULT_PAYMENT: OperationPaymentInput = {
	paymentDate: new Date().toISOString().slice(0, 10),
	paymentFormCode: "",
	monetaryInstrumentCode: null,
	currencyCode: "MXN",
	amount: "",
	bankName: null,
	accountNumberMasked: null,
	checkNumber: null,
	reference: null,
};

/**
 * Calculate the total of all payments, converting foreign currencies
 * using their per-payment exchange rates.
 */
function calculateTotal(
	payments: OperationPaymentInput[],
	operationCurrency: string,
): number {
	return payments.reduce((sum, payment) => {
		const amount = parseFloat(payment.amount) || 0;
		const payCurrency = payment.currencyCode || "MXN";

		if (payCurrency === operationCurrency) {
			return sum + amount;
		}

		// Convert using the payment's exchange rate
		const rate = parseFloat(payment.exchangeRate || "0");
		return sum + amount * rate;
	}, 0);
}

export function OperationPaymentForm({
	payments,
	onChange,
	disabled = false,
	operationCurrency = "MXN",
}: OperationPaymentFormProps): React.ReactElement {
	const { t } = useLanguage();
	const [loadingRates, setLoadingRates] = React.useState<Set<number>>(
		new Set(),
	);
	// Track which currency we last fetched a rate for, per payment index,
	// so we don't re-fetch when the user manually edits the rate.
	const lastFetchedRef = React.useRef<Map<number, string>>(new Map());

	function handleAdd() {
		onChange([...payments, { ...DEFAULT_PAYMENT }]);
	}

	function handleRemove(index: number) {
		// Clean up the fetch-tracking ref
		lastFetchedRef.current.delete(index);
		onChange(payments.filter((_, i) => i !== index));
	}

	function handlePaymentChange(
		index: number,
		field: keyof OperationPaymentInput,
		value: string | null,
	) {
		const updated = payments.map((p, i) =>
			i === index ? { ...p, [field]: value } : p,
		);

		// When currency changes, clear the exchange rate so auto-fetch kicks in
		if (field === "currencyCode") {
			const payment = updated[index];
			const newCurrency = (value as string) || "MXN";
			if (newCurrency === operationCurrency) {
				payment.exchangeRate = undefined;
				lastFetchedRef.current.delete(index);
			} else {
				// Clear rate + tracking so the effect refetches
				payment.exchangeRate = undefined;
				lastFetchedRef.current.delete(index);
			}
		}

		onChange(updated);
	}

	// Auto-fetch exchange rates when a payment currency differs from operation currency
	React.useEffect(() => {
		let cancelled = false;

		payments.forEach(async (payment, index) => {
			const payCurrency = payment.currencyCode || "MXN";
			const fetchKey = `${payCurrency}_${operationCurrency}`;

			// Skip if same currency
			if (payCurrency === operationCurrency) return;
			// Skip if we already fetched for this exact pair
			if (lastFetchedRef.current.get(index) === fetchKey) return;
			// Skip if payment already has a rate (user manually typed or previously fetched)
			if (payment.exchangeRate) {
				lastFetchedRef.current.set(index, fetchKey);
				return;
			}

			setLoadingRates((prev) => new Set(prev).add(index));

			const rate = await fetchExchangeRate(payCurrency, operationCurrency);

			if (cancelled) return;

			setLoadingRates((prev) => {
				const next = new Set(prev);
				next.delete(index);
				return next;
			});

			if (rate) {
				lastFetchedRef.current.set(index, fetchKey);
				// Update the payment with the fetched rate
				const updated = [...payments];
				updated[index] = {
					...updated[index],
					exchangeRate: rate.rate.toFixed(6),
				};
				onChange(updated);
			} else {
				// Mark as fetched even on failure to avoid infinite retries
				lastFetchedRef.current.set(index, fetchKey);
			}
		});

		return () => {
			cancelled = true;
		};
		// We intentionally key on the currency codes and operationCurrency only
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [payments.map((p) => p.currencyCode).join(","), operationCurrency]);

	const hasMultipleCurrencies = payments.some(
		(p) => (p.currencyCode || "MXN") !== operationCurrency,
	);

	const total = calculateTotal(payments, operationCurrency);

	return (
		<div className="space-y-4">
			{payments.map((payment, index) => {
				const payCurrency = payment.currencyCode || "MXN";
				const isForeignCurrency = payCurrency !== operationCurrency;
				const isLoadingRate = loadingRates.has(index);

				return (
					<div key={index} className="relative rounded-lg border p-4 space-y-3">
						{payments.length > 1 && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="absolute top-2 right-2 h-7 w-7"
								onClick={() => handleRemove(index)}
								disabled={disabled}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
							{/* Payment Date */}
							<div className="space-y-1.5">
								<FieldLabel
									tier="sat_required"
									htmlFor={`payment-date-${index}`}
								>
									{t("opPaymentDate")}
								</FieldLabel>
								<Input
									id={`payment-date-${index}`}
									type="date"
									value={payment.paymentDate}
									onChange={(e) =>
										handlePaymentChange(index, "paymentDate", e.target.value)
									}
									disabled={disabled}
								/>
							</div>

							{/* Payment Form Code */}
							<div className="space-y-1.5">
								<FieldLabel
									tier="sat_required"
									htmlFor={`payment-form-${index}`}
								>
									{t("opPaymentMethod")}
								</FieldLabel>
								<CatalogSelector
									catalogKey="pld-payment-forms"
									value={payment.paymentFormCode}
									onValueChange={(val) =>
										handlePaymentChange(index, "paymentFormCode", val ?? "")
									}
									placeholder={t("selectPlaceholder")}
									disabled={disabled}
									getOptionValue={getCatalogCode}
								/>
							</div>

							{/* Monetary Instrument */}
							<div className="space-y-1.5">
								<FieldLabel
									tier="alert_required"
									htmlFor={`payment-instrument-${index}`}
								>
									{t("opMonetaryInstrument")}
								</FieldLabel>
								<CatalogSelector
									catalogKey="pld-monetary-instruments"
									value={payment.monetaryInstrumentCode ?? ""}
									onValueChange={(val) =>
										handlePaymentChange(
											index,
											"monetaryInstrumentCode",
											val || null,
										)
									}
									placeholder={t("selectPlaceholder")}
									disabled={disabled}
									getOptionValue={getCatalogCode}
								/>
							</div>

							{/* Currency */}
							<div className="space-y-1.5">
								<FieldLabel
									tier="sat_required"
									htmlFor={`payment-currency-${index}`}
								>
									{t("opCurrencyLabel")}
								</FieldLabel>
								<CatalogSelector
									catalogKey="currencies"
									value={payment.currencyCode ?? "MXN"}
									onValueChange={(val) =>
										handlePaymentChange(index, "currencyCode", val ?? "MXN")
									}
									placeholder="MXN"
									disabled={disabled}
								/>
							</div>

							{/* Amount */}
							<div className="space-y-1.5">
								<FieldLabel
									tier="sat_required"
									htmlFor={`payment-amount-${index}`}
								>
									{t("opAmount")}
								</FieldLabel>
								<Input
									id={`payment-amount-${index}`}
									type="text"
									inputMode="decimal"
									value={payment.amount}
									onChange={(e) =>
										handlePaymentChange(index, "amount", e.target.value)
									}
									placeholder="0.00"
									disabled={disabled}
								/>
							</div>

							{/* Exchange Rate (only shown for foreign currencies) */}
							{isForeignCurrency && (
								<div className="space-y-1.5">
									<FieldLabel
										tier="sat_required"
										htmlFor={`payment-exchange-rate-${index}`}
									>
										{t("opPaymentExchangeRate")} ({payCurrency} →{" "}
										{operationCurrency})
									</FieldLabel>
									<Input
										id={`payment-exchange-rate-${index}`}
										type="text"
										inputMode="decimal"
										value={payment.exchangeRate || ""}
										onChange={(e) =>
											handlePaymentChange(index, "exchangeRate", e.target.value)
										}
										placeholder={isLoadingRate ? "..." : "0.000000"}
										disabled={disabled || isLoadingRate}
										required
									/>
									{isLoadingRate && (
										<p className="text-xs text-muted-foreground">
											{t("opPaymentExchangeRateFetching")}
										</p>
									)}
									{!isLoadingRate && !payment.exchangeRate && (
										<p className="text-xs text-destructive">
											{t("opPaymentExchangeRateManual")}
										</p>
									)}
								</div>
							)}

							{/* Bank Name */}
							<div className="space-y-1.5">
								<FieldLabel
									tier="kyc_optional"
									htmlFor={`payment-bank-${index}`}
								>
									{t("opBank")}
								</FieldLabel>
								<Input
									id={`payment-bank-${index}`}
									value={payment.bankName ?? ""}
									onChange={(e) =>
										handlePaymentChange(
											index,
											"bankName",
											e.target.value || null,
										)
									}
									placeholder={t("opBankName")}
									disabled={disabled}
								/>
							</div>

							{/* Account Number */}
							<div className="space-y-1.5">
								<FieldLabel
									tier="kyc_optional"
									htmlFor={`payment-account-${index}`}
								>
									{t("opAccountDigits")}
								</FieldLabel>
								<Input
									id={`payment-account-${index}`}
									value={payment.accountNumberMasked ?? ""}
									onChange={(e) =>
										handlePaymentChange(
											index,
											"accountNumberMasked",
											e.target.value || null,
										)
									}
									placeholder="****1234"
									disabled={disabled}
								/>
							</div>

							{/* Reference */}
							<div className="space-y-1.5">
								<FieldLabel
									tier="kyc_optional"
									htmlFor={`payment-reference-${index}`}
								>
									{t("opReference")}
								</FieldLabel>
								<Input
									id={`payment-reference-${index}`}
									value={payment.reference ?? ""}
									onChange={(e) =>
										handlePaymentChange(
											index,
											"reference",
											e.target.value || null,
										)
									}
									placeholder={t("opPaymentReference")}
									disabled={disabled}
								/>
							</div>
						</div>
					</div>
				);
			})}

			{/* Payment total summary */}
			{payments.length > 0 && (
				<div className="rounded-lg border bg-muted/50 p-3 text-sm">
					<div className="flex items-center justify-between font-medium">
						<span>{t("opPaymentTotal")}</span>
						<span>
							{operationCurrency}{" "}
							{total.toLocaleString("en-US", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</span>
					</div>
					{hasMultipleCurrencies && (
						<p className="text-xs text-muted-foreground mt-1">
							{t("opPaymentTotalConverted")} {operationCurrency}
						</p>
					)}
				</div>
			)}

			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={handleAdd}
				disabled={disabled}
				className="w-full"
			>
				<Plus className="h-4 w-4 mr-1.5" />
				{t("opAddPaymentMethod")}
			</Button>
		</div>
	);
}

"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/completeness/FieldLabel";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import type { OperationPaymentInput, ActivityCode } from "@/types/operation";
import { useLanguage } from "@/components/LanguageProvider";
import {
	getCatalogCode,
	getCurrencyCode,
	getCatalogName,
} from "@/lib/catalog-utils";
import { ThresholdIndicator } from "./ThresholdIndicator";
import { MoneyInput } from "./MoneyInput";

interface OperationPaymentFormProps {
	payments: OperationPaymentInput[];
	onChange: (payments: OperationPaymentInput[]) => void;
	disabled?: boolean;
	/** The operation-level currency code (used to determine when exchange rates are needed) */
	operationCurrency?: string;
	/** Callback to change the operation currency */
	onCurrencyChange?: (currency: string) => void;
	/** Operation-level exchange rate (operation currency → MXN) */
	exchangeRate?: string;
	/** Callback to change the operation exchange rate */
	onExchangeRateChange?: (rate: string) => void;
	/** Activity code for threshold calculation */
	activityCode?: string;
	/** Amount in MXN for threshold calculation */
	amountMxn?: number;
	/** UMA value for threshold calculation */
	umaValue?: number;
	/** Whether to show the currency selector */
	showCurrencySelector?: boolean;
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
	onCurrencyChange,
	exchangeRate,
	onExchangeRateChange,
	activityCode,
	amountMxn,
	umaValue,
	showCurrencySelector = false,
}: OperationPaymentFormProps): React.ReactElement {
	const { t } = useLanguage();

	function handleAdd() {
		onChange([...payments, { ...DEFAULT_PAYMENT }]);
	}

	function handleRemove(index: number) {
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

		onChange(updated);
	}

	const hasMultipleCurrencies = payments.some(
		(p) => (p.currencyCode || "MXN") !== operationCurrency,
	);

	const total = calculateTotal(payments, operationCurrency);

	return (
		<div className="space-y-4">
			{/* Add payment button */}
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

			{payments.map((payment, index) => {
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

							{/* Currency + Amount + Exchange Rate (combined in MoneyInput) */}
							<div className="md:col-span-2">
								<MoneyInput
									id={`payment-amount-${index}`}
									amount={payment.amount}
									currencyCode={payment.currencyCode ?? "MXN"}
									exchangeRate={payment.exchangeRate}
									onAmountChange={(val) =>
										handlePaymentChange(index, "amount", val)
									}
									onCurrencyChange={(val) =>
										handlePaymentChange(index, "currencyCode", val)
									}
									onExchangeRateChange={(val) =>
										handlePaymentChange(index, "exchangeRate", val)
									}
									mainCurrency={operationCurrency}
									label={t("opAmount")}
									tier="sat_required"
									disabled={disabled}
									required
								/>
							</div>

							{/* Bank Name */}
							<div className="space-y-1.5">
								<FieldLabel
									tier="kyc_optional"
									htmlFor={`payment-bank-${index}`}
								>
									{t("opBank")}
								</FieldLabel>
								<CatalogSelector
									id={`payment-bank-${index}`}
									catalogKey="banks"
									value={payment.bankName ?? ""}
									onValueChange={(val) =>
										handlePaymentChange(index, "bankName", val || null)
									}
									placeholder={t("opBankName")}
									disabled={disabled}
									allowCustomValue
									getOptionValue={getCatalogName}
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

			{/* Payment total summary with currency selector */}
			{payments.length > 0 && (
				<div className="space-y-3">
					<div className="rounded-lg border bg-muted/50 p-4 space-y-4">
						{/* Currency and exchange rate - top section */}
						{showCurrencySelector && onCurrencyChange && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Currency selector */}
								<div className="space-y-1.5">
									<FieldLabel tier="sat_required" htmlFor="operation-currency">
										{t("opCurrencyLabel")}
									</FieldLabel>
									<CatalogSelector
										id="operation-currency"
										catalogKey="currencies"
										value={operationCurrency}
										onValueChange={(val) => onCurrencyChange(val ?? "MXN")}
										placeholder="MXN"
										disabled={disabled}
										getOptionValue={getCurrencyCode}
									/>
								</div>

								{/* Exchange rate - only shown when currency is not MXN */}
								{operationCurrency !== "MXN" && onExchangeRateChange && (
									<div className="space-y-1.5">
										<FieldLabel
											tier="sat_required"
											htmlFor="operation-exchange-rate"
										>
											{t("opExchangeRateLabel")} ({operationCurrency} → MXN)
										</FieldLabel>
										<Input
											id="operation-exchange-rate"
											type="text"
											inputMode="decimal"
											value={exchangeRate || ""}
											onChange={(e) => onExchangeRateChange(e.target.value)}
											placeholder="1.00"
											disabled={disabled}
										/>
									</div>
								)}
							</div>
						)}

						{/* Divider */}
						{showCurrencySelector && onCurrencyChange && (
							<div className="border-t" />
						)}

						{/* Total section - bottom */}
						<div className="space-y-3">
							<div className="space-y-1">
								<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
									{t("opPaymentTotal")}
								</div>
								<div className="text-3xl font-bold tabular-nums">
									{operationCurrency}{" "}
									{total.toLocaleString("en-US", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</div>
								{hasMultipleCurrencies && (
									<p className="text-xs text-muted-foreground">
										{t("opPaymentTotalConverted")} {operationCurrency}
									</p>
								)}
							</div>
							{activityCode && amountMxn !== undefined && umaValue && (
								<ThresholdIndicator
									code={activityCode as ActivityCode}
									amountMxn={amountMxn}
									umaValue={umaValue}
								/>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

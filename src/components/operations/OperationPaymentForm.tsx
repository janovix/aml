"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/completeness/FieldLabel";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import type { OperationPaymentInput } from "@/types/operation";
import { useLanguage } from "@/components/LanguageProvider";

interface OperationPaymentFormProps {
	payments: OperationPaymentInput[];
	onChange: (payments: OperationPaymentInput[]) => void;
	disabled?: boolean;
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

export function OperationPaymentForm({
	payments,
	onChange,
	disabled = false,
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

	return (
		<div className="space-y-4">
			{payments.map((payment, index) => (
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
							<FieldLabel tier="sat_required" htmlFor={`payment-date-${index}`}>
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
							<FieldLabel tier="sat_required" htmlFor={`payment-form-${index}`}>
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

						{/* Bank Name */}
						<div className="space-y-1.5">
							<FieldLabel tier="kyc_optional" htmlFor={`payment-bank-${index}`}>
								{t("opBank")}
							</FieldLabel>
							<Input
								id={`payment-bank-${index}`}
								value={payment.bankName ?? ""}
								onChange={(e) =>
									handlePaymentChange(index, "bankName", e.target.value || null)
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
			))}

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

"use client";

import type React from "react";
import { useState, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useSearchParams } from "next/navigation";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useSessionStorageForm } from "@/hooks/useSessionStorageForm";
import { useOrgSettings } from "@/hooks/useOrgSettings";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, FileText, AlertCircle, Info } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { toast } from "sonner";
import { createOperation } from "@/lib/api/operations";
import { executeMutation } from "@/lib/mutations";
import type {
	OperationCreateRequest,
	OperationPaymentInput,
	ActivityCode,
} from "@/types/operation";
import { ACTIVITY_EXTENSION_KEY } from "@/types/operation";
import { getExtensionForm } from "@/components/operations/extensions";
import { OperationPaymentForm } from "./OperationPaymentForm";
import { ActivityBadge } from "./ActivityBadge";
import { ThresholdIndicator } from "./ThresholdIndicator";
import { getActivityVisual } from "@/lib/activity-registry";
import { FieldLabel } from "@/components/completeness/FieldLabel";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { ClientSelector } from "@/components/clients/ClientSelector";
import { useLanguage } from "@/components/LanguageProvider";
import { getCatalogCode } from "@/lib/catalog-utils";

interface OperationFormData {
	clientId: string;
	operationDate: string;
	branchPostalCode: string;
	amount: string;
	currencyCode: string;
	exchangeRate: string;
	alertTypeCode: string;
	notes: string;
	referenceNumber: string;
	invoiceId: string;
	dataSource: string;
	payments: OperationPaymentInput[];
	extension: Record<string, unknown>;
}

const getInitialFormData = (): OperationFormData => ({
	clientId: "",
	operationDate: new Date().toISOString().slice(0, 10),
	branchPostalCode: "",
	amount: "",
	currencyCode: "MXN",
	exchangeRate: "",
	alertTypeCode: "",
	notes: "",
	referenceNumber: "",
	invoiceId: "",
	dataSource: "MANUAL",
	payments: [
		{
			paymentDate: new Date().toISOString().slice(0, 10),
			paymentFormCode: "",
			monetaryInstrumentCode: null,
			currencyCode: "MXN",
			amount: "",
			bankName: null,
			accountNumberMasked: null,
			checkNumber: null,
			reference: null,
		},
	],
	extension: {},
});

export function OperationCreateView(): React.JSX.Element {
	const { t } = useLanguage();
	const { navigateTo } = useOrgNavigation();
	const searchParams = useSearchParams();
	const {
		activityCode,
		isLoading: isSettingsLoading,
		isConfigured,
	} = useOrgSettings();
	const [isSaving, setIsSaving] = useState(false);

	const invoiceIdParam = searchParams.get("invoiceId");
	const dataSourceParam = searchParams.get("dataSource");
	const isCfdiPrefill = dataSourceParam === "CFDI" && !!invoiceIdParam;

	const [formData, setFormData, clearFormStorage] =
		useSessionStorageForm<OperationFormData>(
			"operation_create",
			getInitialFormData(),
		);

	// Pre-fill from CFDI search params
	useEffect(() => {
		if (isCfdiPrefill && invoiceIdParam && !formData.invoiceId) {
			setFormData((prev) => ({
				...prev,
				invoiceId: invoiceIdParam,
				dataSource: "CFDI",
			}));
		}
	}, [isCfdiPrefill, invoiceIdParam, formData.invoiceId, setFormData]);

	// Auto-calculate operation amount from the sum of payment amounts (with exchange rate conversion)
	useEffect(() => {
		const opCurrency = formData.currencyCode || "MXN";

		const total = formData.payments.reduce((sum, payment) => {
			const amount = parseFloat(payment.amount) || 0;
			const payCurrency = payment.currencyCode || "MXN";

			if (payCurrency === opCurrency) {
				return sum + amount;
			}

			// Convert using the per-payment exchange rate
			const rate = parseFloat(payment.exchangeRate || "0");
			return sum + amount * rate;
		}, 0);

		setFormData((prev) => ({
			...prev,
			amount: total > 0 ? total.toFixed(2) : "",
		}));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		// Only depend on payment amounts, currencies, exchange rates, and operation currency
		// eslint-disable-next-line react-hooks/exhaustive-deps
		formData.payments
			.map((p) => `${p.amount}|${p.currencyCode}|${p.exchangeRate}`)
			.join(","),
		formData.currencyCode,
	]);

	const handleFieldChange = (
		field: keyof OperationFormData,
		value: string | OperationPaymentInput[] | Record<string, unknown>,
	): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();

		if (!activityCode) {
			toast.error("La organización no tiene actividad vulnerable configurada.");
			return;
		}

		if (!formData.clientId) {
			toast.error(t("opSelectClient"));
			return;
		}

		if (formData.payments.length === 0) {
			toast.error(t("opAtLeastOnePayment"));
			return;
		}

		await Sentry.startSpan(
			{ name: "Create Operation", op: "ui.submit" },
			async () => {
				setIsSaving(true);

				const extensionKey = ACTIVITY_EXTENSION_KEY[activityCode];
				const createData: OperationCreateRequest = {
					clientId: formData.clientId,
					activityCode,
					operationDate:
						formData.operationDate || new Date().toISOString().slice(0, 10),
					branchPostalCode: formData.branchPostalCode,
					amount: formData.amount,
					currencyCode: formData.currencyCode || "MXN",
					payments: formData.payments,
				};

				if (formData.exchangeRate) {
					createData.exchangeRate = formData.exchangeRate;
				}
				if (formData.alertTypeCode) {
					createData.alertTypeCode = formData.alertTypeCode;
				}
				if (formData.notes) {
					createData.notes = formData.notes;
				}
				if (formData.referenceNumber) {
					createData.referenceNumber = formData.referenceNumber;
				}
				if (formData.invoiceId) {
					createData.invoiceId = formData.invoiceId;
				}
				if (formData.dataSource && formData.dataSource !== "MANUAL") {
					createData.dataSource = formData.dataSource as
						| "CFDI"
						| "IMPORT"
						| "ENRICHED";
				}

				// Attach extension data if present
				if (extensionKey && Object.keys(formData.extension).length > 0) {
					(createData as unknown as Record<string, unknown>)[extensionKey] =
						formData.extension;
				}

				try {
					await executeMutation({
						mutation: () => createOperation({ input: createData }),
						loading: t("opCreatingToast"),
						success: t("opCreateSuccess"),
						onSuccess: (result) => {
							clearFormStorage();
							navigateTo(`/operations/${result.id}`);
						},
					});
				} catch (error) {
					Sentry.captureException(error);
				} finally {
					setIsSaving(false);
				}
			},
		);
	};

	const handleCancel = (): void => {
		navigateTo("/operations");
	};

	// Get activity visual info for the banner
	const activityVisual = activityCode ? getActivityVisual(activityCode) : null;

	// Get extension form component
	const ExtensionForm = activityCode ? getExtensionForm(activityCode) : null;

	// Compute live amount in MXN for threshold indicator
	const amountNum = parseFloat(formData.amount) || 0;
	const exchangeRateNum = parseFloat(formData.exchangeRate) || 1;
	const amountMxn =
		formData.currencyCode === "MXN" ? amountNum : amountNum * exchangeRateNum;

	// UMA daily value (2024 value as fallback)
	const umaValue = 108.57;

	if (isSettingsLoading) {
		return (
			<div className="space-y-6">
				<PageHero
					title={t("opNewTitle")}
					subtitle=""
					icon={FileText}
					backButton={{ label: t("back"), onClick: handleCancel }}
				/>
				<Card>
					<CardContent className="py-12 text-center text-muted-foreground">
						{t("opLoadingConfig")}
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!isConfigured || !activityCode) {
		return (
			<div className="space-y-6">
				<PageHero
					title={t("opNewTitle")}
					subtitle=""
					icon={FileText}
					backButton={{ label: t("back"), onClick: handleCancel }}
				/>
				<Card>
					<CardContent className="py-12">
						<div className="flex flex-col items-center gap-3 text-center">
							<AlertCircle className="h-10 w-10 text-muted-foreground" />
							<p className="text-lg font-medium">{t("opOrgNotConfigured")}</p>
							<p className="text-sm text-muted-foreground max-w-md">
								{t("opOrgNotConfiguredDesc")}
							</p>
							<Button variant="outline" onClick={() => navigateTo("/settings")}>
								{t("opGoToSettings")}
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHero
				title={t("opNewTitle")}
				subtitle={t("opNewSubtitleFull")}
				icon={FileText}
				backButton={{ label: t("back"), onClick: handleCancel }}
			/>

			{/* CFDI pre-fill banner */}
			{isCfdiPrefill && (
				<div className="flex items-center gap-3 rounded-lg border p-3 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
					<Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
					<p className="text-sm font-medium text-blue-800 dark:text-blue-300">
						{t("opCreatingFromCfdi")}
					</p>
				</div>
			)}

			{/* Activity banner */}
			{activityVisual && (
				<Card>
					<CardContent className="py-3">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
							<div className="flex items-center gap-3">
								<ActivityBadge
									code={activityCode}
									variant="full"
									className="text-sm"
								/>
							</div>
							<span className="text-xs text-muted-foreground whitespace-nowrap">
								{t("opActivityLabel")}
							</span>
						</div>
					</CardContent>
				</Card>
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Client & Core Info */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">{t("opOperationInfo")}</CardTitle>
						<CardDescription>{t("opOperationInfoDesc")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 @md/main:grid-cols-2 gap-4">
							{/* Client */}
							<div className="space-y-2">
								<ClientSelector
									label={t("opClient")}
									value={formData.clientId}
									placeholder={t("opClientPlaceholder")}
									searchPlaceholder={t("opSearchClient")}
									onValueChange={(value) =>
										handleFieldChange("clientId", value || "")
									}
									required
								/>
							</div>

							{/* Operation Date */}
							<div className="space-y-2">
								<FieldLabel
									tier="sat_required"
									htmlFor="operation-date"
									required
								>
									{t("opOperationDate")}
								</FieldLabel>
								<Input
									id="operation-date"
									type="date"
									value={formData.operationDate}
									onChange={(e) =>
										handleFieldChange("operationDate", e.target.value)
									}
									required
								/>
							</div>

							{/* Branch Postal Code */}
							<div className="space-y-2">
								<FieldLabel
									tier="sat_required"
									htmlFor="branch-postal-code"
									required
								>
									{t("opBranchCp")}
								</FieldLabel>
								<Input
									id="branch-postal-code"
									value={formData.branchPostalCode}
									onChange={(e) =>
										handleFieldChange("branchPostalCode", e.target.value)
									}
									placeholder="64000"
									required
								/>
							</div>

							{/* Amount (auto-calculated from payments) */}
							<div className="space-y-2">
								<FieldLabel tier="sat_required" htmlFor="amount" required>
									{t("opAmountAutoCalculated")}
								</FieldLabel>
								<Input
									id="amount"
									type="text"
									inputMode="decimal"
									value={formData.amount}
									readOnly
									className="bg-muted cursor-not-allowed"
									placeholder="0.00"
								/>
								<p className="text-xs text-muted-foreground">
									{t("opAmountHelperText")}
								</p>
							</div>

							{/* Currency */}
							<div className="space-y-2">
								<FieldLabel tier="sat_required" htmlFor="currency-code">
									{t("opCurrencyLabel")}
								</FieldLabel>
								<CatalogSelector
									catalogKey="currencies"
									value={formData.currencyCode}
									onValueChange={(val) =>
										handleFieldChange("currencyCode", val ?? "MXN")
									}
									placeholder="MXN"
								/>
							</div>

							{/* Exchange Rate */}
							{formData.currencyCode !== "MXN" && (
								<div className="space-y-2">
									<FieldLabel tier="sat_required" htmlFor="exchange-rate">
										{t("opExchangeRateLabel")}
									</FieldLabel>
									<Input
										id="exchange-rate"
										type="text"
										inputMode="decimal"
										value={formData.exchangeRate}
										onChange={(e) =>
											handleFieldChange("exchangeRate", e.target.value)
										}
										placeholder="1.00"
									/>
								</div>
							)}
						</div>

						{/* Threshold indicator */}
						{amountNum > 0 && (
							<div className="pt-2">
								<ThresholdIndicator
									code={activityCode}
									amountMxn={amountMxn}
									umaValue={umaValue}
								/>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Extension Form (activity-specific fields) */}
				{ExtensionForm && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{t("opActivitySpecificData")}
							</CardTitle>
							<CardDescription>
								{t("opFieldsRequiredFor")}{" "}
								{activityVisual?.shortLabel ?? activityCode}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ExtensionForm
								value={formData.extension}
								onChange={(val) => handleFieldChange("extension", val)}
							/>
						</CardContent>
					</Card>
				)}

				{/* Payment */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">{t("opPaymentInfo")}</CardTitle>
						<CardDescription>{t("opPaymentInfoDesc")}</CardDescription>
					</CardHeader>
					<CardContent>
						<OperationPaymentForm
							payments={formData.payments}
							onChange={(payments) => handleFieldChange("payments", payments)}
							operationCurrency={formData.currencyCode || "MXN"}
						/>
					</CardContent>
				</Card>

				{/* Optional fields */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">{t("opAdditionalInfo")}</CardTitle>
						<CardDescription>{t("opOptionalFields")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 @md/main:grid-cols-2 gap-4">
							{/* Alert Type */}
							<div className="space-y-2">
								<FieldLabel tier="alert_required" htmlFor="alert-type-code">
									{t("opAlertType")}
								</FieldLabel>
								<CatalogSelector
									catalogKey="pld-alert-types"
									value={formData.alertTypeCode}
									onValueChange={(val) =>
										handleFieldChange("alertTypeCode", val ?? "")
									}
									placeholder={t("selectPlaceholder")}
									vaCode={activityCode ?? undefined}
									excludeAutomatable={true}
									getOptionValue={getCatalogCode}
								/>
							</div>

							{/* Reference Number */}
							<div className="space-y-2">
								<FieldLabel tier="kyc_optional" htmlFor="reference-number">
									{t("opReferenceNumber")}
								</FieldLabel>
								<Input
									id="reference-number"
									value={formData.referenceNumber}
									onChange={(e) =>
										handleFieldChange("referenceNumber", e.target.value)
									}
									placeholder={t("opInternalRef")}
								/>
							</div>
						</div>

						{/* Notes */}
						<div className="space-y-2">
							<FieldLabel tier="kyc_optional" htmlFor="notes">
								{t("opNotes")}
							</FieldLabel>
							<Textarea
								id="notes"
								value={formData.notes}
								onChange={(e) => handleFieldChange("notes", e.target.value)}
								placeholder={t("opAdditionalNotes")}
								rows={3}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Action buttons */}
				<div className="flex justify-end gap-3">
					<Button type="button" variant="outline" onClick={handleCancel}>
						{t("cancel")}
					</Button>
					<Button type="submit" disabled={isSaving}>
						{isSaving ? (
							<>
								<span className="animate-spin mr-2">⏳</span>
								{t("opCreating")}
							</>
						) : (
							<>
								<Save className="h-4 w-4 mr-2" />
								{t("opCreateButton")}
							</>
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}

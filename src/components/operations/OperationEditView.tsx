"use client";

import type React from "react";
import { useState, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Save, FileText } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getOperationById, updateOperation } from "@/lib/api/operations";
import { executeMutation } from "@/lib/mutations";
import type {
	OperationEntity,
	OperationUpdateRequest,
	OperationPaymentInput,
} from "@/types/operation";
import { ACTIVITY_EXTENSION_KEY, getExtensionData } from "@/types/operation";
import { getExtensionForm } from "@/components/operations/extensions";
import { OperationPaymentForm } from "./OperationPaymentForm";
import { ActivityBadge } from "./ActivityBadge";
import { ThresholdIndicator } from "./ThresholdIndicator";
import { getActivityVisual } from "@/lib/activity-registry";
import { FieldLabel } from "@/components/completeness/FieldLabel";
import { CompletenessBanner } from "@/components/completeness/CompletenessBanner";
import { MissingFieldsList } from "@/components/completeness/MissingFieldsList";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { ClientSelector } from "@/components/clients/ClientSelector";
import type { CompletenessResult } from "@/types/completeness";
import { useLanguage } from "@/components/LanguageProvider";
import { getCatalogCode, getCurrencyCode } from "@/lib/catalog-utils";

interface OperationEditViewProps {
	operationId: string;
}

/**
 * Skeleton component for OperationEditView
 */
export function OperationEditSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<PageHeroSkeleton
				showStats={false}
				showBackButton={true}
				actionCount={2}
			/>
			<div className="space-y-6">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 @md/main:grid-cols-2 gap-4">
								{[1, 2, 3, 4].map((j) => (
									<div key={j} className="space-y-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-10 w-full" />
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

export function OperationEditView({
	operationId,
}: OperationEditViewProps): React.JSX.Element {
	const { t } = useLanguage();
	const { navigateTo } = useOrgNavigation();

	const DATA_SOURCE_LABELS: Record<string, string> = {
		MANUAL: t("opDataSourceManual"),
		CFDI: t("opDataSourceCfdi"),
		IMPORT: t("opDataSourceImport"),
		ENRICHED: t("opDataSourceEnriched"),
	};

	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [operation, setOperation] = useState<OperationEntity | null>(null);

	// Form state
	const [operationDate, setOperationDate] = useState("");
	const [branchPostalCode, setBranchPostalCode] = useState("");
	const [amount, setAmount] = useState("");
	const [currencyCode, setCurrencyCode] = useState("MXN");
	const [exchangeRate, setExchangeRate] = useState("");
	const [alertTypeCode, setAlertTypeCode] = useState("");
	const [notes, setNotes] = useState("");
	const [referenceNumber, setReferenceNumber] = useState("");
	const [payments, setPayments] = useState<OperationPaymentInput[]>([]);
	const [extension, setExtension] = useState<Record<string, unknown>>({});

	// Fetch operation
	useEffect(() => {
		const fetchOperation = async () => {
			try {
				setIsLoading(true);
				const data = await getOperationById({ id: operationId });
				setOperation(data);

				// Populate form
				setOperationDate(
					data.operationDate?.split("T")[0] || data.operationDate,
				);
				setBranchPostalCode(data.branchPostalCode);
				setAmount(data.amount);
				setCurrencyCode(data.currencyCode);
				setExchangeRate(data.exchangeRate || "");
				setAlertTypeCode(data.alertTypeCode || "");
				setNotes(data.notes || "");
				setReferenceNumber(data.referenceNumber || "");
				setPayments(
					data.payments.map((p) => ({
						paymentDate: p.paymentDate?.split("T")[0] || p.paymentDate,
						paymentFormCode: p.paymentFormCode,
						monetaryInstrumentCode: p.monetaryInstrumentCode,
						currencyCode: p.currencyCode,
						amount: p.amount,
						exchangeRate: p.exchangeRate ?? undefined,
						bankName: p.bankName,
						accountNumberMasked: p.accountNumberMasked,
						checkNumber: p.checkNumber,
						reference: p.reference,
					})),
				);

				// Load extension data
				const extData = getExtensionData(data);
				if (extData) {
					// Remove id and operationId from the extension data for the form
					const {
						id,
						operationId: _opId,
						...rest
					} = extData as Record<string, unknown>;
					setExtension(rest);
				}
			} catch (error) {
				console.error("Error fetching operation:", error);
				toast.error(t("opLoadError"));
				navigateTo("/operations");
			} finally {
				setIsLoading(false);
			}
		};
		fetchOperation();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [operationId]);

	// Auto-calculate operation amount from the sum of payment amounts (with exchange rate conversion)
	useEffect(() => {
		const opCurrency = currencyCode || "MXN";

		const total = payments.reduce((sum, payment) => {
			const amt = parseFloat(payment.amount) || 0;
			const payCurrency = payment.currencyCode || "MXN";

			if (payCurrency === opCurrency) {
				return sum + amt;
			}

			const rate = parseFloat(payment.exchangeRate || "0");
			return sum + amt * rate;
		}, 0);

		setAmount(total > 0 ? total.toFixed(2) : "");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		// eslint-disable-next-line react-hooks/exhaustive-deps
		payments
			.map((p) => `${p.amount}|${p.currencyCode}|${p.exchangeRate}`)
			.join(","),
		currencyCode,
	]);

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();

		if (!operation) return;

		await Sentry.startSpan(
			{
				name: "Update Operation",
				op: "ui.submit",
				attributes: { operationId },
			},
			async () => {
				setIsSaving(true);

				const extensionKey = ACTIVITY_EXTENSION_KEY[operation.activityCode];
				const updateData: OperationUpdateRequest = {
					operationDate: operationDate || new Date().toISOString().slice(0, 10),
					branchPostalCode,
					amount,
					currencyCode: currencyCode || "MXN",
					payments,
				};

				if (exchangeRate) updateData.exchangeRate = exchangeRate;
				if (alertTypeCode) updateData.alertTypeCode = alertTypeCode;
				if (notes) updateData.notes = notes;
				if (referenceNumber) updateData.referenceNumber = referenceNumber;

				// Attach extension data
				if (extensionKey && Object.keys(extension).length > 0) {
					(updateData as unknown as Record<string, unknown>)[extensionKey] =
						extension;
				}

				try {
					await executeMutation({
						mutation: () =>
							updateOperation({ id: operationId, input: updateData }),
						loading: t("opUpdatingToast"),
						success: t("opUpdateSuccess"),
						onSuccess: () => {
							navigateTo(`/operations/${operationId}`);
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
		navigateTo(`/operations/${operationId}`);
	};

	if (isLoading || !operation) {
		return <OperationEditSkeleton />;
	}

	const activityCode = operation.activityCode;
	const activityVisual = getActivityVisual(activityCode);
	const ExtensionForm = getExtensionForm(activityCode);

	// Compute live threshold
	const amountNum = parseFloat(amount) || 0;
	const exchangeRateNum = parseFloat(exchangeRate) || 1;
	const amountMxn =
		currencyCode === "MXN" ? amountNum : amountNum * exchangeRateNum;
	// UMA daily value (2024 value as fallback)
	const umaValue = 108.57;

	// Build a simple completeness result from the operation data
	const completenessResult: CompletenessResult | null =
		operation.completenessStatus
			? {
					satReady: operation.completenessStatus === "COMPLETE",
					alertReady:
						operation.completenessStatus === "COMPLETE" ||
						operation.completenessStatus === "MINIMUM",
					fullyEnriched: operation.completenessStatus === "COMPLETE",
					missing: (operation.missingFields || []).map((f) => ({
						field: {
							fieldPath: f,
							tier: "sat_required" as const,
							label: f,
						},
						value: undefined,
					})),
					summary: {
						red: {
							total: (operation.missingFields || []).length + 1,
							filled:
								operation.completenessStatus === "COMPLETE"
									? (operation.missingFields || []).length + 1
									: 1,
							missing:
								operation.completenessStatus === "COMPLETE"
									? 0
									: (operation.missingFields || []).length,
						},
						yellow: { total: 0, filled: 0, missing: 0 },
						grey: { total: 0, filled: 0, missing: 0 },
						total: (operation.missingFields || []).length + 1,
						filled:
							operation.completenessStatus === "COMPLETE"
								? (operation.missingFields || []).length + 1
								: 1,
					},
				}
			: null;

	return (
		<div className="space-y-6">
			<PageHero
				title={t("opEditTitle")}
				subtitle={operationId}
				icon={FileText}
				backButton={{ label: t("back"), onClick: handleCancel }}
			/>

			{/* Data source badge */}
			<div className="flex items-center gap-2">
				<Badge variant="outline">
					{DATA_SOURCE_LABELS[operation.dataSource] || operation.dataSource}
				</Badge>
				<ActivityBadge code={activityCode} variant="full" />
			</div>

			{/* Completeness banner */}
			{completenessResult && <CompletenessBanner result={completenessResult} />}

			{/* Missing fields list */}
			{completenessResult && completenessResult.missing.length > 0 && (
				<MissingFieldsList result={completenessResult} />
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Core fields */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">{t("opOperationInfo")}</CardTitle>
						<CardDescription>{t("opOperationInfoDesc")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 @md/main:grid-cols-2 gap-4">
							{/* Client (read-only in edit) */}
							<div className="space-y-2">
								<ClientSelector
									label={t("opClient")}
									value={operation.clientId}
									disabled
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
									value={operationDate}
									onChange={(e) => setOperationDate(e.target.value)}
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
									value={branchPostalCode}
									onChange={(e) => setBranchPostalCode(e.target.value)}
									placeholder="64000"
									required
								/>
							</div>

							{/* Exchange Rate - only shown when currency is not MXN */}
							{currencyCode !== "MXN" && (
								<div className="space-y-2">
									<FieldLabel tier="sat_required" htmlFor="exchange-rate">
										{t("opExchangeRateLabel")}
									</FieldLabel>
									<Input
										id="exchange-rate"
										type="text"
										inputMode="decimal"
										value={exchangeRate}
										onChange={(e) => setExchangeRate(e.target.value)}
										placeholder="1.00"
									/>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Extension form */}
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
							<ExtensionForm value={extension} onChange={setExtension} />
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
							payments={payments}
							onChange={setPayments}
							operationCurrency={currencyCode || "MXN"}
							onCurrencyChange={setCurrencyCode}
							activityCode={activityCode}
							amountMxn={amountMxn}
							umaValue={umaValue}
							showCurrencySelector={true}
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
							<div className="space-y-2">
								<FieldLabel tier="alert_required" htmlFor="alert-type-code">
									{t("opAlertType")}
								</FieldLabel>
								<CatalogSelector
									catalogKey="pld-alert-types"
									value={alertTypeCode}
									onValueChange={(val) => setAlertTypeCode(val ?? "")}
									placeholder={t("selectPlaceholder")}
									vaCode={operation.activityCode}
									excludeAutomatable={true}
									getOptionValue={getCatalogCode}
								/>
							</div>

							<div className="space-y-2">
								<FieldLabel tier="kyc_optional" htmlFor="reference-number">
									{t("opReferenceNumber")}
								</FieldLabel>
								<Input
									id="reference-number"
									value={referenceNumber}
									onChange={(e) => setReferenceNumber(e.target.value)}
									placeholder={t("opInternalRef")}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<FieldLabel tier="kyc_optional" htmlFor="notes">
								{t("opNotes")}
							</FieldLabel>
							<Textarea
								id="notes"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder={t("opAdditionalNotes")}
								rows={3}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Action buttons */}
				<div className="space-y-3">
					<div className="flex justify-end gap-3">
						<Button type="button" variant="outline" onClick={handleCancel}>
							{t("cancel")}
						</Button>
						<Button type="submit" disabled={isSaving}>
							{isSaving ? (
								<>
									<span className="animate-spin mr-2">⏳</span>
									{t("opSaving")}
								</>
							) : (
								<>
									<Save className="h-4 w-4 mr-2" />
									{t("opSaveButton")}
								</>
							)}
						</Button>
					</div>
					{/* Threshold indicator below submit button */}
					{amountNum > 0 && activityCode && (
						<div className="flex justify-end">
							<ThresholdIndicator
								code={activityCode}
								amountMxn={amountMxn}
								umaValue={umaValue}
							/>
						</div>
					)}
				</div>
			</form>
		</div>
	);
}

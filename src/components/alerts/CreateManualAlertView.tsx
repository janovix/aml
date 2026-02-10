"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Save, Bell, User, FileWarning } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { useJwt } from "@/hooks/useJwt";
import {
	createManualAlert,
	type AlertRule,
	type AlertSeverity,
} from "@/lib/api/alerts";
import { ClientSelector } from "@/components/clients/ClientSelector";
import { AlertRuleSelector } from "./AlertRuleSelector";
import { LabelWithInfo } from "@/components/ui/LabelWithInfo";
import type { Client } from "@/types/client";
import { executeMutation } from "@/lib/mutations";
import { useLanguage } from "@/components/LanguageProvider";
import type { TranslationKeys } from "@/lib/translations";

interface ManualAlertFormData {
	alertRuleId: string;
	clientId: string;
	severity: AlertSeverity | "";
	notes: string;
	transactionId?: string;
}

const severityOptions: {
	value: AlertSeverity;
	labelKey: TranslationKeys;
	descriptionKey: TranslationKeys;
}[] = [
	{
		value: "LOW",
		labelKey: "alertSeverityLow",
		descriptionKey: "alertSeverityLowDesc",
	},
	{
		value: "MEDIUM",
		labelKey: "alertSeverityMedium",
		descriptionKey: "alertSeverityMediumDesc",
	},
	{
		value: "HIGH",
		labelKey: "alertSeverityHigh",
		descriptionKey: "alertSeverityHighDesc",
	},
	{
		value: "CRITICAL",
		labelKey: "alertSeverityCritical",
		descriptionKey: "alertSeverityCriticalDesc",
	},
];

export function CreateManualAlertView(): React.JSX.Element {
	const { navigateTo, orgPath } = useOrgNavigation();
	const searchParams = useSearchParams();
	const { jwt } = useJwt();
	const { t } = useLanguage();
	const [isSaving, setIsSaving] = useState(false);
	const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
	const [selectedClient, setSelectedClient] = useState<Client | null>(null);

	const [formData, setFormData] = useState<ManualAlertFormData>({
		alertRuleId: "",
		clientId: "",
		severity: "",
		notes: "",
		transactionId: undefined,
	});

	// Auto-select client from URL params (after returning from client creation)
	useEffect(() => {
		const clientIdFromUrl = searchParams.get("clientId");
		if (clientIdFromUrl && !formData.clientId) {
			setFormData((prev) => ({ ...prev, clientId: clientIdFromUrl }));
		}

		const alertRuleIdFromUrl = searchParams.get("alertRuleId");
		if (alertRuleIdFromUrl && !formData.alertRuleId) {
			setFormData((prev) => ({ ...prev, alertRuleId: alertRuleIdFromUrl }));
		}
	}, [searchParams, formData.clientId, formData.alertRuleId]);

	// Auto-populate severity from selected rule
	useEffect(() => {
		if (selectedRule && !formData.severity) {
			setFormData((prev) => ({ ...prev, severity: selectedRule.severity }));
		}
	}, [selectedRule, formData.severity]);

	const handleAlertRuleChange = (rule: AlertRule | null) => {
		setSelectedRule(rule);
		setFormData((prev) => ({
			...prev,
			alertRuleId: rule?.id ?? "",
			// Auto-populate severity if not already set
			severity: prev.severity || (rule?.severity ?? ""),
		}));
	};

	const handleClientChange = (client: Client | null) => {
		setSelectedClient(client);
		setFormData((prev) => ({
			...prev,
			clientId: client?.id ?? "",
		}));
	};

	const handleCreateNewClient = () => {
		// Navigate to client creation, preserving current state in URL
		const returnUrl = encodeURIComponent(
			`${orgPath("/alerts/new")}?alertRuleId=${formData.alertRuleId}`,
		);
		navigateTo(`/clients/new?returnUrl=${returnUrl}`);
	};

	const canSubmit = useMemo(() => {
		return (
			formData.alertRuleId &&
			formData.clientId &&
			formData.severity &&
			!isSaving
		);
	}, [formData.alertRuleId, formData.clientId, formData.severity, isSaving]);

	const generateIdempotencyKey = (): string => {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 10);
		return `manual_${formData.alertRuleId}_${formData.clientId}_${timestamp}_${random}`;
	};

	const generateContextHash = (): string => {
		const context = {
			alertRuleId: formData.alertRuleId,
			clientId: formData.clientId,
			timestamp: new Date().toISOString().slice(0, 10), // Date only for daily uniqueness
		};
		return btoa(JSON.stringify(context)).slice(0, 64);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!canSubmit || !jwt) {
			return;
		}

		setIsSaving(true);

		const idempotencyKey = generateIdempotencyKey();
		const contextHash = generateContextHash();

		const metadata: Record<string, unknown> = {
			createdBy: "manual",
			notes: formData.notes || undefined,
			alertRuleName: selectedRule?.name,
			clientName: selectedClient?.firstName
				? `${selectedClient.firstName} ${selectedClient.lastName ?? ""}`.trim()
				: (selectedClient?.businessName ?? selectedClient?.rfc),
		};

		if (formData.transactionId) {
			metadata.transactionId = formData.transactionId;
		}

		try {
			await executeMutation({
				mutation: () =>
					createManualAlert({
						alertRuleId: formData.alertRuleId,
						clientId: formData.clientId,
						severity: formData.severity as AlertSeverity,
						idempotencyKey,
						contextHash,
						metadata,
						transactionId: formData.transactionId || undefined,
						notes: formData.notes || undefined,
						jwt,
					}),
				loading: t("alertCreating"),
				success: t("alertCreatedSuccess"),
				error: (err: unknown) => {
					const error = err as Error;
					if (
						error.message?.includes("409") ||
						error.message?.includes("duplicate")
					) {
						return t("alertDuplicateError");
					}
					return `${t("alertCreateError")}: ${error.message || t("errorGeneric")}`;
				},
				onSuccess: (data) => {
					navigateTo(`/alerts/${data.id}`);
				},
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			<PageHero
				title={t("alertNewManual")}
				subtitle={t("alertNewManualSubtitle")}
				icon={AlertTriangle}
			/>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Main Form Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Bell className="h-5 w-5" />
							{t("alertInfo")}
						</CardTitle>
						<CardDescription>{t("alertInfoDesc")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Alert Rule Selection */}
						<div className="space-y-2">
							<AlertRuleSelector
								label={t("alertRule")}
								value={formData.alertRuleId}
								onChange={handleAlertRuleChange}
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, alertRuleId: value ?? "" }))
								}
								required
								helperText={t("alertRuleHelper")}
							/>
						</div>

						{/* Selected Rule Details */}
						{selectedRule && (
							<div className="rounded-lg border bg-muted/50 p-4 space-y-2">
								<div className="flex items-center gap-2">
									<FileWarning className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm font-medium">
										{t("alertCode")} {selectedRule.id}
									</span>
									<span
										className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
											selectedRule.severity === "CRITICAL"
												? "bg-red-500/20 text-red-400"
												: selectedRule.severity === "HIGH"
													? "bg-orange-500/20 text-orange-400"
													: selectedRule.severity === "MEDIUM"
														? "bg-amber-500/20 text-amber-400"
														: "bg-zinc-500/20 text-zinc-400"
										}`}
									>
										{t(
											severityOptions.find(
												(s) => s.value === selectedRule.severity,
											)?.labelKey ?? "alertSeverityLow",
										)}
									</span>
								</div>
								<p className="text-sm text-muted-foreground">
									{selectedRule.name}
								</p>
								{selectedRule.description && (
									<p className="text-xs text-muted-foreground/70">
										{selectedRule.description}
									</p>
								)}
							</div>
						)}

						<Separator />

						{/* Client Selection */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<User className="h-4 w-4 text-muted-foreground" />
								<Label className="text-sm font-medium">
									{t("alertAffectedClient")}
								</Label>
							</div>
							<ClientSelector
								value={formData.clientId}
								onChange={handleClientChange}
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, clientId: value ?? "" }))
								}
								required
								onCreateNew={handleCreateNewClient}
								helperText={t("alertClientHelper")}
							/>
						</div>

						<Separator />

						{/* Severity Override */}
						<div className="space-y-2">
							<LabelWithInfo description={t("alertSeverityHelper")} required>
								{t("alertSeverity")}
							</LabelWithInfo>
							<Select
								value={formData.severity}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										severity: value as AlertSeverity,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder={t("alertSelectSeverity")} />
								</SelectTrigger>
								<SelectContent>
									{severityOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											<div className="flex flex-col">
												<span>{t(option.labelKey)}</span>
												<span className="text-xs text-muted-foreground">
													{t(option.descriptionKey)}
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Notes */}
						<div className="space-y-2">
							<LabelWithInfo description={t("alertNotesHelper")}>
								{t("alertNotes")}
							</LabelWithInfo>
							<Textarea
								value={formData.notes}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, notes: e.target.value }))
								}
								placeholder={t("alertNotesPlaceholder")}
								rows={4}
								maxLength={1000}
							/>
							<p className="text-xs text-muted-foreground text-right">
								{formData.notes.length}/1000 {t("alertCharactersCount")}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Action Buttons */}
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigateTo("/alerts")}
						disabled={isSaving}
					>
						{t("cancel")}
					</Button>
					<Button type="submit" disabled={!canSubmit} className="gap-2">
						<Save className="h-4 w-4" />
						{isSaving ? t("alertCreating") : t("alertCreateButton")}
					</Button>
				</div>
			</form>
		</div>
	);
}

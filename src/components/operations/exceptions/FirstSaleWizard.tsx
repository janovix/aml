"use client";

import { useState, useCallback, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { toast } from "sonner";
import { getCatalogCode } from "@/lib/catalog-utils";
import {
	getException,
	upsertException,
	type ExceptionUpsertInput,
} from "@/lib/api/operation-exceptions";
import type { OperationExceptionEntity } from "@/types/operation";
import { TrafficLightBadge } from "./TrafficLightBadge";
import { EvidenceUploader } from "./EvidenceUploader";

interface FirstSaleWizardProps {
	operationId: string;
	disabled?: boolean;
}

export function FirstSaleWizard({
	operationId,
	disabled,
}: FirstSaleWizardProps) {
	const { t } = useLanguage();
	const [exception, setException] = useState<OperationExceptionEntity | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [isFirstSale, setIsFirstSale] = useState<boolean | null>(null);
	const [hasBankFunding, setHasBankFunding] = useState<boolean | null>(null);
	const [bankCode, setBankCode] = useState("");
	const [bankName, setBankName] = useState("");
	const [paidFinancial, setPaidFinancial] = useState<boolean | null>(null);
	const [hasEvidence, setHasEvidence] = useState<boolean | null>(null);
	const [notes, setNotes] = useState("");

	const loadException = useCallback(async () => {
		try {
			setLoading(true);
			const data = await getException(operationId);
			setException(data);
			if (data) {
				setIsFirstSale(data.isFirstSale);
				setHasBankFunding(data.hasDevelopmentBankFunding);
				setBankCode(data.developmentBankCode ?? "");
				setBankName(data.developmentBankName ?? "");
				setPaidFinancial(data.paidThroughFinancialSystem);
				setHasEvidence(data.hasDocumentaryEvidence);
				setNotes(data.notes ?? "");
			}
		} catch {
			toast.error("Failed to load exception data");
		} finally {
			setLoading(false);
		}
	}, [operationId]);

	useEffect(() => {
		loadException();
	}, [loadException]);

	const handleSave = async () => {
		setSaving(true);
		try {
			const input: ExceptionUpsertInput = {
				exceptionType: "FIRST_SALE_REAL_ESTATE",
				isFirstSale,
				hasDevelopmentBankFunding: hasBankFunding,
				developmentBankCode: hasBankFunding ? bankCode || null : null,
				developmentBankName: hasBankFunding ? bankName || null : null,
				paidThroughFinancialSystem: paidFinancial,
				hasDocumentaryEvidence: hasEvidence,
				notes: notes || null,
			};
			const result = await upsertException(operationId, input);
			setException(result);
			toast.success("Cuestionario guardado");
		} catch {
			toast.error("Error al guardar el cuestionario");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="text-lg">
							{t("opPrimeraVentaHint").split(".")[0]}
						</CardTitle>
						<CardDescription>
							Art. 27 Bis, Frac. III, Reglas de Carácter General LFPIORPI
						</CardDescription>
					</div>
					{exception && <TrafficLightBadge status={exception.status} />}
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				<BooleanQuestion
					label={t("opExceptionQuestionIsFirstSale")}
					value={isFirstSale}
					onChange={setIsFirstSale}
					disabled={disabled}
				/>

				<BooleanQuestion
					label={t("opExceptionQuestionHasBankFunding")}
					value={hasBankFunding}
					onChange={setHasBankFunding}
					disabled={disabled}
				/>

				{hasBankFunding && (
					<div className="ml-6 space-y-3 border-l-2 border-muted pl-4">
						<div className="space-y-1">
							<Label>{t("opExceptionBankSelector")}</Label>
							<CatalogSelector
								catalogKey="pld-public-housing-orgs"
								value={bankCode}
								onValueChange={(val) => setBankCode(val ?? "")}
								placeholder={t("selectPlaceholder")}
								disabled={disabled}
								getOptionValue={getCatalogCode}
							/>
						</div>
						<div className="space-y-1">
							<Label>{t("opExceptionBankNameLabel")}</Label>
							<Input
								value={bankName}
								onChange={(e) => setBankName(e.target.value)}
								disabled={disabled}
							/>
						</div>
					</div>
				)}

				<BooleanQuestion
					label={t("opExceptionQuestionPaidFinancial")}
					value={paidFinancial}
					onChange={setPaidFinancial}
					disabled={disabled}
				/>

				<BooleanQuestion
					label={t("opExceptionQuestionHasEvidence")}
					value={hasEvidence}
					onChange={setHasEvidence}
					disabled={disabled}
				/>

				<div className="space-y-1">
					<Label>{t("opExceptionNotes")}</Label>
					<Textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						disabled={disabled}
						rows={3}
					/>
				</div>

				<Button onClick={handleSave} disabled={disabled || saving}>
					{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					{saving ? t("loading") : t("save")}
				</Button>

				{exception && (
					<EvidenceUploader
						operationId={operationId}
						evidence={exception.evidence}
						onUpdate={loadException}
						disabled={disabled}
					/>
				)}
			</CardContent>
		</Card>
	);
}

function BooleanQuestion({
	label,
	value,
	onChange,
	disabled,
}: {
	label: string;
	value: boolean | null;
	onChange: (val: boolean) => void;
	disabled?: boolean;
}) {
	const { t } = useLanguage();
	const stringValue = value === true ? "yes" : value === false ? "no" : "";

	return (
		<div className="space-y-2">
			<Label className="text-sm font-medium">{label}</Label>
			<RadioGroup
				value={stringValue}
				onValueChange={(v) => onChange(v === "yes")}
				className="flex gap-4"
				disabled={disabled}
			>
				<div className="flex items-center space-x-2">
					<RadioGroupItem value="yes" id={`${label}-yes`} />
					<Label htmlFor={`${label}-yes`}>{t("yes")}</Label>
				</div>
				<div className="flex items-center space-x-2">
					<RadioGroupItem value="no" id={`${label}-no`} />
					<Label htmlFor={`${label}-no`}>{t("no")}</Label>
				</div>
			</RadioGroup>
		</div>
	);
}

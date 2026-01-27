"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useLanguage } from "@/components/LanguageProvider";
import { PageHero } from "@/components/page-hero";
import { UserPlus } from "lucide-react";
import type { PersonType, Client } from "@/types/client";
import { WizardStepper } from "./WizardStepper";
import { ClientInfoStep } from "./ClientInfoStep";
import { DocumentsStep } from "./DocumentsStep";

interface WizardState {
	currentStep: 1 | 2;
	clientId: string | null;
	personType: PersonType;
	client: Client | null;
}

const INITIAL_STATE: WizardState = {
	currentStep: 1,
	clientId: null,
	personType: "moral",
	client: null,
};

export function ClientCreateWizard(): React.JSX.Element {
	const { t } = useLanguage();
	const { navigateTo } = useOrgNavigation();
	const searchParams = useSearchParams();
	const returnUrl = searchParams.get("returnUrl");

	const [wizardState, setWizardState] = useState<WizardState>(INITIAL_STATE);

	const getSteps = useCallback(() => {
		const baseSteps = [
			{
				id: 1,
				title: "Información del Cliente",
				description: "Datos básicos",
			},
			{
				id: 2,
				title:
					wizardState.personType === "physical"
						? "Documentos KYC"
						: "Documentos y Beneficiarios",
				description: "Expediente",
			},
		];
		return baseSteps;
	}, [wizardState.personType]);

	const handleClientCreated = useCallback((client: Client) => {
		setWizardState((prev) => ({
			...prev,
			currentStep: 2,
			clientId: client.id,
			personType: client.personType,
			client,
		}));
	}, []);

	const handlePersonTypeChange = useCallback((personType: PersonType) => {
		setWizardState((prev) => ({
			...prev,
			personType,
		}));
	}, []);

	const handleComplete = useCallback(() => {
		if (returnUrl) {
			const separator = returnUrl.includes("?") ? "&" : "?";
			navigateTo(
				`${returnUrl}${separator}clientId=${wizardState.clientId}`.replace(
					/^\/[^/]+/,
					"",
				),
			);
		} else if (wizardState.clientId) {
			navigateTo(`/clients/${wizardState.clientId}`);
		} else {
			navigateTo("/clients");
		}
	}, [navigateTo, returnUrl, wizardState.clientId]);

	const handleCancel = useCallback(() => {
		if (returnUrl) {
			navigateTo(returnUrl.replace(/^\/[^/]+/, ""));
		} else {
			navigateTo("/clients");
		}
	}, [navigateTo, returnUrl]);

	const handleSkipDocuments = useCallback(() => {
		// Allow skipping documents step - go directly to client details
		handleComplete();
	}, [handleComplete]);

	return (
		<div className="space-y-6 pb-24 md:pb-20">
			<PageHero
				title={t("clientNewTitle")}
				subtitle={
					wizardState.currentStep === 1
						? t("clientNewSubtitle")
						: "Agrega los documentos requeridos para completar el expediente KYC"
				}
				icon={UserPlus}
				backButton={{
					label: t("back"),
					onClick: handleCancel,
				}}
			/>

			{/* Wizard Stepper */}
			<div className="max-w-2xl mx-auto px-4">
				<WizardStepper
					steps={getSteps()}
					currentStep={wizardState.currentStep}
				/>
			</div>

			{/* Step Content */}
			<div className="max-w-4xl">
				{wizardState.currentStep === 1 && (
					<ClientInfoStep
						onClientCreated={handleClientCreated}
						onCancel={handleCancel}
						onPersonTypeChange={handlePersonTypeChange}
						initialPersonType={wizardState.personType}
					/>
				)}

				{wizardState.currentStep === 2 &&
					wizardState.clientId &&
					wizardState.client && (
						<DocumentsStep
							clientId={wizardState.clientId}
							client={wizardState.client}
							personType={wizardState.personType}
							onComplete={handleComplete}
							onSkip={handleSkipDocuments}
						/>
					)}
			</div>
		</div>
	);
}

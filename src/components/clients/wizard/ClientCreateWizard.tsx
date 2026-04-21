"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
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
				title: t("clientWizardStep1Title"),
				description: t("clientWizardStep1Description"),
			},
			{
				id: 2,
				title:
					wizardState.personType === "physical"
						? t("clientWizardStep2TitlePhysical")
						: t("clientWizardStep2TitleMoral"),
				description: t("clientWizardStep2Description"),
			},
		];
		return baseSteps;
	}, [wizardState.personType, t]);

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

	const handleStepBack = useCallback(() => {
		setWizardState((prev) => ({ ...prev, currentStep: 1 }));
	}, []);

	// Scroll to top when transitioning to step 2 (pathname doesn't change, so
	// ScrollRestoration doesn't run; browser preserves scroll from step 1)
	useEffect(() => {
		if (wizardState.currentStep === 2) {
			const main = document.querySelector("main.overflow-y-auto");
			const container = main || window;
			requestAnimationFrame(() => {
				if (container instanceof Window) {
					container.scrollTo(0, 0);
				} else {
					container.scrollTop = 0;
				}
			});
		}
	}, [wizardState.currentStep]);

	return (
		<div className="space-y-6 pb-24 md:pb-20">
			<PageHero
				title={t("clientNewTitle")}
				subtitle={
					wizardState.currentStep === 1
						? t("clientNewSubtitle")
						: t("clientWizardStep2Subtitle")
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
							onBack={handleStepBack}
						/>
					)}
			</div>
		</div>
	);
}

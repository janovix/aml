"use client";

import { useState, useEffect } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Edit,
	Flag,
	FileText,
	Building2,
	MapPin,
	Phone,
	Mail,
	Calendar,
	User,
	Hash,
	AlertTriangle,
	CheckCircle2,
	Users,
	Briefcase,
	Shield,
	ExternalLink,
	Pencil,
	ZoomIn,
} from "lucide-react";
import type { Client } from "../../types/client";
import type { Gender, MaritalStatus } from "../../types/client";
import { getClientDisplayName } from "../../types/client";
import { getClientById } from "../../lib/api/clients";
import { listClientDocuments } from "../../lib/api/client-documents";
import { listClientUBOs } from "../../lib/api/ubos";
import type {
	ClientDocument,
	ClientDocumentType,
} from "../../types/client-document";
import type { UBO } from "../../types/ubo";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/mutations";
import { showFetchError } from "@/lib/toast-utils";
import { PageHero } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { getPersonTypeStyle } from "../../lib/person-type-icon";
import { useStatesCatalog } from "@/hooks/useStatesCatalog";
import { useLanguage } from "@/components/LanguageProvider";
import type { TranslationKeys } from "@/lib/translations";
import { CircularProgress } from "@/components/ui/circular-progress";
import { calculateKYCStatus, type KYCSectionStatus } from "@/lib/kyc-status";
import { cn } from "@/lib/utils";
import { DocSvcImage } from "@/components/DocSvcImage";
import {
	DocumentViewerDialog,
	type DocumentImage,
} from "./DocumentViewerDialog";
import { UploadedIDDocumentCard } from "./UploadedIDDocumentCard";
import {
	getDocumentLabel,
	ALL_REQUIRED_DOCUMENTS,
	ID_DOCUMENT_TYPES,
	requiresUBOs,
} from "@/lib/constants";
import { useOrgStore } from "@/lib/org-store";
import { CompletenessBanner } from "@/components/completeness";
import {
	computeCompleteness,
	getClientFieldTierMap,
} from "@/lib/field-requirements";
import type { FieldTier } from "@/types/completeness";
import { TIER_COLORS } from "@/types/completeness";
import { useOrgSettings } from "@/hooks/useOrgSettings";

interface ClientDetailsViewProps {
	clientId: string;
}

/**
 * Skeleton component for ClientDetailsView
 */
export function ClientDetailsSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<PageHeroSkeleton
				showStats={false}
				showBackButton={true}
				actionCount={3}
			/>
			<div className="space-y-6">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 @xl/main:grid-cols-2 gap-6">
								{[1, 2].map((j) => (
									<div key={j} className="space-y-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-5 w-40" />
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

/**
 * Gender display labels
 */
const GENDER_LABELS: Record<Gender, TranslationKeys> = {
	M: "clientGenderMale",
	F: "clientGenderFemale",
	OTHER: "clientGenderOther",
};

/**
 * Marital status display labels
 */
const MARITAL_STATUS_LABELS: Record<MaritalStatus, TranslationKeys> = {
	SINGLE: "clientMaritalSingle",
	MARRIED: "clientMaritalMarried",
	DIVORCED: "clientMaritalDivorced",
	WIDOWED: "clientMaritalWidowed",
	OTHER: "clientGenderOther",
};

/**
 * Field display component with missing indicator and optional tier dot
 */
function FieldDisplay({
	label,
	value,
	icon: Icon,
	isMissing,
	tier,
}: {
	label: string;
	value?: string | null;
	icon?: React.ElementType;
	isMissing?: boolean;
	tier?: FieldTier;
}) {
	const { t } = useLanguage();
	const missingIconColor = tier ? TIER_COLORS[tier].text : "text-amber-500";

	return (
		<div>
			<dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
				{tier && (
					<span
						className={cn(
							"h-2 w-2 rounded-full shrink-0",
							TIER_COLORS[tier].dot,
						)}
						aria-hidden="true"
					/>
				)}
				{Icon && <Icon className="h-4 w-4" />}
				{label}
			</dt>
			<dd
				className={cn("text-base", isMissing && "text-muted-foreground italic")}
			>
				{value || t("commonNotSpecified")}
				{isMissing && (
					<AlertTriangle
						className={cn("h-4 w-4 inline ml-2", missingIconColor)}
					/>
				)}
			</dd>
		</div>
	);
}

export function ClientDetailsView({
	clientId,
}: ClientDetailsViewProps): React.JSX.Element {
	const { navigateTo } = useOrgNavigation();
	const { t } = useLanguage();
	const { getStateName } = useStatesCatalog();
	const { currentOrg } = useOrgStore();
	const { activityCode } = useOrgSettings();
	const [client, setClient] = useState<Client | null>(null);
	const [documents, setDocuments] = useState<ClientDocument[]>([]);
	const [ubos, setUbos] = useState<UBO[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [openAccordions, setOpenAccordions] = useState<string[]>([]);

	// Document viewer dialog state
	const [documentViewer, setDocumentViewer] = useState<{
		open: boolean;
		images: DocumentImage[];
		initialIndex: number;
		originalFileUrl?: string | null;
	}>({
		open: false,
		images: [],
		initialIndex: 0,
		originalFileUrl: null,
	});

	// Fetch all data
	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				const [clientData, docsData, ubosData] = await Promise.all([
					getClientById({ id: clientId }),
					listClientDocuments({ clientId }).catch(() => ({
						data: [],
						total: 0,
					})),
					listClientUBOs({ clientId }).catch(() => ({ data: [], total: 0 })),
				]);
				setClient(clientData);
				setDocuments(docsData.data);
				setUbos(ubosData.data);
			} catch (error) {
				console.error("Error fetching client data:", error);
				showFetchError("client-details", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, [clientId]);

	// Handle accordion state based on URL hash
	useEffect(() => {
		if (typeof window === "undefined") return;

		const hash = window.location.hash.slice(1);
		if (hash && !openAccordions.includes(hash)) {
			setOpenAccordions((prev) => [...prev, hash]);

			// Scroll to element after a short delay
			setTimeout(() => {
				const element = document.getElementById(hash);
				if (element) {
					element.scrollIntoView({ behavior: "smooth", block: "start" });
				}
			}, 100);
		}
	}, []);

	if (isLoading) {
		return <ClientDetailsSkeleton />;
	}

	if (!client) {
		return (
			<div className="space-y-6">
				<PageHero
					title={t("clientNotFound")}
					subtitle={`${t("clientNotExist")} (ID: ${clientId})`}
					icon={User}
					backButton={{
						label: t("clientBackToClients"),
						onClick: () => navigateTo("/clients"),
					}}
				/>
			</div>
		);
	}

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	// Calculate KYC status
	const kycStatus = calculateKYCStatus(client);
	const needsUBOs = requiresUBOs(client.personType);
	const needsIdDocument = client.personType === "physical";

	// Check documents status
	const idDocument = documents.find((d) =>
		ID_DOCUMENT_TYPES.includes(d.documentType),
	);
	const hasIdDocument = !!idDocument;
	const requiredDocTypes: ClientDocumentType[] =
		ALL_REQUIRED_DOCUMENTS[client.personType];

	const uploadedDocTypes = new Set<ClientDocumentType>(
		documents.map((d) => d.documentType),
	);
	const missingDocs = requiredDocTypes.filter((d) => !uploadedDocTypes.has(d));
	const hasAllDocs =
		(needsIdDocument ? hasIdDocument : true) && missingDocs.length === 0;

	// Check UBOs status (for moral/trust)
	const stockholders = ubos.filter((u) => u.relationshipType === "SHAREHOLDER");
	const legalRep = ubos.find((u) => u.relationshipType === "LEGAL_REP");
	const hasStockholders = stockholders.length > 0;
	const hasLegalRep = !!legalRep;
	const hasAllUBOs = needsUBOs ? hasStockholders : true; // Legal rep is optional

	// Calculate overall document/UBO completion
	const documentsComplete = hasAllDocs;
	const ubosComplete = hasAllUBOs;

	// Helper to navigate to edit with tab and anchor
	const navigateToEdit = (
		tab: "personal" | "contact" | "address" | "documents" | "ubos",
		anchor?: string,
	) => {
		const url = `/clients/${clientId}/edit?tab=${tab}${anchor ? `#${anchor}` : ""}`;
		navigateTo(url);
	};

	// Get section status with document/UBO checks
	const getSectionStatus = (sectionId: string): KYCSectionStatus | null => {
		return kycStatus.sections.find((s) => s.section.id === sectionId) || null;
	};

	const personTypeStyle = getPersonTypeStyle(client.personType);
	const PersonTypeIcon = personTypeStyle.icon;

	// Compute field-level tier map and completeness result
	const tierMap = getClientFieldTierMap(client.personType);
	const completenessResult = activityCode
		? computeCompleteness(
				activityCode,
				"client",
				client as unknown as Record<string, unknown>,
				{
					personType: client.personType,
				},
			)
		: null;

	return (
		<div className="space-y-6">
			<PageHero
				title={t("clientDetailsTitle")}
				subtitle={getClientDisplayName(client)}
				icon={client.personType === "physical" ? User : Building2}
				backButton={{
					label: t("clientBackToClients"),
					onClick: () => navigateTo("/clients"),
				}}
				actions={[
					{
						label: t("edit"),
						icon: Edit,
						onClick: () => navigateTo(`/clients/${clientId}/edit`),
					},
				]}
			/>

			{/* KYC Status Overview Card */}
			<Card>
				<CardContent className="p-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
						{/* Circular Progress */}
						<div className="flex flex-col items-center gap-2">
							<CircularProgress
								percentage={kycStatus.overallPercentage}
								size={80}
								strokeWidth={8}
							/>
							<p className="text-xs text-muted-foreground font-medium">
								{t("clientKycStatus")}
							</p>
						</div>

						{/* Status Details */}
						<div className="flex-1 space-y-3">
							<div>
								<h3 className="text-lg font-semibold mb-1">
									{kycStatus.isComplete
										? t("clientKycComplete")
										: t("clientKycIncomplete")}
								</h3>
								<p className="text-sm text-muted-foreground">
									{kycStatus.totalCompleted} {t("clientFieldsOf")}{" "}
									{kycStatus.totalRequired} {t("clientFieldsCompleted")}
								</p>
							</div>

							{/* Progress bar */}
							<div className="space-y-2">
								<Progress
									value={kycStatus.overallPercentage}
									className={cn(
										"h-2",
										kycStatus.isComplete
											? "[&>div]:bg-green-500"
											: "[&>div]:bg-yellow-500",
									)}
								/>
								<div className="flex items-center justify-between text-xs">
									<span className="text-muted-foreground">
										{kycStatus.overallPercentage}
										{t("clientPercentComplete")}
									</span>
									{!kycStatus.isComplete && (
										<Button
											variant="link"
											size="sm"
											className="h-auto p-0 text-xs"
											onClick={() => navigateToEdit("personal")}
										>
											{t("clientCompleteInfo")}
											<ExternalLink className="h-3 w-3 ml-1" />
										</Button>
									)}
								</div>
							</div>
						</div>

						{/* Person Type Badge */}
						<div
							className={`flex items-center gap-3 rounded-xl border ${personTypeStyle.borderColor} ${personTypeStyle.bgColor} p-4`}
						>
							<div
								className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${personTypeStyle.bgColor}`}
							>
								<PersonTypeIcon
									className={`h-6 w-6 ${personTypeStyle.iconColor}`}
								/>
							</div>
							<div className="min-w-0">
								<p className={`font-semibold ${personTypeStyle.iconColor}`}>
									{personTypeStyle.label}
								</p>
								<p className="text-xs text-muted-foreground">
									{personTypeStyle.description}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Completeness Banner */}
			{completenessResult && <CompletenessBanner result={completenessResult} />}

			{/* Accordion Sections */}
			<Accordion
				type="multiple"
				value={openAccordions}
				onValueChange={setOpenAccordions}
				className="space-y-3"
			>
				{/* Personal/Company Information */}
				<AccordionItem
					value="personal-info"
					id="personal-info"
					className="border rounded-lg overflow-hidden bg-card shadow-sm"
				>
					<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
						<div className="flex items-center justify-between w-full pr-4">
							<div className="flex items-center gap-3">
								{client.personType === "physical" ? (
									<User className="h-5 w-5" />
								) : (
									<Building2 className="h-5 w-5" />
								)}
								<span className="font-semibold">
									{client.personType === "physical"
										? t("clientPersonalInfo")
										: t("clientCompanyInfo")}
								</span>
							</div>
							<div className="flex items-center gap-2">
								{(() => {
									const sectionStatus = getSectionStatus(
										client.personType === "physical"
											? "personalInfo"
											: "companyInfo",
									);
									if (!sectionStatus) return null;
									return sectionStatus.isComplete ? (
										<CheckCircle2 className="h-5 w-5 text-green-500" />
									) : (
										<AlertTriangle className="h-5 w-5 text-amber-500" />
									);
								})()}
							</div>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-6 pb-4">
						<dl className="grid grid-cols-1 @xl/main:grid-cols-2 gap-6">
							{client.personType === "physical" ? (
								<>
									<FieldDisplay
										label={t("clientFirstName")}
										value={client.firstName}
										isMissing={!client.firstName}
										tier={tierMap.firstName}
									/>
									<FieldDisplay
										label={t("clientLastName")}
										value={client.lastName}
										isMissing={!client.lastName}
										tier={tierMap.lastName}
									/>
									<FieldDisplay
										label={t("clientSecondLastName")}
										value={client.secondLastName}
										tier={tierMap.secondLastName}
									/>
									<FieldDisplay
										label={t("clientBirthDate")}
										value={
											client.birthDate
												? formatDate(client.birthDate)
												: undefined
										}
										icon={Calendar}
										isMissing={!client.birthDate}
										tier={tierMap.birthDate}
									/>
									<FieldDisplay
										label={t("clientCurp")}
										value={client.curp}
										isMissing={!client.curp}
										tier={tierMap.curp}
									/>
									<FieldDisplay
										label={t("clientNationality")}
										value={client.nationality}
										isMissing={!client.nationality}
									/>
									<FieldDisplay
										label={t("clientCountryCode")}
										value={
											client.resolvedNames?.countryCode || client.countryCode
										}
										icon={Flag}
										isMissing={!client.countryCode}
										tier={tierMap.countryCode}
									/>
									<FieldDisplay
										label={t("clientEconomicActivityLabel")}
										value={
											client.resolvedNames?.economicActivityCode ||
											client.economicActivityCode
										}
										icon={Briefcase}
										isMissing={!client.economicActivityCode}
										tier={tierMap.economicActivityCode}
									/>
								</>
							) : (
								<>
									<FieldDisplay
										label={t("clientBusinessName")}
										value={client.businessName}
										isMissing={!client.businessName}
										tier={tierMap.businessName}
									/>
									<FieldDisplay
										label={t("clientConstitutionDate")}
										value={
											client.incorporationDate
												? formatDate(client.incorporationDate)
												: undefined
										}
										icon={Calendar}
										isMissing={!client.incorporationDate}
									/>
									<FieldDisplay
										label={t("clientCountryCode")}
										value={
											client.resolvedNames?.countryCode || client.countryCode
										}
										icon={Flag}
										isMissing={!client.countryCode}
										tier={tierMap.countryCode}
									/>
									<FieldDisplay
										label={t("clientEconomicActivityLabel")}
										value={
											client.resolvedNames?.economicActivityCode ||
											client.economicActivityCode
										}
										icon={Briefcase}
										isMissing={!client.economicActivityCode}
										tier={tierMap.economicActivityCode}
									/>
								</>
							)}
							<FieldDisplay label="RFC" value={client.rfc} tier={tierMap.rfc} />
						</dl>

						{/* CTA if incomplete */}
						{(() => {
							const sectionStatus = getSectionStatus(
								client.personType === "physical"
									? "personalInfo"
									: "companyInfo",
							);
							if (sectionStatus && !sectionStatus.isComplete) {
								return (
									<div className="mt-4 pt-4 border-t">
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												navigateToEdit("personal", "personal-info")
											}
										>
											<Edit className="h-4 w-4 mr-2" />
											{t("clientCompleteInfo")}
										</Button>
									</div>
								);
							}
							return null;
						})()}

						{/* Edit button - always visible */}
						<div className="mt-4 pt-4 border-t flex justify-end">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => navigateToEdit("personal", "personal-info")}
							>
								<Pencil className="h-4 w-4 mr-2" />
								{t("edit")}
							</Button>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* Contact Information */}
				<AccordionItem
					value="contact-info"
					id="contact-info"
					className="border rounded-lg overflow-hidden bg-card shadow-sm"
				>
					<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
						<div className="flex items-center justify-between w-full pr-4">
							<div className="flex items-center gap-3">
								<Phone className="h-5 w-5" />
								<span className="font-semibold">
									{t("clientContactInfoTitle")}
								</span>
							</div>
							<div className="flex items-center gap-2">
								{(() => {
									const sectionStatus = getSectionStatus("contactInfo");
									if (!sectionStatus) return null;
									return sectionStatus.isComplete ? (
										<CheckCircle2 className="h-5 w-5 text-green-500" />
									) : (
										<AlertTriangle className="h-5 w-5 text-amber-500" />
									);
								})()}
							</div>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-6 pb-4">
						<dl className="grid grid-cols-1 @xl/main:grid-cols-2 gap-6">
							<FieldDisplay
								label={t("clientEmailLabel")}
								value={client.email}
								icon={Mail}
								isMissing={!client.email}
								tier={tierMap.email}
							/>
							<FieldDisplay
								label={t("clientPhoneLabel")}
								value={client.phone}
								icon={Phone}
								isMissing={!client.phone}
								tier={tierMap.phone}
							/>
						</dl>

						{(() => {
							const sectionStatus = getSectionStatus("contactInfo");
							if (sectionStatus && !sectionStatus.isComplete) {
								return (
									<div className="mt-4 pt-4 border-t">
										<Button
											variant="outline"
											size="sm"
											onClick={() => navigateToEdit("contact", "contact-info")}
										>
											<Edit className="h-4 w-4 mr-2" />
											{t("clientCompleteInfo")}
										</Button>
									</div>
								);
							}
							return null;
						})()}

						{/* Edit button - always visible */}
						<div className="mt-4 pt-4 border-t flex justify-end">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => navigateToEdit("contact", "contact-info")}
							>
								<Pencil className="h-4 w-4 mr-2" />
								{t("edit")}
							</Button>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* Address Information */}
				<AccordionItem
					value="address-info"
					id="address-info"
					className="border rounded-lg overflow-hidden bg-card shadow-sm"
				>
					<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
						<div className="flex items-center justify-between w-full pr-4">
							<div className="flex items-center gap-3">
								<MapPin className="h-5 w-5" />
								<span className="font-semibold">{t("clientAddressTitle")}</span>
							</div>
							<div className="flex items-center gap-2">
								{(() => {
									const sectionStatus = getSectionStatus("addressInfo");
									if (!sectionStatus) return null;
									return sectionStatus.isComplete ? (
										<CheckCircle2 className="h-5 w-5 text-green-500" />
									) : (
										<AlertTriangle className="h-5 w-5 text-amber-500" />
									);
								})()}
							</div>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-6 pb-4">
						<dl className="grid grid-cols-1 @xl/main:grid-cols-2 gap-6">
							<div className="xl:col-span-2">
								<dt className="text-sm font-medium text-muted-foreground mb-1">
									{t("clientFullAddress")}
								</dt>
								<dd className="text-base">
									{client.street} {client.externalNumber}
									{client.internalNumber && ` Int. ${client.internalNumber}`}
									<br />
									{client.neighborhood && `${client.neighborhood}, `}
									C.P. {client.postalCode}
									<br />
									{client.city}, {client.municipality},{" "}
									{client.resolvedNames?.stateCode ||
										getStateName(client.stateCode)}
									, {client.country}
								</dd>
							</div>
							<FieldDisplay
								label={t("clientStreet")}
								value={client.street}
								isMissing={!client.street}
								tier={tierMap.street}
							/>
							<FieldDisplay
								label={t("clientExteriorNumber")}
								value={client.externalNumber}
								isMissing={!client.externalNumber}
							/>
							<FieldDisplay
								label={t("clientInteriorNumber")}
								value={client.internalNumber}
							/>
							<FieldDisplay
								label={t("clientNeighborhood")}
								value={client.neighborhood}
								isMissing={!client.neighborhood}
							/>
							<FieldDisplay
								label={t("clientPostalCode")}
								value={client.postalCode}
								isMissing={!client.postalCode}
								tier={tierMap.postalCode}
							/>
							<FieldDisplay
								label={t("clientCity")}
								value={client.city}
								isMissing={!client.city}
							/>
							<FieldDisplay
								label={t("clientMunicipality")}
								value={client.municipality}
								isMissing={!client.municipality}
							/>
							<FieldDisplay
								label={t("clientState")}
								value={
									client.resolvedNames?.stateCode ||
									getStateName(client.stateCode)
								}
								isMissing={!client.stateCode}
							/>
							<FieldDisplay
								label={t("clientCountry")}
								value={client.country}
								isMissing={!client.country}
							/>
							<FieldDisplay
								label={t("clientReference")}
								value={client.reference}
							/>
						</dl>

						{(() => {
							const sectionStatus = getSectionStatus("addressInfo");
							if (sectionStatus && !sectionStatus.isComplete) {
								return (
									<div className="mt-4 pt-4 border-t">
										<Button
											variant="outline"
											size="sm"
											onClick={() => navigateToEdit("address", "address-info")}
										>
											<Edit className="h-4 w-4 mr-2" />
											{t("clientCompleteAddress")}
										</Button>
									</div>
								);
							}
							return null;
						})()}

						{/* Edit button - always visible */}
						<div className="mt-4 pt-4 border-t flex justify-end">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => navigateToEdit("address", "address-info")}
							>
								<Pencil className="h-4 w-4 mr-2" />
								{t("edit")}
							</Button>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* KYC Enhanced Information (Physical persons only) */}
				{client.personType === "physical" && (
					<AccordionItem
						value="kyc-info"
						id="kyc-info"
						className="border rounded-lg overflow-hidden bg-card shadow-sm"
					>
						<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
							<div className="flex items-center justify-between w-full pr-4">
								<div className="flex items-center gap-3">
									<Briefcase className="h-5 w-5" />
									<span className="font-semibold">
										{t("clientKycAdditionalInfo")}
									</span>
								</div>
								<div className="flex items-center gap-2">
									{(() => {
										const sectionStatus = getSectionStatus("kycInfo");
										if (!sectionStatus) return null;
										return sectionStatus.isComplete ? (
											<CheckCircle2 className="h-5 w-5 text-green-500" />
										) : (
											<AlertTriangle className="h-5 w-5 text-amber-500" />
										);
									})()}
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="px-6 pb-4">
							<dl className="grid grid-cols-1 @xl/main:grid-cols-2 gap-6">
								<FieldDisplay
									label={t("clientGender")}
									value={
										client.gender ? t(GENDER_LABELS[client.gender]) : undefined
									}
									isMissing={!client.gender}
									tier={tierMap.gender}
								/>
								<FieldDisplay
									label={t("clientMaritalStatus")}
									value={
										client.maritalStatus
											? t(MARITAL_STATUS_LABELS[client.maritalStatus])
											: undefined
									}
									isMissing={!client.maritalStatus}
									tier={tierMap.maritalStatus}
								/>
								<FieldDisplay
									label={t("clientOccupationProfession")}
									value={client.occupation}
									isMissing={!client.occupation}
									tier={tierMap.occupation}
								/>
								<FieldDisplay
									label={t("clientResourceOrigin")}
									value={client.sourceOfFunds}
									isMissing={!client.sourceOfFunds}
									tier={tierMap.sourceOfFunds}
								/>
								<FieldDisplay
									label={t("clientPatrimonyOrigin")}
									value={client.sourceOfWealth}
									tier={tierMap.sourceOfWealth}
								/>
							</dl>

							{(() => {
								const sectionStatus = getSectionStatus("kycInfo");
								if (sectionStatus && !sectionStatus.isComplete) {
									return (
										<div className="mt-4 pt-4 border-t">
											<Button
												variant="outline"
												size="sm"
												onClick={() => navigateToEdit("personal", "kyc-info")}
											>
												<Edit className="h-4 w-4 mr-2" />
												{t("clientCompleteKyc")}
											</Button>
										</div>
									);
								}
								return null;
							})()}

							{/* Edit button - always visible */}
							<div className="mt-4 pt-4 border-t flex justify-end">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => navigateToEdit("personal", "kyc-info")}
								>
									<Pencil className="h-4 w-4 mr-2" />
									Editar
								</Button>
							</div>
						</AccordionContent>
					</AccordionItem>
				)}

				{/* PEP Status */}
				<AccordionItem
					value="pep-info"
					id="pep-info"
					className="border rounded-lg overflow-hidden bg-card shadow-sm"
				>
					<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
						<div className="flex items-center justify-between w-full pr-4">
							<div className="flex items-center gap-3">
								<Shield className="h-5 w-5" />
								<span className="font-semibold">{t("clientPepStatus")}</span>
							</div>
							<div className="flex items-center gap-2">
								{client.pepStatus === "NOT_PEP" ||
								client.pepStatus === "CONFIRMED" ? (
									<CheckCircle2 className="h-5 w-5 text-green-500" />
								) : (
									<AlertTriangle className="h-5 w-5 text-amber-500" />
								)}
							</div>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-6 pb-4">
						<dl className="grid grid-cols-1 @xl/main:grid-cols-2 gap-6">
							<FieldDisplay
								label={t("clientPepStatus")}
								value={client.pepStatus}
								isMissing={!client.pepStatus || client.pepStatus === "PENDING"}
								tier={tierMap.isPEP}
							/>
							<FieldDisplay
								label={t("clientPepVerifiedOn")}
								value={
									client.pepCheckedAt
										? formatDate(client.pepCheckedAt)
										: undefined
								}
								icon={Calendar}
								isMissing={!client.pepCheckedAt}
							/>
							{client.pepDetails && (
								<div className="md:col-span-2">
									<FieldDisplay
										label="Detalles PEP"
										value={client.pepDetails}
									/>
								</div>
							)}
							{client.pepMatchConfidence && (
								<FieldDisplay
									label="Confianza de Coincidencia"
									value={client.pepMatchConfidence}
								/>
							)}
						</dl>

						{(!client.pepStatus || client.pepStatus === "PENDING") && (
							<div className="flex justify-end mt-4 pt-4 border-t">
								<Button
									variant="outline"
									size="sm"
									onClick={() => navigateToEdit("personal", "pep-info")}
								>
									<Shield className="h-4 w-4 mr-2" />
									{t("clientVerifyPep")}
								</Button>
							</div>
						)}
					</AccordionContent>
				</AccordionItem>

				{/* Documents */}
				<AccordionItem
					value="documents"
					id="documents"
					className="border rounded-lg overflow-hidden bg-card shadow-sm"
				>
					<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
						<div className="flex items-center justify-between w-full pr-4">
							<div className="flex items-center gap-3">
								<FileText className="h-5 w-5" />
								<span className="font-semibold">{t("commonDocuments")}</span>
							</div>
							<div className="flex items-center gap-2">
								{documentsComplete ? (
									<CheckCircle2 className="h-5 w-5 text-green-500" />
								) : (
									<AlertTriangle className="h-5 w-5 text-amber-500" />
								)}
							</div>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-6 pb-4">
						{/* Documents Grid */}
						<div className="grid grid-cols-1 @xl/main:grid-cols-2 gap-3">
							{/* Build unified document list */}
							{(() => {
								// Build list of all documents to display
								const allDocItems: Array<{
									type: string;
									label: string;
									doc: typeof idDocument | null;
									isIdDoc: boolean;
								}> = [];

								// Add ID document if needed
								if (needsIdDocument) {
									allDocItems.push({
										type: "NATIONAL_ID",
										label: t("clientOfficialId"),
										doc: idDocument || null,
										isIdDoc: true,
									});
								}

								// Add other required documents (excluding ID docs if handled separately above)
								requiredDocTypes
									.filter(
										(docType) =>
											!needsIdDocument || !ID_DOCUMENT_TYPES.includes(docType),
									)
									.forEach((docType) => {
										const doc = documents.find(
											(d) => d.documentType === docType,
										);
										allDocItems.push({
											type: docType,
											label: getDocumentLabel(docType),
											doc: doc || null,
											isIdDoc: false,
										});
									});

								return allDocItems.map((item) => {
									const hasDoc = !!item.doc;
									const doc = item.doc;

									// Get page images for display
									type PageImage = {
										src: string;
										title: string;
										label: string;
									};
									const getPageImages = (): PageImage[] => {
										if (!doc?.metadata) return [];
										const metadata = doc.metadata as any;

										// Check rasterized pages first
										if (metadata.rasterizedPageUrls?.length > 0) {
											return metadata.rasterizedPageUrls.map(
												(url: string, idx: number) => ({
													src: url,
													title: `Página ${idx + 1}`,
													label: `Pág. ${idx + 1}`,
												}),
											);
										}

										// INE front/back fallback
										const images: PageImage[] = [];
										if (metadata.ineFrontUrl) {
											images.push({
												src: metadata.ineFrontUrl,
												title: "Frente",
												label: "Frente",
											});
										}
										if (metadata.ineBackUrl) {
											images.push({
												src: metadata.ineBackUrl,
												title: "Reverso",
												label: "Reverso",
											});
										}
										return images;
									};

									const pageImages: PageImage[] = hasDoc ? getPageImages() : [];
									const hasImages = pageImages.length > 0;

									return (
										<Card
											key={item.type}
											className={cn(
												"overflow-hidden py-0 flex flex-col",
												hasDoc
													? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
													: "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20",
											)}
										>
											<CardContent className="p-3 space-y-2 flex flex-col flex-1">
												{/* Header with title and badge */}
												<div className="flex items-center justify-between gap-2">
													<div className="flex items-center gap-2 min-w-0">
														<FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
														<span className="font-medium text-sm truncate">
															{hasDoc && doc
																? getDocumentLabel(doc.documentType)
																: item.label}
														</span>
													</div>
													<Badge
														className={cn(
															"shrink-0 text-xs",
															hasDoc
																? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
																: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
														)}
													>
														{hasDoc ? t("clientUploaded") : t("clientMissing")}
													</Badge>
												</div>

												{/* Document images */}
												{hasImages && (
													<div className="flex gap-2 overflow-x-auto pb-1">
														{pageImages.slice(0, 4).map((img, idx) => (
															<div
																key={idx}
																className="relative rounded-md overflow-hidden bg-muted/30 border cursor-pointer group h-24 shrink-0"
																onClick={() => {
																	setDocumentViewer({
																		open: true,
																		images: pageImages.map((p) => ({
																			src: p.src,
																			title: p.title,
																		})),
																		initialIndex: idx,
																		originalFileUrl: (doc?.metadata as any)
																			?.originalFileUrl,
																	});
																}}
															>
																{doc?.docSvcDocumentId && currentOrg?.id ? (
																	<DocSvcImage
																		organizationId={currentOrg.id}
																		documentId={doc.docSvcDocumentId}
																		imageIndex={idx}
																		alt={img.title}
																		className="h-full w-auto object-contain"
																	/>
																) : (
																	<img
																		src={img.src}
																		alt={img.title}
																		className="h-full w-auto object-contain"
																		crossOrigin="anonymous"
																	/>
																)}
																<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
																	<ZoomIn className="h-4 w-4 text-white" />
																</div>
															</div>
														))}
														{pageImages.length > 4 && (
															<div
																className="h-24 px-3 shrink-0 rounded-md border bg-muted/50 flex items-center justify-center cursor-pointer hover:bg-muted/70 transition-colors"
																onClick={() => {
																	setDocumentViewer({
																		open: true,
																		images: pageImages.map((p) => ({
																			src: p.src,
																			title: p.title,
																		})),
																		initialIndex: 4,
																		originalFileUrl: (doc?.metadata as any)
																			?.originalFileUrl,
																	});
																}}
															>
																<span className="text-xs text-muted-foreground font-medium">
																	+{pageImages.length - 4}
																</span>
															</div>
														)}
													</div>
												)}

												{/* Expiry date if available - shown below images */}
												{hasDoc && doc?.expiryDate && (
													<p className="text-xs text-muted-foreground">
														{t("clientExpires")}{" "}
														{new Date(doc.expiryDate).toLocaleDateString(
															"es-MX",
														)}
													</p>
												)}

												{/* View original button - pushed to bottom */}
												<div className="mt-auto pt-2">
													{hasDoc &&
														((doc?.metadata as any)?.originalFileUrl ||
															doc?.fileUrl) && (
															<Button
																variant="outline"
																size="sm"
																className="w-full h-8 text-xs"
																onClick={() =>
																	window.open(
																		(doc?.metadata as any)?.originalFileUrl ||
																			doc?.fileUrl!,
																		"_blank",
																	)
																}
															>
																<FileText className="h-3 w-3 mr-1.5" />
																{t("clientViewOriginal")}
															</Button>
														)}
												</div>
											</CardContent>
										</Card>
									);
								});
							})()}
						</div>

						{/* Footer with count and edit button */}
						<div className="mt-3 pt-3 border-t flex items-center justify-between">
							<span className="text-xs text-muted-foreground">
								{documents.length} {t("clientDocsUploaded")}
								{missingDocs.length > 0 &&
									` · ${missingDocs.length} ${t("clientDocsMissing")}`}
							</span>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 text-xs"
								onClick={() => navigateToEdit("documents", "documents")}
							>
								<Pencil className="h-3 w-3 mr-1.5" />
								{!documentsComplete ? t("commonLoadMissing") : t("edit")}
							</Button>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* UBOs (for moral/trust) */}
				{needsUBOs && (
					<AccordionItem
						value="ubos"
						id="ubos"
						className="border rounded-lg overflow-hidden bg-card shadow-sm"
					>
						<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
							<div className="flex items-center justify-between w-full pr-4">
								<div className="flex items-center gap-3">
									<Users className="h-5 w-5" />
									<span className="font-semibold">{t("clientUboTitle")}</span>
								</div>
								<div className="flex items-center gap-2">
									{ubosComplete ? (
										<CheckCircle2 className="h-5 w-5 text-green-500" />
									) : (
										<AlertTriangle className="h-5 w-5 text-amber-500" />
									)}
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="px-6 pb-4">
							<div className="space-y-4">
								{/* Stockholders */}
								<div>
									<h4 className="text-sm font-medium text-muted-foreground mb-2">
										{t("clientShareholders")}
									</h4>
									{stockholders.length > 0 ? (
										<div className="space-y-2">
											{stockholders.map((ubo) => (
												<div
													key={ubo.id}
													className="p-3 rounded-lg border bg-muted/30"
												>
													<div className="flex items-center justify-between">
														<div>
															<p className="font-medium text-sm">
																{ubo.firstName} {ubo.lastName}{" "}
																{ubo.secondLastName || ""}
															</p>
															{ubo.ownershipPercentage && (
																<p className="text-xs text-muted-foreground">
																	{ubo.ownershipPercentage}
																	{t("clientParticipation")}
																</p>
															)}
														</div>
														{ubo.isPEP && (
															<Badge variant="destructive" className="text-xs">
																{t("clientPep")}
															</Badge>
														)}
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20">
											<div className="flex items-center gap-2">
												<AlertTriangle className="h-4 w-4 text-amber-600" />
												<span className="text-sm text-amber-700 dark:text-amber-300">
													{t("clientNoShareholders")}
												</span>
											</div>
										</div>
									)}
								</div>

								{/* Legal Representative */}
								<div>
									<h4 className="text-sm font-medium text-muted-foreground mb-2">
										{t("clientLegalRep")}
									</h4>
									{legalRep ? (
										<div className="space-y-3">
											<div className="p-3 rounded-lg border bg-muted/30">
												<div className="flex items-center justify-between">
													<div>
														<p className="font-medium text-sm">
															{legalRep.firstName} {legalRep.lastName}{" "}
															{legalRep.secondLastName || ""}
														</p>
														{legalRep.birthDate && (
															<p className="text-xs text-muted-foreground">
																{formatDate(legalRep.birthDate)}
															</p>
														)}
													</div>
													{legalRep.isPEP && (
														<Badge variant="destructive" className="text-xs">
															PEP
														</Badge>
													)}
												</div>
											</div>
											{/* Legal Rep ID Document Card */}
											{legalRep.idDocumentId &&
												(() => {
													const legalRepIdDoc = documents.find(
														(d) => d.id === legalRep.idDocumentId,
													);
													return legalRepIdDoc ? (
														<UploadedIDDocumentCard
															document={legalRepIdDoc}
															showDelete={false}
															compact
														/>
													) : null;
												})()}
										</div>
									) : (
										<div className="p-3 rounded-lg border border-muted bg-muted/30">
											<p className="text-sm text-muted-foreground">
												{t("clientNoLegalRep")}
											</p>
										</div>
									)}
								</div>
							</div>

							{/* Edit button - always visible */}
							<div className="mt-4 pt-4 border-t flex justify-end">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => navigateToEdit("documents", "ubos")}
								>
									<Pencil className="h-4 w-4 mr-2" />
									{!ubosComplete ? t("clientAddShareholders") : t("edit")}
								</Button>
							</div>
						</AccordionContent>
					</AccordionItem>
				)}

				{/* Compliance Notes */}
				<AccordionItem
					value="notes"
					id="notes"
					className="border rounded-lg overflow-hidden bg-card shadow-sm"
				>
					<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
						<div className="flex items-center gap-3">
							<FileText className="h-5 w-5" />
							<span className="font-semibold">
								{t("clientComplianceNotesTitle")}
							</span>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-6 pb-4">
						<p className="text-sm text-muted-foreground leading-relaxed">
							{client.notes || t("clientNoNotes2")}
						</p>
						<div className="mt-4 pt-4 border-t">
							<p className="text-sm text-muted-foreground">
								<span className="font-medium">{t("clientLastUpdated")}</span>{" "}
								{formatDate(client.updatedAt)}
							</p>
						</div>

						{/* Edit button - always visible */}
						<div className="mt-4 pt-4 border-t flex justify-end">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => navigateToEdit("personal")}
							>
								<Pencil className="h-4 w-4 mr-2" />
								{t("edit")}
							</Button>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* Timestamps */}
				<AccordionItem
					value="timestamps"
					id="timestamps"
					className="border rounded-lg overflow-hidden bg-card shadow-sm"
				>
					<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
						<div className="flex items-center gap-3">
							<Calendar className="h-5 w-5" />
							<span className="font-semibold">{t("clientHistory")}</span>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-6 pb-4">
						<dl className="grid grid-cols-1 @xl/main:grid-cols-2 gap-6">
							<FieldDisplay
								label={t("clientRegistrationDate")}
								value={formatDate(client.createdAt)}
								icon={Calendar}
							/>
							<FieldDisplay
								label={t("clientLastUpdate")}
								value={formatDate(client.updatedAt)}
								icon={Calendar}
							/>
							{client.kycCompletedAt && (
								<FieldDisplay
									label={t("clientKycCompleted")}
									value={formatDate(client.kycCompletedAt)}
									icon={CheckCircle2}
								/>
							)}
						</dl>

						{/* Edit button - always visible */}
						<div className="mt-4 pt-4 border-t flex justify-end">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => navigateToEdit("personal")}
							>
								<Pencil className="h-4 w-4 mr-2" />
								{t("edit")}
							</Button>
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>

			{/* Document Viewer Dialog */}
			<DocumentViewerDialog
				open={documentViewer.open}
				onOpenChange={(open) =>
					setDocumentViewer((prev) => ({ ...prev, open }))
				}
				images={documentViewer.images}
				initialIndex={documentViewer.initialIndex}
				originalFileUrl={documentViewer.originalFileUrl}
			/>
		</div>
	);
}

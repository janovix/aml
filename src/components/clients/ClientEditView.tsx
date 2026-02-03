"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Save,
	User,
	Lock,
	Hash,
	Phone,
	Home,
	FileText,
	Users,
	AlertCircle,
} from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import type {
	PersonType,
	ClientCreateRequest,
	Client,
} from "../../types/client";
import { KYCProgressIndicator } from "./KYCProgressIndicator";
import { EditDocumentsSection } from "./EditDocumentsSection";
import { UBOSection } from "./UBOSection";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/mutations";
import { getClientById, updateClient } from "../../lib/api/clients";
import { listClientUBOs } from "../../lib/api/ubos";
import { listClientDocuments } from "../../lib/api/client-documents";
import type { ClientDocumentType } from "../../types/client-document";
import { executeMutation } from "../../lib/mutations";
import { getPersonTypeStyle } from "../../lib/person-type-icon";
import { LabelWithInfo } from "../ui/LabelWithInfo";
import { getFieldDescription } from "../../lib/field-descriptions";
import { CatalogSelector } from "../catalogs/CatalogSelector";
import { PhoneInput } from "../ui/phone-input";
import { validateRFC, validateCURP, cn } from "../../lib/utils";
import { validatePhone } from "@/lib/validators/validate-phone";
import { useLanguage } from "@/components/LanguageProvider";
import { requiresUBOs, REQUIRED_DOCUMENTS } from "@/lib/constants";
import { ZipCodeAddressFields } from "./ZipCodeAddressFields";

interface ClientFormData {
	personType: PersonType;
	// Physical person fields
	firstName?: string;
	lastName?: string;
	secondLastName?: string;
	birthDate?: string; // date format YYYY-MM-DD
	curp?: string;
	// Moral/Trust fields
	businessName?: string;
	incorporationDate?: string; // date format YYYY-MM-DD
	// Common fields
	rfc: string;
	nationality?: string;
	email: string;
	phone: string;
	stateCode: string;
	city: string;
	municipality: string;
	neighborhood: string;
	street: string;
	externalNumber: string;
	internalNumber?: string;
	postalCode: string;
	reference?: string;
	notes?: string;
}

interface ClientEditViewProps {
	clientId: string;
}

/**
 * Skeleton component for ClientEditView
 * Used when loading the organization to show the appropriate skeleton
 */
export function ClientEditSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<PageHeroSkeleton
				showStats={false}
				showBackButton={true}
				actionCount={2}
			/>
			{/* Form skeleton */}
			<div className="max-w-4xl space-y-6">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 @xl/main:grid-cols-2 gap-4">
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

export function ClientEditView({
	clientId,
}: ClientEditViewProps): React.JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { navigateTo, orgPath } = useOrgNavigation();
	const { t } = useLanguage();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [client, setClient] = useState<Client | null>(null);
	const [documents, setDocuments] = useState<any[]>([]);
	const [ubos, setUbos] = useState<any[]>([]);
	const [isLoadingValidation, setIsLoadingValidation] = useState(true);

	const [formData, setFormData] = useState<ClientFormData>({
		personType: "moral",
		rfc: "",
		firstName: "",
		lastName: "",
		secondLastName: "",
		birthDate: "",
		curp: "",
		businessName: "",
		incorporationDate: "",
		nationality: "",
		email: "",
		phone: "",
		stateCode: "",
		city: "",
		municipality: "",
		neighborhood: "",
		street: "",
		externalNumber: "",
		internalNumber: "",
		postalCode: "",
		reference: "",
		notes: "",
	});

	const [validationErrors, setValidationErrors] = useState<{
		rfc?: string;
		curp?: string;
		phone?: string;
	}>({});
	const [kycRefreshTrigger, setKycRefreshTrigger] = useState(0);

	// Track missing information per tab for warning indicators
	const [tabWarnings, setTabWarnings] = useState<{
		documents: boolean;
		ubos: boolean;
	}>({
		documents: false,
		ubos: false,
	});

	// Initialize activeTab from query param or default to "personal"
	const [activeTab, setActiveTab] = useState(() => {
		const tabFromUrl = searchParams.get("tab");
		const validTabs = ["personal", "contact", "address", "documents", "ubos"];
		return tabFromUrl && validTabs.includes(tabFromUrl)
			? tabFromUrl
			: "personal";
	});

	// Callback to refresh KYC status when documents or UBOs change
	const handleKYCChange = useCallback(() => {
		setKycRefreshTrigger((prev) => prev + 1);
	}, []);

	// Update URL when tab changes
	const handleTabChange = (newTab: string) => {
		setActiveTab(newTab);
		const url = new URL(window.location.href);
		url.searchParams.set("tab", newTab);
		router.replace(url.pathname + url.search, { scroll: false });
	};

	// Fetch documents and UBOs for validation (runs regardless of active tab)
	const fetchValidationData = useCallback(async () => {
		if (!client) return;

		try {
			setIsLoadingValidation(true);
			const [docsResponse, ubosResponse] = await Promise.all([
				listClientDocuments({ clientId }),
				requiresUBOs(client.personType)
					? listClientUBOs({ clientId })
					: Promise.resolve({ data: [] }),
			]);
			setDocuments(docsResponse.data);
			setUbos(ubosResponse.data);
		} catch (error) {
			console.error("Error fetching validation data:", error);
		} finally {
			setIsLoadingValidation(false);
		}
	}, [clientId, client]);

	// Fetch validation data when client is loaded or KYC changes
	useEffect(() => {
		if (client) {
			fetchValidationData();
		}
	}, [client, kycRefreshTrigger, fetchValidationData]);

	// Calculate validation status for documents tab
	useEffect(() => {
		if (!client || isLoadingValidation) return;

		const needsUBOs = requiresUBOs(client.personType);
		const uploadedDocTypes = new Set(documents.map((d) => d.documentType));

		const required = REQUIRED_DOCUMENTS[client.personType] || [];
		const missingDocs = required.filter((d) => !uploadedDocTypes.has(d));

		// For physical persons, also check ID document
		const hasIdDocument =
			["NATIONAL_ID", "PASSPORT"].some((type) =>
				uploadedDocTypes.has(type as ClientDocumentType),
			) || needsUBOs; // Skip ID check for moral/trust

		const hasMissingDocs = missingDocs.length > 0 || !hasIdDocument;

		setTabWarnings((prev) => {
			if (prev.documents !== hasMissingDocs) {
				return { ...prev, documents: hasMissingDocs };
			}
			return prev;
		});
	}, [client, documents, isLoadingValidation]);

	// Calculate validation status for UBOs tab
	useEffect(() => {
		if (!client || isLoadingValidation) return;

		const needsUBOs = requiresUBOs(client.personType);
		if (!needsUBOs) return;

		// Check for stockholders (at least one required)
		const stockholders = ubos.filter(
			(u) => u.relationshipType === "SHAREHOLDER",
		);
		const hasStockholders = stockholders.length > 0;

		// Check for legal rep with ID document
		const legalRep = ubos.find((u) => u.relationshipType === "LEGAL_REP");
		const hasLegalRepWithId = legalRep && legalRep.idDocumentId !== null;

		// Warning if missing stockholders OR missing legal rep with ID
		const hasMissingInfo = !hasStockholders || !hasLegalRepWithId;

		setTabWarnings((prev) => {
			if (prev.ubos !== hasMissingInfo) {
				return { ...prev, ubos: hasMissingInfo };
			}
			return prev;
		});
	}, [client, ubos, isLoadingValidation]);

	useEffect(() => {
		const fetchClient = async () => {
			try {
				setIsLoading(true);
				const data = await getClientById({
					id: clientId,
				});
				setClient(data);

				// Convert date-time to date format for inputs
				const birthDate = data.birthDate
					? new Date(data.birthDate).toISOString().split("T")[0]
					: "";
				const incorporationDate = data.incorporationDate
					? new Date(data.incorporationDate).toISOString().split("T")[0]
					: "";

				setFormData({
					personType: data.personType,
					rfc: data.rfc,
					firstName: data.firstName ?? "",
					lastName: data.lastName ?? "",
					secondLastName: data.secondLastName ?? "",
					birthDate,
					curp: data.curp ?? "",
					businessName: data.businessName ?? "",
					incorporationDate,
					nationality: data.nationality ?? "",
					email: data.email,
					phone: data.phone,
					stateCode: data.stateCode,
					city: data.city,
					municipality: data.municipality,
					neighborhood: data.neighborhood,
					street: data.street,
					externalNumber: data.externalNumber,
					internalNumber: data.internalNumber ?? "",
					postalCode: data.postalCode,
					reference: data.reference ?? "",
					notes: data.notes ?? "",
				});
			} catch (error) {
				console.error("Error fetching client:", error);
				toast.error(extractErrorMessage(error));
			} finally {
				setIsLoading(false);
			}
		};
		fetchClient();
	}, [clientId, toast]);

	// Handle anchor scrolling from URL hash
	useEffect(() => {
		if (typeof window === "undefined" || !client) return;

		const hash = window.location.hash.slice(1);
		if (hash) {
			// Small delay to ensure DOM is ready
			setTimeout(() => {
				const element = document.getElementById(hash);
				if (element) {
					element.scrollIntoView({ behavior: "smooth", block: "start" });
				}
			}, 300);
		}
	}, [client]);

	const handleInputChange = (
		field: keyof ClientFormData,
		value: string,
	): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();
		if (isSubmitting) return;

		const currentPersonType = client?.personType ?? formData.personType;

		// Client-side validation
		const errors: { rfc?: string; curp?: string; phone?: string } = {};

		// Validate RFC
		const rfcValidation = validateRFC(formData.rfc, currentPersonType);
		if (!rfcValidation.isValid) {
			errors.rfc = rfcValidation.error;
		}

		// Validate CURP (only for physical persons)
		if (currentPersonType === "physical" && formData.curp) {
			const curpValidation = validateCURP(formData.curp);
			if (!curpValidation.isValid) {
				errors.curp = curpValidation.error;
			}
		}

		// Validate phone
		const phoneValidation = validatePhone(formData.phone);
		if (!phoneValidation.isValid) {
			errors.phone = phoneValidation.error;
		}

		// If there are validation errors, show them and prevent submission
		if (Object.keys(errors).length > 0) {
			setValidationErrors(errors);
			toast.error(t("clientValidationError"));
			return;
		}

		setValidationErrors({});
		setIsSubmitting(true);

		if (!currentPersonType) {
			toast.error(t("clientPersonTypeNotAvailable"));
			setIsSubmitting(false);
			return;
		}

		// Build the request payload based on personType
		const request: ClientCreateRequest = {
			personType: currentPersonType,
			rfc: formData.rfc,
			email: formData.email,
			phone: formData.phone,
			country: client?.country ?? "MX",
			stateCode: formData.stateCode,
			city: formData.city,
			municipality: formData.municipality,
			neighborhood: formData.neighborhood,
			street: formData.street,
			externalNumber: formData.externalNumber,
			postalCode: formData.postalCode,
		};

		// Add personType-specific fields
		if (currentPersonType === "physical") {
			request.firstName = formData.firstName;
			request.lastName = formData.lastName;
			if (formData.secondLastName)
				request.secondLastName = formData.secondLastName;
			if (formData.birthDate) request.birthDate = formData.birthDate;
			if (formData.curp) request.curp = formData.curp;
		} else {
			// moral or trust
			request.businessName = formData.businessName;
			if (formData.incorporationDate) {
				// Convert date (YYYY-MM-DD) to date-time format (YYYY-MM-DDTHH:mm:ss.sssZ)
				// Use midnight UTC to avoid timezone issues
				const date = new Date(`${formData.incorporationDate}T00:00:00.000Z`);
				request.incorporationDate = date.toISOString();
			}
		}

		// Add optional fields
		if (formData.nationality) request.nationality = formData.nationality;
		if (formData.internalNumber)
			request.internalNumber = formData.internalNumber;
		if (formData.reference) request.reference = formData.reference;
		if (formData.notes) request.notes = formData.notes;

		try {
			await executeMutation({
				mutation: () =>
					updateClient({
						id: clientId,
						input: request,
					}),
				loading: t("clientUpdating"),
				success: t("clientUpdateSuccess"),
				onSuccess: () => {
					navigateTo(`/clients/${clientId}`);
				},
			});
		} catch (error) {
			// Error is already handled by executeMutation via Sonner
			console.error("Error updating client:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = (): void => {
		navigateTo(`/clients/${clientId}`);
	};

	if (isLoading) {
		return <ClientEditSkeleton />;
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

	const lockedPersonType = formData.personType ?? client.personType;
	const personTypeStyle = getPersonTypeStyle(lockedPersonType);
	const PersonTypeIcon = personTypeStyle.icon;

	return (
		<div className="space-y-6">
			<PageHero
				title={t("clientEditTitle")}
				subtitle={t("clientEditSubtitle")}
				icon={User}
				backButton={{
					label: t("back"),
					onClick: handleCancel,
				}}
			/>

			{/* Header Card: Person Type + RFC + KYC Status */}
			<Card className="max-w-4xl py-0">
				<CardContent className="p-4">
					<div className="flex flex-col lg:flex-row lg:items-center gap-4">
						{/* Person Type - Compact */}
						<div
							className={`flex items-center gap-3 rounded-lg border ${personTypeStyle.borderColor} ${personTypeStyle.bgColor} px-3 py-2`}
						>
							<PersonTypeIcon
								className={`h-5 w-5 ${personTypeStyle.iconColor}`}
							/>
							<div className="min-w-0">
								<p
									className={`text-sm font-semibold ${personTypeStyle.iconColor}`}
								>
									{personTypeStyle.label}
								</p>
							</div>
							<Lock className="h-3 w-3 text-muted-foreground" />
						</div>

						{/* RFC - Compact */}
						<div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
							<Hash className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="text-[10px] text-muted-foreground uppercase tracking-wide">
									RFC
								</p>
								<p className="font-mono text-sm font-semibold tracking-wide">
									{formData.rfc}
								</p>
							</div>
						</div>

						{/* KYC Status - Compact */}
						<div className="lg:ml-auto">
							<KYCProgressIndicator
								clientId={clientId}
								personType={client.personType}
								refreshTrigger={kycRefreshTrigger}
								compact
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tabbed Form */}
			<div className="max-w-4xl">
				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="w-full"
				>
					{/* Tabs List - Large icons centered with text below */}
					<TabsList
						className={cn(
							"grid w-full gap-2 mb-4 p-2 bg-muted/50 rounded-lg auto-rows-fr",
							"grid-cols-2",
							requiresUBOs(client.personType)
								? "lg:grid-cols-5"
								: "lg:grid-cols-4",
						)}
						style={{ height: "unset" }}
					>
						<TabsTrigger
							value="personal"
							className="flex flex-col items-center justify-center gap-1.5 px-3 py-4 min-h-[80px] text-center"
						>
							<User className="h-6 w-6 shrink-0" />
							<span className="text-xs leading-tight">
								{formData.personType === "physical"
									? t("clientPersonalData")
									: t("clientCompanyData")}
							</span>
						</TabsTrigger>
						<TabsTrigger
							value="contact"
							className="flex flex-col items-center justify-center gap-1.5 px-3 py-4 min-h-[80px] text-center"
						>
							<Phone className="h-6 w-6 shrink-0" />
							<span className="text-xs leading-tight">
								{t("clientContactInfo")}
							</span>
						</TabsTrigger>
						<TabsTrigger
							value="address"
							className="flex flex-col items-center justify-center gap-1.5 px-3 py-4 min-h-[80px] text-center"
						>
							<Home className="h-6 w-6 shrink-0" />
							<span className="text-xs leading-tight">
								{t("clientAddressInfo")}
							</span>
						</TabsTrigger>
						<TabsTrigger
							value="documents"
							className="flex flex-col items-center justify-center gap-1.5 px-3 py-4 min-h-[80px] text-center"
						>
							<FileText className="h-6 w-6 shrink-0" />
							<span className="text-xs leading-tight flex items-center gap-1">
								Documentos
								{tabWarnings.documents && (
									<AlertCircle className="h-3.5 w-3.5 text-amber-500" />
								)}
							</span>
						</TabsTrigger>
						{requiresUBOs(client.personType) && (
							<TabsTrigger
								value="ubos"
								className="flex flex-col items-center justify-center gap-1.5 px-3 py-4 min-h-[80px] text-center"
							>
								<Users className="h-6 w-6 shrink-0" />
								<span className="text-xs leading-tight flex items-center gap-1">
									UBOs
									{tabWarnings.ubos && (
										<AlertCircle className="h-3.5 w-3.5 text-amber-500" />
									)}
								</span>
							</TabsTrigger>
						)}
					</TabsList>

					<form id="client-edit-form" onSubmit={handleSubmit}>
						{/* Personal Data Tab */}
						<TabsContent value="personal" className="space-y-6 mt-0">
							<Card id="personal-info">
								<CardHeader>
									<CardTitle className="text-lg">
										{formData.personType === "physical"
											? t("clientPersonalData")
											: t("clientCompanyData")}
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{formData.personType === "physical" ? (
										<>
											<div className="grid grid-cols-1 @2xl/main:grid-cols-3 gap-4">
												<div className="space-y-2">
													<LabelWithInfo
														htmlFor="firstName"
														description={getFieldDescription("firstName")}
														required
													>
														{t("clientFirstName")}
													</LabelWithInfo>
													<Input
														id="firstName"
														value={formData.firstName}
														onChange={(e) =>
															handleInputChange(
																"firstName",
																e.target.value.toUpperCase(),
															)
														}
														placeholder="JUAN"
														required
													/>
												</div>
												<div className="space-y-2">
													<LabelWithInfo
														htmlFor="lastName"
														description={getFieldDescription("lastName")}
														required
													>
														{t("clientLastName")}
													</LabelWithInfo>
													<Input
														id="lastName"
														value={formData.lastName}
														onChange={(e) =>
															handleInputChange(
																"lastName",
																e.target.value.toUpperCase(),
															)
														}
														placeholder="PÉREZ"
														required
													/>
												</div>
												<div className="space-y-2">
													<LabelWithInfo
														htmlFor="secondLastName"
														description={getFieldDescription("secondLastName")}
													>
														{t("clientSecondLastName")}
													</LabelWithInfo>
													<Input
														id="secondLastName"
														value={formData.secondLastName}
														onChange={(e) =>
															handleInputChange(
																"secondLastName",
																e.target.value.toUpperCase(),
															)
														}
														placeholder="GARCÍA"
													/>
												</div>
											</div>
											<div className="grid grid-cols-1 @xl/main:grid-cols-2 gap-4">
												<div className="space-y-2">
													<LabelWithInfo
														htmlFor="birthDate"
														description={getFieldDescription("birthDate")}
														required
													>
														{t("clientBirthDate")}
													</LabelWithInfo>
													<Input
														id="birthDate"
														type="date"
														value={formData.birthDate}
														onChange={(e) =>
															handleInputChange("birthDate", e.target.value)
														}
														required
													/>
												</div>
												<div className="space-y-2">
													<LabelWithInfo
														htmlFor="curp"
														description={getFieldDescription("curp")}
														required
													>
														{t("clientCurp")}
													</LabelWithInfo>
													<Input
														id="curp"
														value={formData.curp}
														onChange={(e) => {
															handleInputChange("curp", e.target.value);
															if (validationErrors.curp) {
																setValidationErrors((prev) => ({
																	...prev,
																	curp: undefined,
																}));
															}
														}}
														placeholder="PECJ850615HDFRRN09"
														className={cn(
															validationErrors.curp ? "border-destructive" : "",
															"font-mono uppercase",
														)}
														required
													/>
													{validationErrors.curp && (
														<p className="text-xs text-destructive">
															{validationErrors.curp}
														</p>
													)}
												</div>
											</div>
										</>
									) : (
										<>
											<div className="space-y-2">
												<LabelWithInfo
													htmlFor="businessName"
													description={getFieldDescription("businessName")}
													required
												>
													{t("clientBusinessName")}
												</LabelWithInfo>
												<Input
													id="businessName"
													value={formData.businessName}
													onChange={(e) =>
														handleInputChange(
															"businessName",
															e.target.value.toUpperCase(),
														)
													}
													placeholder="Ej. EMPRESA S.A. DE C.V."
													required
												/>
											</div>
											<div className="space-y-2">
												<LabelWithInfo
													htmlFor="incorporationDate"
													description={getFieldDescription("incorporationDate")}
													required
												>
													{t("clientConstitutionDate")}
												</LabelWithInfo>
												<Input
													id="incorporationDate"
													type="date"
													value={formData.incorporationDate}
													onChange={(e) =>
														handleInputChange(
															"incorporationDate",
															e.target.value,
														)
													}
													required
												/>
											</div>
										</>
									)}
									<div className="space-y-2">
										<LabelWithInfo
											htmlFor="rfc"
											description={getFieldDescription("rfc")}
											required
										>
											{t("clientRfc")}
										</LabelWithInfo>
										<Input
											id="rfc"
											value={formData.rfc}
											onChange={(e) => {
												handleInputChange("rfc", e.target.value);
												if (validationErrors.rfc) {
													setValidationErrors((prev) => ({
														...prev,
														rfc: undefined,
													}));
												}
											}}
											className={`font-mono uppercase ${
												validationErrors.rfc ? "border-destructive" : ""
											}`}
											placeholder={
												formData.personType === "physical"
													? "PECJ850615E56"
													: "EMP850101AAA"
											}
											maxLength={formData.personType === "physical" ? 13 : 12}
											required
										/>
										{validationErrors.rfc ? (
											<p className="text-xs text-destructive">
												{validationErrors.rfc}
											</p>
										) : (
											<p className="text-xs text-muted-foreground">
												{formData.personType === "physical"
													? t("clientRfcHintPhysical")
													: t("clientRfcHintMoral")}
											</p>
										)}
									</div>
									{formData.personType === "physical" && (
										<CatalogSelector
											catalogKey="countries"
											label={t("clientNationality")}
											labelDescription={getFieldDescription("nationality")}
											value={formData.nationality}
											searchPlaceholder={t("clientSearchCountry")}
											onChange={(option) =>
												handleInputChange("nationality", option?.id ?? "")
											}
										/>
									)}
								</CardContent>
							</Card>

							{/* Notes Card - in personal tab */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">
										{t("clientComplianceNotes")}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										<Label htmlFor="notes">{t("clientObservations")}</Label>
										<Textarea
											id="notes"
											value={formData.notes}
											onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
												handleInputChange("notes", e.target.value)
											}
											rows={4}
											placeholder={t("clientNotesPlaceholder")}
										/>
									</div>
								</CardContent>
							</Card>

							{/* Action buttons */}
							<div className="flex justify-end gap-3">
								<Button
									type="button"
									variant="outline"
									onClick={handleCancel}
									disabled={isSubmitting}
								>
									{t("cancel")}
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<span className="animate-spin mr-2">⏳</span>
											{t("clientSaving")}
										</>
									) : (
										<>
											<Save className="h-4 w-4 mr-2" />
											{t("clientSaveButton")}
										</>
									)}
								</Button>
							</div>
						</TabsContent>

						{/* Contact Tab */}
						<TabsContent value="contact" className="mt-0">
							<Card id="contact-info">
								<CardHeader>
									<CardTitle className="text-lg">
										{t("clientContactInfo")}
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-1 @xl/main:grid-cols-2 gap-4">
										<div className="space-y-2">
											<LabelWithInfo
												htmlFor="email"
												description={getFieldDescription("email")}
												required
											>
												{t("clientEmail")}
											</LabelWithInfo>
											<Input
												id="email"
												type="email"
												value={formData.email}
												onChange={(e) =>
													handleInputChange("email", e.target.value)
												}
												placeholder="contacto@empresa.com"
												required
											/>
										</div>
										<div className="space-y-2">
											<LabelWithInfo
												htmlFor="phone"
												description={getFieldDescription("phone")}
												required
											>
												{t("clientPhone")}
											</LabelWithInfo>
											<PhoneInput
												id="phone"
												value={formData.phone || undefined}
												onChange={(value: string | undefined) => {
													handleInputChange("phone", value || "");
													if (validationErrors.phone) {
														setValidationErrors((prev) => ({
															...prev,
															phone: undefined,
														}));
													}
												}}
												placeholder="+52 55 1234 5678"
												required
											/>
											{validationErrors.phone && (
												<p className="text-xs text-destructive">
													{validationErrors.phone}
												</p>
											)}
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Action buttons */}
							<div className="flex justify-end gap-3 mt-6">
								<Button
									type="button"
									variant="outline"
									onClick={handleCancel}
									disabled={isSubmitting}
								>
									{t("cancel")}
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<span className="animate-spin mr-2">⏳</span>
											{t("clientSaving")}
										</>
									) : (
										<>
											<Save className="h-4 w-4 mr-2" />
											{t("clientSaveButton")}
										</>
									)}
								</Button>
							</div>
						</TabsContent>

						{/* Address Tab */}
						<TabsContent value="address" className="mt-0">
							<Card id="address-info">
								<CardHeader>
									<CardTitle className="text-lg">
										{t("clientAddressInfo")}
									</CardTitle>
									<p className="text-sm text-muted-foreground">
										Domicilio fiscal del cliente
									</p>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Address fields: Street + External Number + Internal Number */}
									<div className="grid grid-cols-1 @md/main:grid-cols-[1fr_150px_150px] gap-4">
										<div className="space-y-2">
											<LabelWithInfo
												htmlFor="street"
												description={getFieldDescription("street")}
												required
											>
												{t("clientStreet")}
											</LabelWithInfo>
											<Input
												id="street"
												value={formData.street}
												onChange={(e) =>
													handleInputChange(
														"street",
														e.target.value.toUpperCase(),
													)
												}
												placeholder="AV. CONSTITUCIÓN"
												required
											/>
										</div>
										<div className="space-y-2">
											<LabelWithInfo
												htmlFor="externalNumber"
												description={getFieldDescription("externalNumber")}
												required
											>
												{t("clientExteriorNumber")}
											</LabelWithInfo>
											<Input
												id="externalNumber"
												value={formData.externalNumber}
												onChange={(e) =>
													handleInputChange(
														"externalNumber",
														e.target.value.toUpperCase(),
													)
												}
												placeholder="123"
												required
											/>
										</div>
										<div className="space-y-2">
											<LabelWithInfo
												htmlFor="internalNumber"
												description={getFieldDescription("internalNumber")}
											>
												{t("clientInteriorNumber")}
											</LabelWithInfo>
											<Input
												id="internalNumber"
												value={formData.internalNumber}
												onChange={(e) =>
													handleInputChange(
														"internalNumber",
														e.target.value.toUpperCase(),
													)
												}
												placeholder="A"
											/>
										</div>
									</div>

									{/* Remaining fields handled by ZipCodeAddressFields */}
									<ZipCodeAddressFields
										postalCode={formData.postalCode}
										onPostalCodeChange={(value) =>
											handleInputChange("postalCode", value)
										}
										city={formData.city}
										onCityChange={(value) => handleInputChange("city", value)}
										municipality={formData.municipality}
										onMunicipalityChange={(value) =>
											handleInputChange("municipality", value)
										}
										stateCode={formData.stateCode}
										onStateCodeChange={(value) =>
											handleInputChange("stateCode", value)
										}
										neighborhood={formData.neighborhood}
										onNeighborhoodChange={(value) =>
											handleInputChange("neighborhood", value)
										}
										reference={formData.reference}
										onReferenceChange={(value) =>
											handleInputChange("reference", value)
										}
										showNeighborhood={true}
										showReference={true}
									/>
								</CardContent>
							</Card>

							{/* Action buttons */}
							<div className="flex justify-end gap-3 mt-6">
								<Button
									type="button"
									variant="outline"
									onClick={handleCancel}
									disabled={isSubmitting}
								>
									{t("cancel")}
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<span className="animate-spin mr-2">⏳</span>
											{t("clientSaving")}
										</>
									) : (
										<>
											<Save className="h-4 w-4 mr-2" />
											{t("clientSaveButton")}
										</>
									)}
								</Button>
							</div>
						</TabsContent>
					</form>

					{/* Documents Tab - Outside form since it has its own submission logic */}
					<TabsContent value="documents" className="mt-0">
						<div id="documents" className="space-y-6">
							{/* Documents Section - Has its own progress indicator */}
							<EditDocumentsSection
								clientId={clientId}
								personType={client.personType}
								onDocumentChange={handleKYCChange}
							/>

							{/* Cancel button only - document actions are immediate */}
							<div className="flex justify-end">
								<Button variant="outline" onClick={handleCancel}>
									{t("cancel")}
								</Button>
							</div>
						</div>
					</TabsContent>

					{/* UBOs Tab - Only for moral/trust entities */}
					{requiresUBOs(client.personType) && (
						<TabsContent value="ubos" className="mt-0">
							<div id="ubos" className="space-y-6">
								<UBOSection
									clientId={clientId}
									personType={client.personType}
									onUBOChange={handleKYCChange}
								/>

								{/* Cancel button only - UBO actions are immediate */}
								<div className="flex justify-end">
									<Button variant="outline" onClick={handleCancel}>
										{t("cancel")}
									</Button>
								</div>
							</div>
						</TabsContent>
					)}
				</Tabs>
			</div>
		</div>
	);
}

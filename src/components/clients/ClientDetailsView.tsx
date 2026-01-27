"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";
import type { Client } from "../../types/client";
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
import { PageHero } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { getPersonTypeStyle } from "../../lib/person-type-icon";
import { useLanguage } from "@/components/LanguageProvider";
import { CircularProgress } from "@/components/ui/circular-progress";
import {
	calculateKYCStatus,
	getFieldLabel,
	type KYCSectionStatus,
} from "@/lib/kyc-status";
import { cn } from "@/lib/utils";

// Document type labels
const DOCUMENT_LABELS: Record<string, string> = {
	NATIONAL_ID: "INE/IFE",
	PASSPORT: "Pasaporte",
	DRIVERS_LICENSE: "Licencia de Conducir",
	CEDULA_PROFESIONAL: "Cédula Profesional",
	CARTILLA_MILITAR: "Cartilla Militar",
	TAX_ID: "Constancia de Situación Fiscal",
	PROOF_OF_ADDRESS: "Comprobante de Domicilio",
	UTILITY_BILL: "Recibo de Servicios",
	BANK_STATEMENT: "Estado de Cuenta",
	ACTA_CONSTITUTIVA: "Acta Constitutiva",
	PODER_NOTARIAL: "Poder Notarial",
	TRUST_AGREEMENT: "Contrato de Fideicomiso",
	CORPORATE_BYLAWS: "Estatutos Sociales",
	OTHER: "Otro Documento",
};

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
							<div className="grid grid-cols-1 @md/main:grid-cols-2 gap-6">
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
 * Field display component with missing indicator
 */
function FieldDisplay({
	label,
	value,
	icon: Icon,
	isMissing,
}: {
	label: string;
	value?: string | null;
	icon?: React.ElementType;
	isMissing?: boolean;
}) {
	return (
		<div>
			<dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
				{Icon && <Icon className="h-4 w-4" />}
				{label}
			</dt>
			<dd
				className={cn("text-base", isMissing && "text-muted-foreground italic")}
			>
				{value || "No especificado"}
				{isMissing && (
					<AlertTriangle className="h-4 w-4 inline ml-2 text-amber-500" />
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
	const searchParams = useSearchParams();
	const [client, setClient] = useState<Client | null>(null);
	const [documents, setDocuments] = useState<ClientDocument[]>([]);
	const [ubos, setUbos] = useState<UBO[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [openAccordions, setOpenAccordions] = useState<string[]>([]);

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
				toast.error(extractErrorMessage(error));
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
	const needsUBOs =
		client.personType === "moral" || client.personType === "trust";
	const needsIdDocument = client.personType === "physical";

	// Check documents status
	const hasIdDocument = documents.some((d) =>
		["NATIONAL_ID", "PASSPORT"].includes(d.documentType),
	);
	const requiredDocTypes: ClientDocumentType[] = needsUBOs
		? client.personType === "moral"
			? ["ACTA_CONSTITUTIVA", "PODER_NOTARIAL", "TAX_ID", "PROOF_OF_ADDRESS"]
			: ["TRUST_AGREEMENT", "TAX_ID", "PROOF_OF_ADDRESS"]
		: ["TAX_ID", "PROOF_OF_ADDRESS"];

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
								Estado KYC
							</p>
						</div>

						{/* Status Details */}
						<div className="flex-1 space-y-3">
							<div>
								<h3 className="text-lg font-semibold mb-1">
									{kycStatus.isComplete ? "KYC Completo" : "KYC Incompleto"}
								</h3>
								<p className="text-sm text-muted-foreground">
									{kycStatus.totalCompleted} de {kycStatus.totalRequired} campos
									completados
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
										{kycStatus.overallPercentage}% completado
									</span>
									{!kycStatus.isComplete && (
										<Button
											variant="link"
											size="sm"
											className="h-auto p-0 text-xs"
											onClick={() => navigateToEdit("personal")}
										>
											Completar información
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
										? "Información Personal"
										: "Información de la Empresa"}
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
						<dl className="grid grid-cols-1 @md/main:grid-cols-2 gap-6">
							{client.personType === "physical" ? (
								<>
									<FieldDisplay
										label="Nombre"
										value={client.firstName}
										isMissing={!client.firstName}
									/>
									<FieldDisplay
										label="Apellido Paterno"
										value={client.lastName}
										isMissing={!client.lastName}
									/>
									<FieldDisplay
										label="Apellido Materno"
										value={client.secondLastName}
									/>
									<FieldDisplay
										label="Fecha de Nacimiento"
										value={
											client.birthDate
												? formatDate(client.birthDate)
												: undefined
										}
										icon={Calendar}
										isMissing={!client.birthDate}
									/>
									<FieldDisplay
										label="CURP"
										value={client.curp}
										isMissing={!client.curp}
									/>
									<FieldDisplay
										label="Nacionalidad"
										value={client.nationality}
										isMissing={!client.nationality}
									/>
								</>
							) : (
								<>
									<FieldDisplay
										label="Razón Social"
										value={client.businessName}
										isMissing={!client.businessName}
									/>
									<FieldDisplay
										label="Fecha de Constitución"
										value={
											client.incorporationDate
												? formatDate(client.incorporationDate)
												: undefined
										}
										icon={Calendar}
										isMissing={!client.incorporationDate}
									/>
								</>
							)}
							<FieldDisplay label="RFC" value={client.rfc} />
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
											Completar información
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
								Editar
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
								<span className="font-semibold">Información de Contacto</span>
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
						<dl className="grid grid-cols-1 @md/main:grid-cols-2 gap-6">
							<FieldDisplay
								label="Correo Electrónico"
								value={client.email}
								icon={Mail}
								isMissing={!client.email}
							/>
							<FieldDisplay
								label="Teléfono"
								value={client.phone}
								icon={Phone}
								isMissing={!client.phone}
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
											Completar información
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
								Editar
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
								<span className="font-semibold">Domicilio</span>
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
						<dl className="grid grid-cols-1 @md/main:grid-cols-2 gap-6">
							<div className="md:col-span-2">
								<dt className="text-sm font-medium text-muted-foreground mb-1">
									Dirección Completa
								</dt>
								<dd className="text-base">
									{client.street} {client.externalNumber}
									{client.internalNumber && ` Int. ${client.internalNumber}`}
									<br />
									{client.neighborhood && `${client.neighborhood}, `}
									C.P. {client.postalCode}
									<br />
									{client.city}, {client.municipality}, {client.stateCode},{" "}
									{client.country}
								</dd>
							</div>
							<FieldDisplay
								label="Calle"
								value={client.street}
								isMissing={!client.street}
							/>
							<FieldDisplay
								label="Número Exterior"
								value={client.externalNumber}
								isMissing={!client.externalNumber}
							/>
							<FieldDisplay
								label="Número Interior"
								value={client.internalNumber}
							/>
							<FieldDisplay
								label="Colonia"
								value={client.neighborhood}
								isMissing={!client.neighborhood}
							/>
							<FieldDisplay
								label="Código Postal"
								value={client.postalCode}
								isMissing={!client.postalCode}
							/>
							<FieldDisplay
								label="Ciudad"
								value={client.city}
								isMissing={!client.city}
							/>
							<FieldDisplay
								label="Municipio"
								value={client.municipality}
								isMissing={!client.municipality}
							/>
							<FieldDisplay
								label="Estado"
								value={client.stateCode}
								isMissing={!client.stateCode}
							/>
							<FieldDisplay
								label="País"
								value={client.country}
								isMissing={!client.country}
							/>
							<FieldDisplay label="Referencia" value={client.reference} />
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
											Completar domicilio
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
								Editar
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
										Información KYC Adicional
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
							<dl className="grid grid-cols-1 @md/main:grid-cols-2 gap-6">
								<FieldDisplay
									label="Género"
									value={client.gender}
									isMissing={!client.gender}
								/>
								<FieldDisplay
									label="Ocupación"
									value={client.occupation}
									isMissing={!client.occupation}
								/>
								<FieldDisplay
									label="Estado Civil"
									value={client.maritalStatus}
									isMissing={!client.maritalStatus}
								/>
								<FieldDisplay
									label="Fuente de Fondos"
									value={client.sourceOfFunds}
									isMissing={!client.sourceOfFunds}
								/>
								<FieldDisplay
									label="Fuente de Riqueza"
									value={client.sourceOfWealth}
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
												Completar información KYC
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
								<span className="font-semibold">Estado PEP</span>
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
						<dl className="grid grid-cols-1 @md/main:grid-cols-2 gap-6">
							<FieldDisplay
								label="Estado PEP"
								value={client.pepStatus}
								isMissing={!client.pepStatus || client.pepStatus === "PENDING"}
							/>
							<FieldDisplay
								label="Verificado el"
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
									Verificar estado PEP
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
								<span className="font-semibold">Documentos</span>
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
						<div className="space-y-3">
							{/* ID Document Status */}
							{needsIdDocument && (
								<div
									className={cn(
										"p-3 rounded-lg border",
										hasIdDocument
											? "bg-green-50 dark:bg-green-950/20 border-green-200"
											: "bg-amber-50 dark:bg-amber-950/20 border-amber-200",
									)}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											{hasIdDocument ? (
												<CheckCircle2 className="h-4 w-4 text-green-600" />
											) : (
												<AlertTriangle className="h-4 w-4 text-amber-600" />
											)}
											<span className="text-sm font-medium">
												Identificación Oficial
											</span>
										</div>
										{hasIdDocument ? (
											<Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
												Cargado
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="border-amber-500 text-amber-700"
											>
												Faltante
											</Badge>
										)}
									</div>
								</div>
							)}

							{/* Other Documents */}
							{requiredDocTypes.map((docType) => {
								const hasDoc = uploadedDocTypes.has(docType);
								return (
									<div
										key={docType}
										className={cn(
											"p-3 rounded-lg border",
											hasDoc
												? "bg-green-50 dark:bg-green-950/20 border-green-200"
												: "bg-amber-50 dark:bg-amber-950/20 border-amber-200",
										)}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												{hasDoc ? (
													<CheckCircle2 className="h-4 w-4 text-green-600" />
												) : (
													<AlertTriangle className="h-4 w-4 text-amber-600" />
												)}
												<span className="text-sm font-medium">
													{DOCUMENT_LABELS[docType] || docType}
												</span>
											</div>
											{hasDoc ? (
												<Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
													Cargado
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="border-amber-500 text-amber-700"
												>
													Faltante
												</Badge>
											)}
										</div>
									</div>
								);
							})}

							{/* Document count summary */}
							<div className="pt-2 text-sm text-muted-foreground">
								{documents.length} documento(s) cargado(s)
								{missingDocs.length > 0 &&
									`, ${missingDocs.length} faltante(s)`}
							</div>
						</div>

						{!documentsComplete && (
							<div className="mt-4 pt-4 border-t">
								<Button
									variant="outline"
									size="sm"
									onClick={() => navigateToEdit("documents", "documents")}
								>
									<FileText className="h-4 w-4 mr-2" />
									Cargar documentos faltantes
								</Button>
							</div>
						)}

						{/* Edit button - always visible */}
						<div className="mt-4 pt-4 border-t flex justify-end">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => navigateToEdit("documents", "documents")}
							>
								<Pencil className="h-4 w-4 mr-2" />
								Editar
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
									<span className="font-semibold">
										UBO y Representante Legal
									</span>
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
										Accionistas
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
																	{ubo.ownershipPercentage}% de participación
																</p>
															)}
														</div>
														{ubo.isPEP && (
															<Badge variant="destructive" className="text-xs">
																PEP
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
													No hay accionistas registrados
												</span>
											</div>
										</div>
									)}
								</div>

								{/* Legal Representative */}
								<div>
									<h4 className="text-sm font-medium text-muted-foreground mb-2">
										Representante Legal
									</h4>
									{legalRep ? (
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
									) : (
										<div className="p-3 rounded-lg border border-muted bg-muted/30">
											<p className="text-sm text-muted-foreground">
												No hay representante legal registrado (opcional)
											</p>
										</div>
									)}
								</div>
							</div>

							{!ubosComplete && (
								<div className="mt-4 pt-4 border-t">
									<Button
										variant="outline"
										size="sm"
										onClick={() => navigateToEdit("documents", "ubos")}
									>
										<Users className="h-4 w-4 mr-2" />
										Agregar accionistas
									</Button>
								</div>
							)}

							{/* Edit button - always visible */}
							<div className="mt-4 pt-4 border-t flex justify-end">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => navigateToEdit("documents", "ubos")}
								>
									<Pencil className="h-4 w-4 mr-2" />
									Editar
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
							<span className="font-semibold">Notas de Cumplimiento</span>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-6 pb-4">
						<p className="text-sm text-muted-foreground leading-relaxed">
							{client.notes || "Sin notas"}
						</p>
						<div className="mt-4 pt-4 border-t">
							<p className="text-sm text-muted-foreground">
								<span className="font-medium">Última actualización:</span>{" "}
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
								Editar
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
							<span className="font-semibold">Historial</span>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-6 pb-4">
						<dl className="grid grid-cols-1 @md/main:grid-cols-2 gap-6">
							<FieldDisplay
								label="Fecha de Registro"
								value={formatDate(client.createdAt)}
								icon={Calendar}
							/>
							<FieldDisplay
								label="Última Actualización"
								value={formatDate(client.updatedAt)}
								icon={Calendar}
							/>
							{client.kycCompletedAt && (
								<FieldDisplay
									label="KYC Completado"
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
								Editar
							</Button>
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}

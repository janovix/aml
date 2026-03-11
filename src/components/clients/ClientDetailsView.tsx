"use client";

import { useState, useEffect } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
	Info,
	CheckCircle2,
	Users,
	Briefcase,
	Shield,
	ExternalLink,
	Pencil,
	Loader2,
	Activity,
	Link2,
	ChevronDown,
} from "lucide-react";
import type { Client } from "../../types/client";
import type { Gender, MaritalStatus } from "../../types/client";
import { getClientDisplayName } from "../../types/client";
import { getClientById } from "../../lib/api/clients";
import { listClientDocuments } from "../../lib/api/client-documents";
import { listClientShareholders } from "../../lib/api/shareholders";
import { listClientBeneficialControllers } from "../../lib/api/beneficial-controllers";
import type {
	ClientDocument,
	ClientDocumentType,
} from "../../types/client-document";
import type { Shareholder } from "../../types/shareholder";
import type { BeneficialController } from "../../types/beneficial-controller";
import {
	getShareholderDisplayName,
	getEntityTypeLabel,
} from "../../types/shareholder";
import {
	getBCDisplayName,
	getBCTypeLabel,
} from "../../types/beneficial-controller";
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
import {
	DocumentViewerDialog,
	type DocumentImage,
} from "./DocumentViewerDialog";
import { UploadedIDDocumentCard } from "./UploadedIDDocumentCard";
import { useWatchlistScreening } from "@/hooks/useWatchlistScreening";
import { useWatchlistConfig } from "@/hooks/useWatchlistConfig";
import {
	ExternalLinkDialog,
	useExternalLinkRedirect,
	looksLikeUrl,
	ensureProtocol,
	extractHostname,
} from "@/components/ExternalLinkDialog";
import { KycSessionSection } from "@/components/kyc/KycSessionSection";
import { getKycBaseUrl } from "@/lib/api/doc-svc";
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
import { DocumentThumbnailRow } from "./DocumentThumbnailRow";

interface ClientDetailsViewProps {
	clientId: string;
}

// ─── Watchlist screening helpers ─────────────────────────────────────────────

type WatchlistStatus =
	| "pending"
	| "processing"
	| "completed"
	| "failed"
	| "skipped";
type AdverseRiskLevel = "none" | "low" | "medium" | "high";

type AdverseMediaResultShape = {
	risk_level?: AdverseRiskLevel;
	findings?: { es?: string; en?: string };
	sources?: unknown[];
};

interface PepOfficialRecord {
	id: string;
	nombre: string;
	denominacion: string;
	areaadscripcion: string;
	sujetoobligado: string;
	entidadfederativa: string;
	periodoreporta: string;
	informacionPrincipal?: {
		telefono?: string;
		correo?: string;
		direccion?: string;
	};
}

interface PepOfficialResultShape {
	query?: string;
	total_results?: number;
	results?: PepOfficialRecord[];
	results_sent?: number;
}

interface PepAiResultShape {
	probability?: number;
	summary?: { es?: string; en?: string };
	sources?: string[];
}

interface Sat69bPhase {
	satNotice: string | null;
	satDate: string | null;
	dofNotice: string | null;
	dofDate: string | null;
}

interface Sat69bMatch {
	target: {
		id: string;
		rfc: string;
		taxpayerName: string;
		taxpayerStatus: string;
		presumptionPhase: Sat69bPhase | null;
		rebuttalPhase: Sat69bPhase | null;
		definitivePhase: Sat69bPhase | null;
		favorablePhase: Sat69bPhase | null;
	};
	score: number;
	breakdown: {
		vectorScore: number;
		nameScore: number;
		metaScore: number;
		identifierMatch: boolean;
	};
}

interface Sat69bResultShape {
	matches: Sat69bMatch[];
	count: number;
}

interface OfacMatch {
	target: {
		id: string;
		partyType: string;
		primaryName: string;
		aliases: string[] | null;
		birthDate: string | null;
		birthPlace: string | null;
		addresses: string[] | null;
		identifiers: Array<{
			type?: string;
			number?: string;
			country?: string;
		}> | null;
		remarks: string | null;
		sourceList: string;
	};
	score: number;
	breakdown: {
		vectorScore: number;
		nameScore: number;
		metaScore: number;
		identifierMatch: boolean;
	};
}

interface OfacResultShape {
	matches: OfacMatch[];
	count: number;
}

interface UnMatch {
	target: {
		id: string;
		partyType: string;
		primaryName: string;
		aliases: string[] | null;
		birthDate: string | null;
		birthPlace: string | null;
		gender: string | null;
		nationalities: string[] | null;
		addresses: string[] | null;
		identifiers: Array<{ type?: string; number?: string }> | null;
		designations: string[] | null;
		remarks: string | null;
		unListType: string;
		referenceNumber: string | null;
		listedOn: string | null;
	};
	score: number;
	breakdown: {
		vectorScore: number;
		nameScore: number;
		metaScore: number;
		identifierMatch: boolean;
	};
}

interface UnResultShape {
	matches: UnMatch[];
	count: number;
}

const WATCHLIST_STATUS_CONFIG: Record<
	WatchlistStatus,
	{ label: string; badgeClass: string; dotClass: string }
> = {
	pending: {
		label: "Pendiente",
		badgeClass:
			"border-gray-200 bg-gray-50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700",
		dotClass: "bg-gray-400",
	},
	processing: {
		label: "En proceso",
		badgeClass:
			"border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
		dotClass: "bg-blue-500 animate-pulse",
	},
	completed: {
		label: "Completado",
		badgeClass:
			"border-green-200 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
		dotClass: "bg-green-500",
	},
	failed: {
		label: "Error",
		badgeClass:
			"border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
		dotClass: "bg-red-500",
	},
	skipped: {
		label: "Omitido",
		badgeClass:
			"border-gray-100 bg-gray-50 text-gray-400 dark:bg-gray-800/30 dark:text-gray-500 dark:border-gray-700",
		dotClass: "bg-gray-300",
	},
};

const ADVERSE_RISK_CONFIG: Record<
	AdverseRiskLevel,
	{ label: string; badgeClass: string }
> = {
	none: {
		label: "Ninguno",
		badgeClass:
			"border-green-200 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
	},
	low: {
		label: "Bajo",
		badgeClass:
			"border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
	},
	medium: {
		label: "Medio",
		badgeClass:
			"border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
	},
	high: {
		label: "Alto",
		badgeClass:
			"border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
	},
};

interface ScreeningSourceRowProps {
	label: string;
	status: string;
	count?: number;
	matchLabel?: string;
	riskBadge?: React.ReactNode;
	findingsText?: string;
	children?: React.ReactNode;
}

function ScreeningSourceRow({
	label,
	status,
	count,
	matchLabel = "coincidencia",
	riskBadge,
	findingsText,
	children,
}: ScreeningSourceRowProps) {
	const cfg =
		WATCHLIST_STATUS_CONFIG[status as WatchlistStatus] ??
		WATCHLIST_STATUS_CONFIG.pending;
	const hasMatches = typeof count === "number" && count > 0;

	return (
		<div className="py-3 px-4 bg-background">
			<div className="flex items-center gap-2 flex-wrap">
				<span className="text-sm font-medium flex-1">{label}</span>
				<span
					className={cn(
						"inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium",
						cfg.badgeClass,
					)}
				>
					<span
						className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dotClass)}
					/>
					{cfg.label}
				</span>
				{hasMatches && (
					<span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 font-medium">
						<AlertTriangle className="h-3 w-3" />
						{count} {count === 1 ? matchLabel : `${matchLabel}s`}
					</span>
				)}
				{riskBadge}
			</div>
			{findingsText && (
				<p className="mt-1.5 text-xs text-muted-foreground italic">
					{findingsText}
				</p>
			)}
			{children}
		</div>
	);
}

function ScoreBadge({ score }: { score: number }) {
	const pct = Math.round(score * 100);
	const cls =
		pct >= 80
			? "border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
			: pct >= 50
				? "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
				: "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
	return (
		<span
			className={cn(
				"inline-flex items-center text-xs px-1.5 py-0.5 rounded border font-medium tabular-nums",
				cls,
			)}
		>
			{pct}% sim.
		</span>
	);
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
	const { t, language } = useLanguage();
	const { getStateName } = useStatesCatalog();
	const { currentOrg } = useOrgStore();
	const { activityCode } = useOrgSettings();
	const [client, setClient] = useState<Client | null>(null);
	const [documents, setDocuments] = useState<ClientDocument[]>([]);
	const [shareholders, setShareholders] = useState<Shareholder[]>([]);
	const [beneficialControllers, setBeneficialControllers] = useState<
		BeneficialController[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [openAccordions, setOpenAccordions] = useState<string[]>([]);
	const [pepRecordsExpanded, setPepRecordsExpanded] = useState(false);
	const [ofacExpanded, setOfacExpanded] = useState(false);
	const [unExpanded, setUnExpanded] = useState(false);
	const [sat69bExpanded, setSat69bExpanded] = useState(false);

	// Real-time watchlist screening data (populated once client is loaded)
	const {
		data: screeningData,
		connectionStatus: screeningConnectionStatus,
		isComplete: screeningComplete,
	} = useWatchlistScreening({
		watchlistQueryId: client?.watchlistQueryId,
		enabled: !!client?.watchlistQueryId,
	});

	const { features: watchlistFeatures } = useWatchlistConfig();
	const showPepSearch = watchlistFeatures.pepSearch;
	const showPepGrok = watchlistFeatures.pepGrok;
	const showAdverseMedia = watchlistFeatures.adverseMedia;

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

	const extLink = useExternalLinkRedirect();

	// Fetch all data
	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				const [clientData, docsData, shareholdersData, bcsData] =
					await Promise.all([
						getClientById({ id: clientId }),
						listClientDocuments({ clientId }).catch(() => ({
							data: [],
							total: 0,
						})),
						listClientShareholders({ clientId }).catch(() => ({
							data: [],
							total: 0,
						})),
						listClientBeneficialControllers({ clientId }).catch(() => ({
							data: [],
							total: 0,
						})),
					]);
				setClient(clientData);
				setDocuments(docsData.data);
				setShareholders(shareholdersData.data);
				setBeneficialControllers(bcsData.data);
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

	// KYC progress: backend kycCompletionPct is single source of truth (aligned with frontend
	// sections in aml-svc kyc-progress.ts). kycStatus is still used for "X de Y campos" and section status.
	const kycStatus = calculateKYCStatus(client, {
		documents,
		beneficialControllers,
	});
	const kycPct = client.kycCompletionPct ?? 0;
	const kycComplete = kycPct === 100;
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

	// Check ownership status (for moral/trust)
	const hasShareholders = shareholders.length > 0;
	const hasBCs = beneficialControllers.length > 0;
	const hasAllOwnership = needsUBOs ? hasShareholders && hasBCs : true;

	// Calculate overall document/ownership completion
	const documentsComplete = hasAllDocs;
	const ownershipComplete = hasAllOwnership;

	// Helper to navigate to edit with tab and anchor
	const navigateToEdit = (
		tab: "personal" | "contact" | "address" | "documents" | "ownership",
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
					<div className="flex flex-col sm:flex-row items-center gap-6 sm:justify-around">
						{/* Person Type Badge — comes first */}
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

						<div className="flex items-center gap-8">
							{/* Circular Progress — uses server kycCompletionPct (aligned with frontend sections in aml-svc) */}
							<div className="flex flex-col items-center gap-2">
								<CircularProgress
									percentage={kycPct}
									size={80}
									strokeWidth={8}
								/>
								<p className="text-xs text-muted-foreground font-medium">
									{t("clientKycStatus")}
								</p>
							</div>

							{/* Status Details */}
							<div className="space-y-1">
								<h3 className="text-lg font-semibold">
									{kycComplete
										? t("clientKycComplete")
										: t("clientKycIncomplete")}
								</h3>
								<p className="text-sm text-muted-foreground">
									{kycStatus.totalCompleted} {t("clientFieldsOf")}{" "}
									{kycStatus.totalRequired} {t("clientFieldsCompleted")}
								</p>
								<p className="text-xs text-muted-foreground">
									{kycPct}
									{t("clientPercentComplete")}
								</p>
								{!kycComplete && (
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
				</CardContent>
			</Card>

			{/* Completeness Banner */}
			{completenessResult && (
				<CompletenessBanner
					result={completenessResult}
					onNavigateToField={(fieldPath) => {
						// Map field paths to the correct edit tab and anchor
						if (
							fieldPath.startsWith("client.firstName") ||
							fieldPath.startsWith("client.lastName") ||
							fieldPath.startsWith("client.secondLastName") ||
							fieldPath.startsWith("client.businessName") ||
							fieldPath.startsWith("client.countryCode") ||
							fieldPath.startsWith("client.economicActivityCode") ||
							fieldPath.startsWith("client.rfc") ||
							fieldPath.startsWith("client.curp") ||
							fieldPath.startsWith("client.birthDate") ||
							fieldPath.startsWith("client.nationality") ||
							fieldPath.startsWith("client.gender") ||
							fieldPath.startsWith("client.maritalStatus") ||
							fieldPath.startsWith("client.occupation") ||
							fieldPath.startsWith("client.sourceOfFunds") ||
							fieldPath.startsWith("client.sourceOfWealth")
						) {
							navigateToEdit("personal", "personal-info");
						} else if (
							fieldPath.startsWith("client.phone") ||
							fieldPath.startsWith("client.email")
						) {
							navigateToEdit("contact", "contact-info");
						} else if (
							fieldPath.startsWith("client.street") ||
							fieldPath.startsWith("client.postalCode") ||
							fieldPath.startsWith("client.city") ||
							fieldPath.startsWith("client.stateCode") ||
							fieldPath.startsWith("client.country")
						) {
							navigateToEdit("address", "address-info");
						} else {
							navigateToEdit("personal");
						}
					}}
				/>
			)}

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

				{/* KYC Enhanced Information */}
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
							{client.personType === "physical" && (
								<>
									<FieldDisplay
										label={t("clientGender")}
										value={
											client.gender
												? t(GENDER_LABELS[client.gender])
												: undefined
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
								</>
							)}
							<FieldDisplay
								label={
									client.personType === "physical"
										? t("clientResourceOrigin")
										: "Origen de los recursos de la empresa"
								}
								value={client.sourceOfFunds}
								isMissing={!client.sourceOfFunds}
								tier={tierMap.sourceOfFunds}
							/>
							<FieldDisplay
								label={
									client.personType === "physical"
										? t("clientPatrimonyOrigin")
										: "Origen del patrimonio de la empresa"
								}
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

				{/* Regulatory Screening (PEP, OFAC, UN, SAT69b, Adverse Media) */}
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
								{!screeningComplete &&
									screeningConnectionStatus !== "connected" &&
									client.watchlistQueryId && (
										<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
									)}
								{/* Overall result icon */}
								{(() => {
									const result = screeningData
										? (screeningData.ofacCount ?? 0) > 0 ||
											(screeningData.unCount ?? 0) > 0 ||
											(screeningData.sat69bCount ?? 0) > 0 ||
											(screeningData.pepOfficialCount ?? 0) > 0
											? "flagged"
											: screeningComplete
												? "clear"
												: "pending"
										: (client.screeningResult ?? "pending");
									if (result === "clear")
										return <CheckCircle2 className="h-5 w-5 text-green-500" />;
									if (result === "flagged")
										return <AlertTriangle className="h-5 w-5 text-red-500" />;
									return <AlertTriangle className="h-5 w-5 text-amber-500" />;
								})()}
							</div>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-6 pb-6">
						{(() => {
							const src = screeningData;
							const adverseResult = src?.adverseMediaResult as
								| AdverseMediaResultShape
								| null
								| undefined;
							const riskLevel: AdverseRiskLevel =
								adverseResult?.risk_level ?? "none";
							const findingsText =
								language === "es"
									? adverseResult?.findings?.es
									: adverseResult?.findings?.en;

							const ofacResultRaw = src?.ofacResult as
								| OfacResultShape
								| null
								| undefined;
							const ofacMatches: OfacMatch[] = ofacResultRaw?.matches ?? [];

							const unResultRaw = src?.unResult as
								| UnResultShape
								| null
								| undefined;
							const unMatches: UnMatch[] = unResultRaw?.matches ?? [];

							const sat69bResultRaw = src?.sat69bResult as
								| Sat69bResultShape
								| null
								| undefined;
							const sat69bMatches: Sat69bMatch[] =
								sat69bResultRaw?.matches ?? [];

							const pepOfficialResultRaw = src?.pepOfficialResult as
								| PepOfficialResultShape
								| null
								| undefined;
							const pepOfficialRecords: PepOfficialRecord[] =
								pepOfficialResultRaw?.results ?? [];
							const pepOfficialCfg =
								WATCHLIST_STATUS_CONFIG[
									(src?.pepOfficialStatus as WatchlistStatus) ?? "pending"
								] ?? WATCHLIST_STATUS_CONFIG.pending;
							const pepAiResult = src?.pepAiResult as
								| PepAiResultShape
								| null
								| undefined;
							const pepAiCfg =
								WATCHLIST_STATUS_CONFIG[
									(src?.pepAiStatus as WatchlistStatus) ?? "pending"
								] ?? WATCHLIST_STATUS_CONFIG.pending;
							const pepAiSummary =
								language === "es"
									? pepAiResult?.summary?.es
									: pepAiResult?.summary?.en;

							const hasListMatches =
								(src?.ofacCount ?? 0) > 0 ||
								(src?.unCount ?? 0) > 0 ||
								(src?.sat69bCount ?? 0) > 0 ||
								(src?.pepOfficialCount ?? 0) > 0;
							const isFlagged = hasListMatches || riskLevel !== "none";

							const verificationDate = src?.updatedAt
								? formatDate(src.updatedAt)
								: client.screenedAt
									? formatDate(client.screenedAt)
									: null;

							let bannerClass: string;
							let BannerIcon: React.ElementType;
							let bannerTitle: string;
							let bannerSub: string;
							let bannerIconClass: string;

							if (!src && !client.screeningResult) {
								bannerClass = "bg-muted/50 border";
								BannerIcon = Shield;
								bannerTitle = "Sin verificar";
								bannerSub =
									"No se ha iniciado una verificación para este cliente";
								bannerIconClass = "text-muted-foreground";
							} else if (src && !screeningComplete) {
								bannerClass =
									"bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
								BannerIcon = Loader2;
								bannerTitle = "Verificación en proceso";
								bannerSub = "Esperando resultados de búsquedas asíncronas...";
								bannerIconClass = "text-blue-500 animate-spin";
							} else if (isFlagged) {
								bannerClass =
									"bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800";
								BannerIcon = AlertTriangle;
								bannerTitle = "Coincidencias detectadas";
								bannerSub =
									"Se encontraron coincidencias en una o más listas. Se requiere revisión.";
								bannerIconClass = "text-red-500";
							} else {
								bannerClass =
									"bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800";
								BannerIcon = CheckCircle2;
								bannerTitle = "Sin coincidencias";
								bannerSub =
									"El cliente no aparece en ninguna lista de vigilancia";
								bannerIconClass = "text-green-500";
							}

							return (
								<div className="space-y-4">
									{/* Overall status banner */}
									<div
										className={cn(
											"flex items-start gap-3 rounded-lg p-3",
											bannerClass,
										)}
									>
										<BannerIcon
											className={cn("h-5 w-5 mt-0.5 shrink-0", bannerIconClass)}
										/>
										<div className="flex-1">
											<p className="text-sm font-semibold">{bannerTitle}</p>
											<p className="text-xs text-muted-foreground">
												{bannerSub}
											</p>
										</div>
										{verificationDate && (
											<div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
												<Calendar className="h-3 w-3" />
												{verificationDate}
											</div>
										)}
									</div>

									{/* Per-source rows */}
									{(src ?? client.screeningResult) && (
										<div className="rounded-lg border overflow-hidden divide-y">
											{/* OFAC — expandable matches */}
											<div className="bg-background">
												<div className="py-3 px-4">
													<div className="flex items-center gap-2 flex-wrap">
														<span className="text-sm font-medium flex-1">
															OFAC
														</span>
														<span
															className={cn(
																"inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium",
																(
																	WATCHLIST_STATUS_CONFIG[
																		(src?.ofacStatus as WatchlistStatus) ??
																			"pending"
																	] ?? WATCHLIST_STATUS_CONFIG.pending
																).badgeClass,
															)}
														>
															<span
																className={cn(
																	"h-1.5 w-1.5 rounded-full shrink-0",
																	(
																		WATCHLIST_STATUS_CONFIG[
																			(src?.ofacStatus as WatchlistStatus) ??
																				"pending"
																		] ?? WATCHLIST_STATUS_CONFIG.pending
																	).dotClass,
																)}
															/>
															{
																(
																	WATCHLIST_STATUS_CONFIG[
																		(src?.ofacStatus as WatchlistStatus) ??
																			"pending"
																	] ?? WATCHLIST_STATUS_CONFIG.pending
																).label
															}
														</span>
														{(() => {
															const cnt = src
																? (src.ofacCount ?? 0)
																: client.ofacSanctioned
																	? 1
																	: 0;
															return cnt > 0 ? (
																<span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 font-medium">
																	<AlertTriangle className="h-3 w-3" />
																	{cnt} {cnt === 1 ? "sanción" : "sanciones"}
																</span>
															) : null;
														})()}
														{ofacMatches.length > 0 && (
															<button
																type="button"
																onClick={() => setOfacExpanded((v) => !v)}
																className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
															>
																{ofacExpanded ? "Ocultar" : "Ver detalle"}
																<ChevronDown
																	className={cn(
																		"h-3 w-3 transition-transform duration-200",
																		ofacExpanded && "rotate-180",
																	)}
																/>
															</button>
														)}
													</div>
												</div>
												{ofacExpanded && ofacMatches.length > 0 && (
													<div className="border-t px-4 py-3 bg-muted/20">
														<div className="max-h-80 overflow-y-auto space-y-2 pr-1">
															{ofacMatches.map((match, idx) => (
																<div
																	key={match.target.id ?? idx}
																	className="rounded-md border bg-background p-3 space-y-1.5 text-xs"
																>
																	<div className="flex items-start justify-between gap-2">
																		<p className="font-semibold text-sm leading-snug">
																			{match.target.primaryName}
																		</p>
																		<div className="flex items-center gap-1 shrink-0">
																			<ScoreBadge score={match.score} />
																			<span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5 tabular-nums">
																				{idx + 1}/{ofacMatches.length}
																			</span>
																		</div>
																	</div>
																	<div className="flex flex-wrap gap-1">
																		<span className="text-xs px-1.5 py-0.5 rounded bg-muted border text-muted-foreground">
																			{match.target.partyType}
																		</span>
																		<span className="text-xs px-1.5 py-0.5 rounded bg-muted border text-muted-foreground">
																			{match.target.sourceList}
																		</span>
																		{match.breakdown.identifierMatch && (
																			<span className="text-xs px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 font-medium">
																				ID exacto
																			</span>
																		)}
																	</div>
																	{match.target.aliases &&
																		match.target.aliases.length > 0 && (
																			<div className="flex items-start gap-1.5 text-muted-foreground">
																				<User className="h-3 w-3 shrink-0 mt-0.5" />
																				<span>
																					{match.target.aliases.join(", ")}
																				</span>
																			</div>
																		)}
																	{(match.target.birthDate ||
																		match.target.birthPlace) && (
																		<div className="grid grid-cols-2 gap-1.5">
																			{match.target.birthDate && (
																				<div className="flex items-center gap-1.5 text-muted-foreground">
																					<Calendar className="h-3 w-3 shrink-0" />
																					<span>
																						{match.target.birthDate.slice(
																							0,
																							10,
																						)}
																					</span>
																				</div>
																			)}
																			{match.target.birthPlace && (
																				<div className="flex items-center gap-1.5 text-muted-foreground">
																					<MapPin className="h-3 w-3 shrink-0" />
																					<span>{match.target.birthPlace}</span>
																				</div>
																			)}
																		</div>
																	)}
																	{match.target.addresses &&
																		match.target.addresses.length > 0 && (
																			<div className="flex items-start gap-1.5 text-muted-foreground">
																				<Building2 className="h-3 w-3 shrink-0 mt-0.5" />
																				<span>
																					{match.target.addresses.join(" · ")}
																				</span>
																			</div>
																		)}
																	{match.target.identifiers &&
																		match.target.identifiers.length > 0 && (
																			<div className="flex flex-wrap gap-1 pt-1 border-t">
																				{match.target.identifiers.map(
																					(ident, i) => (
																						<span
																							key={i}
																							className="text-xs px-1.5 py-0.5 rounded bg-muted border text-muted-foreground"
																						>
																							{ident.type}: {ident.number}
																							{ident.country
																								? ` (${ident.country})`
																								: ""}
																						</span>
																					),
																				)}
																			</div>
																		)}
																	{match.target.remarks && (
																		<p className="italic text-muted-foreground pt-1 border-t">
																			{match.target.remarks}
																		</p>
																	)}
																</div>
															))}
														</div>
													</div>
												)}
											</div>
											{/* UN — expandable matches */}
											<div className="bg-background">
												<div className="py-3 px-4">
													<div className="flex items-center gap-2 flex-wrap">
														<span className="text-sm font-medium flex-1">
															Naciones Unidas (UNSC)
														</span>
														<span
															className={cn(
																"inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium",
																(
																	WATCHLIST_STATUS_CONFIG[
																		(src?.unStatus as WatchlistStatus) ??
																			"pending"
																	] ?? WATCHLIST_STATUS_CONFIG.pending
																).badgeClass,
															)}
														>
															<span
																className={cn(
																	"h-1.5 w-1.5 rounded-full shrink-0",
																	(
																		WATCHLIST_STATUS_CONFIG[
																			(src?.unStatus as WatchlistStatus) ??
																				"pending"
																		] ?? WATCHLIST_STATUS_CONFIG.pending
																	).dotClass,
																)}
															/>
															{
																(
																	WATCHLIST_STATUS_CONFIG[
																		(src?.unStatus as WatchlistStatus) ??
																			"pending"
																	] ?? WATCHLIST_STATUS_CONFIG.pending
																).label
															}
														</span>
														{(() => {
															const cnt = src
																? (src.unCount ?? 0)
																: client.unscSanctioned
																	? 1
																	: 0;
															return cnt > 0 ? (
																<span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 font-medium">
																	<AlertTriangle className="h-3 w-3" />
																	{cnt} {cnt === 1 ? "sanción" : "sanciones"}
																</span>
															) : null;
														})()}
														{unMatches.length > 0 && (
															<button
																type="button"
																onClick={() => setUnExpanded((v) => !v)}
																className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
															>
																{unExpanded ? "Ocultar" : "Ver detalle"}
																<ChevronDown
																	className={cn(
																		"h-3 w-3 transition-transform duration-200",
																		unExpanded && "rotate-180",
																	)}
																/>
															</button>
														)}
													</div>
												</div>
												{unExpanded && unMatches.length > 0 && (
													<div className="border-t px-4 py-3 bg-muted/20">
														<div className="max-h-80 overflow-y-auto space-y-2 pr-1">
															{unMatches.map((match, idx) => (
																<div
																	key={match.target.id ?? idx}
																	className="rounded-md border bg-background p-3 space-y-1.5 text-xs"
																>
																	<div className="flex items-start justify-between gap-2">
																		<p className="font-semibold text-sm leading-snug">
																			{match.target.primaryName}
																		</p>
																		<div className="flex items-center gap-1 shrink-0">
																			<ScoreBadge score={match.score} />
																			<span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5 tabular-nums">
																				{idx + 1}/{unMatches.length}
																			</span>
																		</div>
																	</div>
																	<div className="flex flex-wrap gap-1">
																		<span className="text-xs px-1.5 py-0.5 rounded bg-muted border text-muted-foreground">
																			{match.target.partyType}
																		</span>
																		<span className="text-xs px-1.5 py-0.5 rounded bg-muted border text-muted-foreground">
																			{match.target.unListType}
																		</span>
																		{match.target.referenceNumber && (
																			<span className="text-xs px-1.5 py-0.5 rounded bg-muted border text-muted-foreground">
																				Ref: {match.target.referenceNumber}
																			</span>
																		)}
																		{match.breakdown.identifierMatch && (
																			<span className="text-xs px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 font-medium">
																				ID exacto
																			</span>
																		)}
																	</div>
																	{match.target.aliases &&
																		match.target.aliases.length > 0 && (
																			<div className="flex items-start gap-1.5 text-muted-foreground">
																				<User className="h-3 w-3 shrink-0 mt-0.5" />
																				<span>
																					{match.target.aliases.join(", ")}
																				</span>
																			</div>
																		)}
																	{match.target.designations &&
																		match.target.designations.length > 0 && (
																			<div className="flex items-start gap-1.5 text-muted-foreground">
																				<Briefcase className="h-3 w-3 shrink-0 mt-0.5" />
																				<span>
																					{match.target.designations.join("; ")}
																				</span>
																			</div>
																		)}
																	{(match.target.birthDate ||
																		match.target.birthPlace ||
																		match.target.gender) && (
																		<div className="grid grid-cols-2 gap-1.5">
																			{match.target.birthDate && (
																				<div className="flex items-center gap-1.5 text-muted-foreground">
																					<Calendar className="h-3 w-3 shrink-0" />
																					<span>
																						{match.target.birthDate.slice(
																							0,
																							10,
																						)}
																					</span>
																				</div>
																			)}
																			{match.target.birthPlace && (
																				<div className="flex items-center gap-1.5 text-muted-foreground">
																					<MapPin className="h-3 w-3 shrink-0" />
																					<span>{match.target.birthPlace}</span>
																				</div>
																			)}
																			{match.target.gender && (
																				<div className="flex items-center gap-1.5 text-muted-foreground">
																					<User className="h-3 w-3 shrink-0" />
																					<span>{match.target.gender}</span>
																				</div>
																			)}
																			{match.target.nationalities &&
																				match.target.nationalities.length >
																					0 && (
																					<div className="flex items-center gap-1.5 text-muted-foreground">
																						<Flag className="h-3 w-3 shrink-0" />
																						<span>
																							{match.target.nationalities.join(
																								", ",
																							)}
																						</span>
																					</div>
																				)}
																		</div>
																	)}
																	{match.target.listedOn && (
																		<div className="flex items-center gap-1.5 text-muted-foreground">
																			<Calendar className="h-3 w-3 shrink-0" />
																			<span>
																				Listado:{" "}
																				{match.target.listedOn.slice(0, 10)}
																			</span>
																		</div>
																	)}
																	{match.target.addresses &&
																		match.target.addresses.length > 0 && (
																			<div className="flex items-start gap-1.5 text-muted-foreground">
																				<Building2 className="h-3 w-3 shrink-0 mt-0.5" />
																				<span>
																					{match.target.addresses.join(" · ")}
																				</span>
																			</div>
																		)}
																	{match.target.identifiers &&
																		match.target.identifiers.length > 0 && (
																			<div className="flex flex-wrap gap-1 pt-1 border-t">
																				{match.target.identifiers.map(
																					(ident, i) => (
																						<span
																							key={i}
																							className="text-xs px-1.5 py-0.5 rounded bg-muted border text-muted-foreground"
																						>
																							{ident.type}: {ident.number}
																						</span>
																					),
																				)}
																			</div>
																		)}
																	{match.target.remarks && (
																		<p className="italic text-muted-foreground pt-1 border-t">
																			{match.target.remarks}
																		</p>
																	)}
																</div>
															))}
														</div>
													</div>
												)}
											</div>
											{/* SAT 69-B — expandable matches */}
											<div className="bg-background">
												<div className="py-3 px-4">
													<div className="flex items-center gap-2 flex-wrap">
														<span className="text-sm font-medium flex-1">
															SAT 69-B (México)
														</span>
														<span
															className={cn(
																"inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium",
																(
																	WATCHLIST_STATUS_CONFIG[
																		(src?.sat69bStatus as WatchlistStatus) ??
																			"pending"
																	] ?? WATCHLIST_STATUS_CONFIG.pending
																).badgeClass,
															)}
														>
															<span
																className={cn(
																	"h-1.5 w-1.5 rounded-full shrink-0",
																	(
																		WATCHLIST_STATUS_CONFIG[
																			(src?.sat69bStatus as WatchlistStatus) ??
																				"pending"
																		] ?? WATCHLIST_STATUS_CONFIG.pending
																	).dotClass,
																)}
															/>
															{
																(
																	WATCHLIST_STATUS_CONFIG[
																		(src?.sat69bStatus as WatchlistStatus) ??
																			"pending"
																	] ?? WATCHLIST_STATUS_CONFIG.pending
																).label
															}
														</span>
														{(() => {
															const cnt = src
																? (src.sat69bCount ?? 0)
																: client.sat69bListed
																	? 1
																	: 0;
															return cnt > 0 ? (
																<span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 font-medium">
																	<AlertTriangle className="h-3 w-3" />
																	{cnt} {cnt === 1 ? "registro" : "registros"}
																</span>
															) : null;
														})()}
														{sat69bMatches.length > 0 && (
															<button
																type="button"
																onClick={() => setSat69bExpanded((v) => !v)}
																className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
															>
																{sat69bExpanded ? "Ocultar" : "Ver detalle"}
																<ChevronDown
																	className={cn(
																		"h-3 w-3 transition-transform duration-200",
																		sat69bExpanded && "rotate-180",
																	)}
																/>
															</button>
														)}
													</div>
												</div>
												{sat69bExpanded && sat69bMatches.length > 0 && (
													<div className="border-t px-4 py-3 bg-muted/20">
														<div className="max-h-80 overflow-y-auto space-y-2 pr-1">
															{sat69bMatches.map((match, idx) => {
																const statusColor =
																	match.target.taxpayerStatus ===
																	"Sentencia Favorable"
																		? "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
																		: match.target.taxpayerStatus.startsWith(
																					"Definitivo",
																			  )
																			? "border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
																			: "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
																const phases: Array<{
																	label: string;
																	data: typeof match.target.presumptionPhase;
																}> = [
																	{
																		label: "Presunción",
																		data: match.target.presumptionPhase,
																	},
																	{
																		label: "Desvirtuación",
																		data: match.target.rebuttalPhase,
																	},
																	{
																		label: "Definitivo",
																		data: match.target.definitivePhase,
																	},
																	{
																		label: "Sentencia Favorable",
																		data: match.target.favorablePhase,
																	},
																].filter(
																	(p) => p.data?.satDate || p.data?.dofDate,
																);
																return (
																	<div
																		key={match.target.id ?? idx}
																		className="rounded-md border bg-background p-3 space-y-1.5 text-xs"
																	>
																		<div className="flex items-start justify-between gap-2">
																			<p className="font-semibold text-sm leading-snug">
																				{match.target.taxpayerName}
																			</p>
																			<div className="flex items-center gap-1 shrink-0">
																				<ScoreBadge score={match.score} />
																				<span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5 tabular-nums">
																					{idx + 1}/{sat69bMatches.length}
																				</span>
																			</div>
																		</div>
																		<div className="flex flex-wrap gap-1">
																			<div className="flex items-center gap-1.5 text-muted-foreground">
																				<Hash className="h-3 w-3 shrink-0" />
																				<span className="font-mono">
																					{match.target.rfc}
																				</span>
																			</div>
																			<span
																				className={cn(
																					"text-xs px-1.5 py-0.5 rounded border font-medium",
																					statusColor,
																				)}
																			>
																				{match.target.taxpayerStatus}
																			</span>
																			{match.breakdown.identifierMatch && (
																				<span className="text-xs px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 font-medium">
																					RFC exacto
																				</span>
																			)}
																		</div>
																		{phases.length > 0 && (
																			<div className="space-y-1 pt-1.5 border-t">
																				{phases.map((phase) => (
																					<div
																						key={phase.label}
																						className="space-y-0.5"
																					>
																						<p className="font-medium text-foreground/80">
																							{phase.label}
																						</p>
																						{phase.data?.satNotice && (
																							<p className="text-muted-foreground pl-2">
																								SAT: {phase.data.satNotice}
																							</p>
																						)}
																						{phase.data?.dofNotice && (
																							<p className="text-muted-foreground pl-2">
																								DOF: {phase.data.dofNotice}
																							</p>
																						)}
																					</div>
																				))}
																			</div>
																		)}
																	</div>
																);
															})}
														</div>
													</div>
												)}
											</div>
											{/* PEP Oficial (Transparencia) — expandable records */}
											{showPepSearch && (
												<div className="bg-background">
													<div className="py-3 px-4">
														<div className="flex items-center gap-2 flex-wrap">
															<span className="text-sm font-medium flex-1">
																PEP Oficial (Transparencia)
															</span>
															<span
																className={cn(
																	"inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium",
																	pepOfficialCfg.badgeClass,
																)}
															>
																<span
																	className={cn(
																		"h-1.5 w-1.5 rounded-full shrink-0",
																		pepOfficialCfg.dotClass,
																	)}
																/>
																{pepOfficialCfg.label}
															</span>
															{(src?.pepOfficialCount ?? 0) > 0 && (
																<span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 font-medium">
																	<AlertTriangle className="h-3 w-3" />
																	{src?.pepOfficialCount}{" "}
																	{(src?.pepOfficialCount ?? 0) === 1
																		? "registro PEP"
																		: "registros PEPs"}
																</span>
															)}
															{pepOfficialRecords.length > 0 && (
																<button
																	type="button"
																	onClick={() =>
																		setPepRecordsExpanded((v) => !v)
																	}
																	className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
																>
																	{pepRecordsExpanded
																		? "Ocultar"
																		: "Ver detalle"}
																	<ChevronDown
																		className={cn(
																			"h-3 w-3 transition-transform duration-200",
																			pepRecordsExpanded && "rotate-180",
																		)}
																	/>
																</button>
															)}
														</div>
													</div>
													{pepRecordsExpanded &&
														pepOfficialRecords.length > 0 && (
															<div className="border-t px-4 py-3 bg-muted/20">
																<div className="max-h-80 overflow-y-auto space-y-2 pr-1">
																	{pepOfficialRecords.map((record, idx) => (
																		<div
																			key={record.id ?? idx}
																			className="rounded-md border bg-background p-3 space-y-1.5 text-xs"
																		>
																			<div className="flex items-start justify-between gap-2">
																				<p className="font-semibold text-sm leading-snug">
																					{record.nombre}
																				</p>
																				<span className="shrink-0 text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5 tabular-nums">
																					{idx + 1}/{pepOfficialRecords.length}
																				</span>
																			</div>
																			<div className="flex items-center gap-1.5 text-muted-foreground">
																				<Briefcase className="h-3 w-3 shrink-0" />
																				<span>{record.denominacion}</span>
																			</div>
																			<div className="flex items-center gap-1.5 text-muted-foreground">
																				<Users className="h-3 w-3 shrink-0" />
																				<span>{record.areaadscripcion}</span>
																			</div>
																			<div className="flex items-center gap-1.5 text-muted-foreground">
																				<Building2 className="h-3 w-3 shrink-0" />
																				<span>{record.sujetoobligado}</span>
																			</div>
																			<div className="grid grid-cols-2 gap-1.5">
																				<div className="flex items-center gap-1.5 text-muted-foreground">
																					<MapPin className="h-3 w-3 shrink-0" />
																					<span>
																						{record.entidadfederativa}
																					</span>
																				</div>
																				<div className="flex items-center gap-1.5 text-muted-foreground">
																					<Calendar className="h-3 w-3 shrink-0" />
																					<span>{record.periodoreporta}</span>
																				</div>
																			</div>
																			{(record.informacionPrincipal?.telefono ||
																				record.informacionPrincipal
																					?.correo) && (
																				<div className="flex flex-wrap gap-x-4 gap-y-1 pt-1.5 border-t">
																					{record.informacionPrincipal
																						?.telefono && (
																						<div className="flex items-center gap-1.5 text-muted-foreground">
																							<Phone className="h-3 w-3 shrink-0" />
																							<span>
																								{
																									record.informacionPrincipal
																										.telefono
																								}
																							</span>
																						</div>
																					)}
																					{record.informacionPrincipal
																						?.correo && (
																						<div className="flex items-center gap-1.5 text-muted-foreground">
																							<Mail className="h-3 w-3 shrink-0" />
																							<span>
																								{
																									record.informacionPrincipal
																										.correo
																								}
																							</span>
																						</div>
																					)}
																				</div>
																			)}
																		</div>
																	))}
																</div>
															</div>
														)}
												</div>
											)}

											{/* Detección PEP por IA */}
											{showPepGrok && (
												<div className="py-3 px-4 bg-background">
													<div className="flex items-center gap-2 flex-wrap">
														<span className="text-sm font-medium flex-1">
															Detección PEP por IA
														</span>
														<span
															className={cn(
																"inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium",
																pepAiCfg.badgeClass,
															)}
														>
															<span
																className={cn(
																	"h-1.5 w-1.5 rounded-full shrink-0",
																	pepAiCfg.dotClass,
																)}
															/>
															{pepAiCfg.label}
														</span>
														{pepAiResult &&
															typeof pepAiResult.probability === "number" && (
																<span
																	className={cn(
																		"inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium",
																		pepAiResult.probability > 0.5
																			? "border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
																			: "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
																	)}
																>
																	Prob. PEP:{" "}
																	{Math.round(pepAiResult.probability * 100)}%
																</span>
															)}
													</div>
													{pepAiSummary && (
														<p className="mt-1.5 text-xs text-muted-foreground italic">
															{pepAiSummary}
														</p>
													)}
													{pepAiResult?.sources &&
														pepAiResult.sources.length > 0 && (
															<div className="mt-1.5 flex flex-wrap gap-1">
																{pepAiResult.sources.map((source, i) => {
																	const isLink = looksLikeUrl(source);
																	const href = isLink
																		? ensureProtocol(source)
																		: null;
																	return isLink && href ? (
																		<a
																			key={i}
																			href={href}
																			onClick={(e) =>
																				extLink.handleExternalLink(href, e)
																			}
																			className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer"
																		>
																			<Link2 className="h-3 w-3 shrink-0" />
																			{extractHostname(source)}
																			<ExternalLink className="h-2.5 w-2.5 shrink-0" />
																		</a>
																	) : (
																		<span
																			key={i}
																			className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border"
																		>
																			{source}
																		</span>
																	);
																})}
															</div>
														)}
												</div>
											)}
											{showAdverseMedia && (
												<ScreeningSourceRow
													label="Media Adversa"
													status={
														src?.adverseMediaStatus ??
														(client.adverseMediaFlagged
															? "completed"
															: "pending")
													}
													riskBadge={
														src ? (
															<span
																className={cn(
																	"inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium",
																	ADVERSE_RISK_CONFIG[riskLevel].badgeClass,
																)}
															>
																Riesgo: {ADVERSE_RISK_CONFIG[riskLevel].label}
															</span>
														) : client.adverseMediaFlagged ? (
															<span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 font-medium">
																<AlertTriangle className="h-3 w-3" />
																Media adversa
															</span>
														) : undefined
													}
													findingsText={findingsText}
												>
													{(() => {
														const sources = adverseResult?.sources as
															| string[]
															| undefined;
														if (!sources || sources.length === 0) return null;
														return (
															<div className="mt-1.5 flex flex-wrap gap-1">
																{sources.map((source, i) => {
																	const isLink = looksLikeUrl(source);
																	const href = isLink
																		? ensureProtocol(source)
																		: null;
																	return isLink && href ? (
																		<a
																			key={i}
																			href={href}
																			onClick={(e) =>
																				extLink.handleExternalLink(href, e)
																			}
																			className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer"
																		>
																			<Link2 className="h-3 w-3 shrink-0" />
																			{extractHostname(source)}
																			<ExternalLink className="h-2.5 w-2.5 shrink-0" />
																		</a>
																	) : (
																		<span
																			key={i}
																			className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border"
																		>
																			{source}
																		</span>
																	);
																})}
															</div>
														);
													})()}
												</ScreeningSourceRow>
											)}
										</div>
									)}

									{/* View watchlist query button */}
									{client.watchlistQueryId && (
										<div className="flex justify-end pt-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													window.open(
														`${process.env.NEXT_PUBLIC_WATCHLIST_APP_URL}/queries/${client.watchlistQueryId}`,
														"_blank",
														"noopener,noreferrer",
													)
												}
											>
												<ExternalLink className="h-4 w-4 mr-2" />
												{t("clientViewWatchlistQuery")}
											</Button>
										</div>
									)}
								</div>
							);
						})()}
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
						<p className="text-xs text-muted-foreground mb-3">
							{t("documentsLegalBasisArt18")}
						</p>
						{client?.identificationTier != null && (
							<div
								className={cn(
									"flex gap-3 rounded-lg border p-3 mb-3",
									client.identificationTier === "BELOW_THRESHOLD"
										? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50"
										: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50",
								)}
							>
								{client.identificationTier === "BELOW_THRESHOLD" ? (
									<Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
								) : (
									<AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
								)}
								<p
									className={cn(
										"text-xs",
										client.identificationTier === "BELOW_THRESHOLD"
											? "text-blue-700 dark:text-blue-300"
											: "text-amber-700 dark:text-amber-300",
									)}
								>
									{client.identificationTier === "BELOW_THRESHOLD"
										? t("documentsOptionalBanner")
										: t("documentsRequiredBanner")}
								</p>
							</div>
						)}
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

												{/* Document page thumbnails */}
												{hasDoc && doc && currentOrg?.id && (
													<DocumentThumbnailRow
														document={doc}
														orgId={currentOrg.id}
														onImageClick={(images, idx) => {
															setDocumentViewer({
																open: true,
																images,
																initialIndex: idx,
																originalFileUrl: (doc.metadata as any)
																	?.originalFileUrl,
															});
														}}
													/>
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

				{/* Shareholders (for moral/trust) */}
				{needsUBOs && (
					<AccordionItem
						value="shareholders"
						id="shareholders"
						className="border rounded-lg overflow-hidden bg-card shadow-sm"
					>
						<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
							<div className="flex items-center justify-between w-full pr-4">
								<div className="flex items-center gap-3">
									<Building2 className="h-5 w-5" />
									<span className="font-semibold">Accionistas</span>
									<Badge variant="secondary">{shareholders.length}</Badge>
								</div>
								<div className="flex items-center gap-2">
									{hasShareholders ? (
										<CheckCircle2 className="h-5 w-5 text-green-500" />
									) : (
										<AlertTriangle className="h-5 w-5 text-amber-500" />
									)}
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="px-6 pb-4">
							{shareholders.length > 0 ? (
								<div className="space-y-2">
									{shareholders.map((shareholder) => {
										const Icon =
											shareholder.entityType === "COMPANY" ? Building2 : User;
										return (
											<div
												key={shareholder.id}
												className="p-3 rounded-lg border bg-muted/30"
											>
												<div className="flex items-center justify-between">
													<div>
														<div className="flex items-center gap-2">
															<Icon className="h-4 w-4 text-muted-foreground" />
															<p className="font-medium text-sm">
																{getShareholderDisplayName(shareholder)}
															</p>
															<Badge variant="outline" className="text-xs">
																{getEntityTypeLabel(shareholder.entityType)}
															</Badge>
														</div>
														<p className="text-xs text-muted-foreground mt-1">
															Participación: {shareholder.ownershipPercentage}%
															{shareholder.rfc && ` • RFC: ${shareholder.rfc}`}
															{shareholder.taxId &&
																` • Tax ID: ${shareholder.taxId}`}
														</p>
													</div>
												</div>
											</div>
										);
									})}
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

							{/* Edit button */}
							<div className="mt-4 pt-4 border-t flex justify-end">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => navigateToEdit("ownership", "shareholders")}
								>
									<Pencil className="h-4 w-4 mr-2" />
									{!hasShareholders ? "Agregar Accionistas" : t("edit")}
								</Button>
							</div>
						</AccordionContent>
					</AccordionItem>
				)}

				{/* Beneficial Controllers (for moral/trust) */}
				{needsUBOs && (
					<AccordionItem
						value="beneficial-controllers"
						id="beneficial-controllers"
						className="border rounded-lg overflow-hidden bg-card shadow-sm"
					>
						<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
							<div className="flex items-center justify-between w-full pr-4">
								<div className="flex items-center gap-3">
									<Users className="h-5 w-5" />
									<span className="font-semibold">
										Beneficiarios Controladores
									</span>
									<Badge variant="secondary">
										{beneficialControllers.length}
									</Badge>
								</div>
								<div className="flex items-center gap-2">
									{hasBCs ? (
										<CheckCircle2 className="h-5 w-5 text-green-500" />
									) : (
										<AlertTriangle className="h-5 w-5 text-amber-500" />
									)}
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="px-6 pb-4">
							{beneficialControllers.length > 0 ? (
								<div className="space-y-2">
									{beneficialControllers.map((bc) => (
										<div
											key={bc.id}
											className="p-3 rounded-lg border bg-muted/30"
										>
											<div className="flex items-center justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-2">
														<User className="h-4 w-4 text-muted-foreground" />
														<p className="font-medium text-sm">
															{getBCDisplayName(bc)}
														</p>
														<Badge variant="outline" className="text-xs">
															{getBCTypeLabel(bc.bcType)}
														</Badge>
														{bc.isLegalRepresentative && (
															<Badge variant="secondary" className="text-xs">
																Rep. Legal
															</Badge>
														)}
													</div>
													<p className="text-xs text-muted-foreground mt-1">
														{bc.curp && `CURP: ${bc.curp}`}
														{bc.rfc && ` • RFC: ${bc.rfc}`}
													</p>
													{/* Screening Status */}
													{bc.screeningResult &&
														bc.screeningResult !== "pending" && (
															<div className="flex items-center gap-2 mt-2">
																{bc.isPEP && (
																	<Badge
																		variant="destructive"
																		className="text-xs"
																	>
																		PEP
																	</Badge>
																)}
																{bc.ofacSanctioned && (
																	<Badge
																		variant="destructive"
																		className="text-xs"
																	>
																		OFAC
																	</Badge>
																)}
																{bc.unscSanctioned && (
																	<Badge
																		variant="destructive"
																		className="text-xs"
																	>
																		UNSC
																	</Badge>
																)}
																{bc.sat69bListed && (
																	<Badge
																		variant="destructive"
																		className="text-xs"
																	>
																		SAT 69-B
																	</Badge>
																)}
																{bc.adverseMediaFlagged && (
																	<Badge
																		variant="destructive"
																		className="text-xs"
																	>
																		Media Adversa
																	</Badge>
																)}
																{!bc.isPEP &&
																	!bc.ofacSanctioned &&
																	!bc.unscSanctioned &&
																	!bc.sat69bListed &&
																	!bc.adverseMediaFlagged && (
																		<Badge
																			variant="outline"
																			className="text-xs text-green-600"
																		>
																			Sin alertas
																		</Badge>
																	)}
															</div>
														)}
												</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20">
									<div className="flex items-center gap-2">
										<AlertTriangle className="h-4 w-4 text-amber-600" />
										<span className="text-sm text-amber-700 dark:text-amber-300">
											No hay beneficiarios controladores registrados
										</span>
									</div>
								</div>
							)}

							{/* Edit button */}
							<div className="mt-4 pt-4 border-t flex justify-end">
								<Button
									variant="ghost"
									size="sm"
									onClick={() =>
										navigateToEdit("ownership", "beneficial-controllers")
									}
								>
									<Pencil className="h-4 w-4 mr-2" />
									{!hasBCs ? "Agregar Beneficiarios Controladores" : t("edit")}
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

				{/* KYC Self-Service Sessions */}
				<AccordionItem
					value="kyc-sessions"
					id="kyc-sessions"
					className="border rounded-lg overflow-hidden bg-card shadow-sm"
				>
					<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
						<div className="flex items-center gap-3">
							<Link2 className="h-5 w-5" />
							<span className="font-semibold">KYC Autoservicio</span>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-6 pb-6">
						<KycSessionSection
							clientId={client.id}
							clientEmail={client.email ?? null}
							kycSelfServiceUrl={getKycBaseUrl()}
						/>
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

			{/* External Link Redirect Dialog */}
			<ExternalLinkDialog
				open={extLink.isOpen}
				url={extLink.pendingUrl}
				onConfirm={extLink.confirm}
				onCancel={extLink.cancel}
			/>
		</div>
	);
}

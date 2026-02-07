import type { EnrichedCatalogItem } from "./catalog";

// Activity codes for all 19 vulnerable activities (matches aml-svc)
export type ActivityCode =
	| "VEH" // Vehicles
	| "INM" // Real Estate
	| "MJR" // Jewelry
	| "AVI" // Virtual Assets
	| "JYS" // Gambling
	| "ARI" // Rentals
	| "BLI" // Armoring
	| "DON" // Donations
	| "MPC" // Loans
	| "FEP" // Public Officials (Notarios)
	| "FES" // Notary (Corredores) -- DISABLED on frontend (no XSD)
	| "SPR" // Professional Services
	| "CHV" // Traveler Checks
	| "TSC" // Credit Cards
	| "TPP" // Prepaid Cards
	| "TDR" // Rewards
	| "TCV" // Valuables
	| "OBA" // Art
	| "DIN"; // Development

/** All 19 activity codes for backend compatibility */
export const ACTIVITY_CODES: ActivityCode[] = [
	"VEH",
	"INM",
	"MJR",
	"AVI",
	"JYS",
	"ARI",
	"BLI",
	"DON",
	"MPC",
	"FEP",
	"FES",
	"SPR",
	"CHV",
	"TSC",
	"TPP",
	"TDR",
	"TCV",
	"OBA",
	"DIN",
];

/** 18 enabled activity codes (FES excluded -- no XSD schema available) */
export const ENABLED_ACTIVITY_CODES: ActivityCode[] = ACTIVITY_CODES.filter(
	(code) => code !== "FES",
);

export type WatchlistStatus =
	| "PENDING"
	| "QUEUED"
	| "CHECKING"
	| "COMPLETED"
	| "ERROR"
	| "NOT_AVAILABLE";

export type DataSource = "CFDI" | "MANUAL" | "IMPORT" | "ENRICHED";
export type CompletenessStatus = "COMPLETE" | "INCOMPLETE" | "MINIMUM";

// --- Payment ---

export interface OperationPaymentEntity {
	id: string;
	operationId: string;
	paymentDate: string;
	paymentFormCode: string;
	monetaryInstrumentCode: string | null;
	currencyCode: string;
	amount: string;
	bankName: string | null;
	accountNumberMasked: string | null;
	checkNumber: string | null;
	reference: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface OperationPaymentInput {
	paymentDate: string;
	paymentFormCode: string;
	monetaryInstrumentCode?: string | null;
	currencyCode?: string;
	amount: string;
	bankName?: string | null;
	accountNumberMasked?: string | null;
	checkNumber?: string | null;
	reference?: string | null;
}

// --- Activity Extension Types ---

export type VehicleType = "LAND" | "MARINE" | "AIR";

export interface VehicleExtension {
	id: string;
	operationId: string;
	vehicleType: VehicleType;
	brand: string;
	model: string;
	year: number;
	vin: string | null;
	repuve: string | null;
	plates: string | null;
	serialNumber: string | null;
	flagCountryCode: string | null;
	registrationNumber: string | null;
	armorLevelCode: string | null;
	engineNumber: string | null;
	description: string | null;
}

export interface RealEstateExtension {
	id: string;
	operationId: string;
	propertyTypeCode: string;
	street: string | null;
	externalNumber: string | null;
	internalNumber: string | null;
	neighborhood: string | null;
	postalCode: string | null;
	municipality: string | null;
	stateCode: string | null;
	countryCode: string | null;
	registryFolio: string | null;
	registryDate: string | null;
	landAreaM2: string | null;
	constructionAreaM2: string | null;
	clientFigureCode: string | null;
	personFigureCode: string | null;
	description: string | null;
}

export interface JewelryExtension {
	id: string;
	operationId: string;
	itemTypeCode: string;
	metalType: string | null;
	weightGrams: string | null;
	purity: string | null;
	jewelryDescription: string | null;
	brand: string | null;
	serialNumber: string | null;
	tradeUnitCode: string | null;
	quantity: string | null;
	unitPrice: string | null;
}

export interface VirtualAssetExtension {
	id: string;
	operationId: string;
	assetTypeCode: string;
	assetName: string | null;
	walletAddressOrigin: string | null;
	walletAddressDestination: string | null;
	exchangeName: string | null;
	exchangeCountryCode: string | null;
	assetQuantity: string | null;
	assetUnitPrice: string | null;
	blockchainTxHash: string | null;
}

export interface GamblingExtension {
	id: string;
	operationId: string;
	gameTypeCode: string | null;
	businessLineCode: string | null;
	operationMethodCode: string | null;
	prizeAmount: string | null;
	betAmount: string | null;
	ticketNumber: string | null;
	eventName: string | null;
	eventDate: string | null;
	propertyTypeCode: string | null;
	propertyDescription: string | null;
}

export interface RentalExtension {
	id: string;
	operationId: string;
	propertyTypeCode: string;
	rentalPeriodMonths: number | null;
	monthlyRent: string | null;
	depositAmount: string | null;
	contractStartDate: string | null;
	contractEndDate: string | null;
	street: string | null;
	externalNumber: string | null;
	internalNumber: string | null;
	neighborhood: string | null;
	postalCode: string | null;
	municipality: string | null;
	stateCode: string | null;
	isPrepaid: boolean | null;
	prepaidMonths: number | null;
	description: string | null;
}

export interface ArmoringExtension {
	id: string;
	operationId: string;
	itemType: string;
	itemStatusCode: string | null;
	armorLevelCode: string;
	armoredPartCode: string | null;
	vehicleType: string | null;
	vehicleBrand: string | null;
	vehicleModel: string | null;
	vehicleYear: number | null;
	vehicleVin: string | null;
	vehiclePlates: string | null;
	serviceDescription: string | null;
}

export interface DonationExtension {
	id: string;
	operationId: string;
	donationType: string;
	purpose: string | null;
	itemTypeCode: string | null;
	itemDescription: string | null;
	itemValue: string | null;
	isAnonymous: boolean | null;
	campaignName: string | null;
}

export interface LoanExtension {
	id: string;
	operationId: string;
	loanTypeCode: string | null;
	guaranteeTypeCode: string | null;
	principalAmount: string;
	interestRate: string | null;
	termMonths: number | null;
	monthlyPayment: string | null;
	disbursementDate: string | null;
	maturityDate: string | null;
	guaranteeDescription: string | null;
	guaranteeValue: string | null;
}

export interface OfficialExtension {
	id: string;
	operationId: string;
	actTypeCode: string;
	instrumentNumber: string | null;
	instrumentDate: string | null;
	trustTypeCode: string | null;
	trustIdentifier: string | null;
	trustPurpose: string | null;
	movementTypeCode: string | null;
	assignmentTypeCode: string | null;
	mergerTypeCode: string | null;
	incorporationReasonCode: string | null;
	patrimonyModificationTypeCode: string | null;
	powerOfAttorneyTypeCode: string | null;
	grantingTypeCode: string | null;
	shareholderPositionCode: string | null;
	sharePercentage: string | null;
	itemTypeCode: string | null;
	itemDescription: string | null;
	itemValue: string | null;
}

export interface NotaryExtension {
	id: string;
	operationId: string;
	actTypeCode: string;
	notaryNumber: string | null;
	notaryStateCode: string | null;
	instrumentNumber: string | null;
	instrumentDate: string | null;
	legalEntityTypeCode: string | null;
	personCharacterTypeCode: string | null;
	incorporationReasonCode: string | null;
	patrimonyModificationTypeCode: string | null;
	powerOfAttorneyTypeCode: string | null;
	grantingTypeCode: string | null;
	shareholderPositionCode: string | null;
	sharePercentage: string | null;
	itemTypeCode: string | null;
	itemDescription: string | null;
	appraisalValue: string | null;
	guaranteeTypeCode: string | null;
}

export interface ProfessionalExtension {
	id: string;
	operationId: string;
	serviceTypeCode: string;
	serviceAreaCode: string | null;
	clientFigureCode: string | null;
	contributionReasonCode: string | null;
	assignmentTypeCode: string | null;
	mergerTypeCode: string | null;
	incorporationReasonCode: string | null;
	shareholderPositionCode: string | null;
	sharePercentage: string | null;
	managedAssetTypeCode: string | null;
	managementStatusCode: string | null;
	financialInstitutionTypeCode: string | null;
	financialInstitutionName: string | null;
	occupationCode: string | null;
	serviceDescription: string | null;
}

export interface TravelerCheckExtension {
	id: string;
	operationId: string;
	denominationCode: string;
	checkCount: number;
	serialNumbers: string | null;
	issuerName: string | null;
	issuerCountryCode: string | null;
}

export interface CardExtension {
	id: string;
	operationId: string;
	cardTypeCode: string;
	cardNumberMasked: string | null;
	cardBrand: string | null;
	issuerName: string | null;
	creditLimit: string | null;
	transactionType: string | null;
}

export interface PrepaidExtension {
	id: string;
	operationId: string;
	cardType: string;
	cardNumberMasked: string | null;
	isInitialLoad: boolean | null;
	reloadAmount: string | null;
	currentBalance: string | null;
	issuerName: string | null;
}

export interface RewardExtension {
	id: string;
	operationId: string;
	rewardType: string;
	programName: string | null;
	pointsAmount: string | null;
	pointsValue: string | null;
	pointsExpiryDate: string | null;
	redemptionType: string | null;
	redemptionDescription: string | null;
}

export interface ValuableExtension {
	id: string;
	operationId: string;
	valueTypeCode: string;
	serviceTypeCode: string | null;
	transportMethod: string | null;
	originAddress: string | null;
	destinationAddress: string | null;
	custodyStartDate: string | null;
	custodyEndDate: string | null;
	storageLocation: string | null;
	declaredValue: string | null;
	insuredValue: string | null;
	description: string | null;
}

export interface ArtExtension {
	id: string;
	operationId: string;
	artworkTypeCode: string;
	title: string | null;
	artist: string | null;
	yearCreated: number | null;
	medium: string | null;
	dimensions: string | null;
	provenance: string | null;
	certificateAuthenticity: string | null;
	previousOwner: string | null;
	isAntique: boolean | null;
	auctionHouse: string | null;
	lotNumber: string | null;
}

export interface DevelopmentExtension {
	id: string;
	operationId: string;
	developmentTypeCode: string;
	creditTypeCode: string | null;
	projectName: string | null;
	projectLocation: string | null;
	contributionType: string | null;
	contributionAmount: string | null;
	thirdPartyTypeCode: string | null;
	thirdPartyName: string | null;
	financialInstitutionTypeCode: string | null;
	financialInstitutionName: string | null;
}

// --- Main Operation Entity ---

export interface OperationEntity {
	id: string;
	organizationId: string;
	clientId: string;
	invoiceId: string | null;
	// Activity
	activityCode: ActivityCode;
	operationTypeCode: string | null;
	// Core
	operationDate: string;
	branchPostalCode: string;
	amount: string;
	currencyCode: string;
	exchangeRate: string | null;
	amountMxn: string | null;
	// UMA
	umaValue: string | null;
	umaDailyValue: string | null;
	// Alert
	alertTypeCode: string;
	alertDescription: string | null;
	// Watchlist
	watchlistStatus: WatchlistStatus | null;
	watchlistCheckedAt: string | null;
	watchlistResult: Record<string, unknown> | null;
	watchlistFlags: string | null;
	// Priority
	priorityCode: string | null;
	// Data origin & completeness
	dataSource: DataSource;
	completenessStatus: CompletenessStatus;
	missingFields: string[] | null;
	// Metadata
	referenceNumber: string | null;
	notes: string | null;
	// Timestamps
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	// Relations
	payments: OperationPaymentEntity[];
	// Activity extension data (only one will be populated based on activityCode)
	vehicle?: VehicleExtension | null;
	realEstate?: RealEstateExtension | null;
	jewelry?: JewelryExtension | null;
	virtualAsset?: VirtualAssetExtension | null;
	gambling?: GamblingExtension | null;
	rental?: RentalExtension | null;
	armoring?: ArmoringExtension | null;
	donation?: DonationExtension | null;
	loan?: LoanExtension | null;
	official?: OfficialExtension | null;
	notary?: NotaryExtension | null;
	professional?: ProfessionalExtension | null;
	travelerCheck?: TravelerCheckExtension | null;
	card?: CardExtension | null;
	prepaid?: PrepaidExtension | null;
	reward?: RewardExtension | null;
	valuable?: ValuableExtension | null;
	art?: ArtExtension | null;
	development?: DevelopmentExtension | null;
	// Enriched catalog items
	activityCatalog?: EnrichedCatalogItem | null;
	operationTypeCatalog?: EnrichedCatalogItem | null;
	currencyCatalog?: EnrichedCatalogItem | null;
	alertTypeCatalog?: EnrichedCatalogItem | null;
}

// --- Request Types ---

/** Input for creating a new operation extension (omit id and operationId, set at backend) */
type ExtensionInput<T> = Omit<T, "id" | "operationId">;

export interface OperationCreateRequest {
	clientId: string;
	invoiceId?: string | null;
	activityCode: ActivityCode;
	operationTypeCode?: string | null;
	operationDate: string;
	branchPostalCode: string;
	amount: string;
	currencyCode?: string;
	exchangeRate?: string | null;
	alertTypeCode?: string;
	alertDescription?: string | null;
	priorityCode?: string;
	dataSource?: DataSource;
	completenessStatus?: CompletenessStatus;
	missingFields?: string[] | null;
	referenceNumber?: string | null;
	notes?: string | null;
	payments: OperationPaymentInput[];
	// Extensions (only one should be provided, matching activityCode)
	vehicle?: ExtensionInput<VehicleExtension>;
	realEstate?: ExtensionInput<RealEstateExtension>;
	jewelry?: ExtensionInput<JewelryExtension>;
	virtualAsset?: ExtensionInput<VirtualAssetExtension>;
	gambling?: ExtensionInput<GamblingExtension>;
	rental?: ExtensionInput<RentalExtension>;
	armoring?: ExtensionInput<ArmoringExtension>;
	donation?: ExtensionInput<DonationExtension>;
	loan?: ExtensionInput<LoanExtension>;
	official?: ExtensionInput<OfficialExtension>;
	notary?: ExtensionInput<NotaryExtension>;
	professional?: ExtensionInput<ProfessionalExtension>;
	travelerCheck?: ExtensionInput<TravelerCheckExtension>;
	card?: ExtensionInput<CardExtension>;
	prepaid?: ExtensionInput<PrepaidExtension>;
	reward?: ExtensionInput<RewardExtension>;
	valuable?: ExtensionInput<ValuableExtension>;
	art?: ExtensionInput<ArtExtension>;
	development?: ExtensionInput<DevelopmentExtension>;
}

export interface OperationUpdateRequest {
	// clientId and activityCode are immutable after creation
	invoiceId?: string | null;
	operationTypeCode?: string | null;
	operationDate: string;
	branchPostalCode: string;
	amount: string;
	currencyCode?: string;
	exchangeRate?: string | null;
	alertTypeCode?: string;
	alertDescription?: string | null;
	priorityCode?: string;
	dataSource?: DataSource;
	completenessStatus?: CompletenessStatus;
	missingFields?: string[] | null;
	referenceNumber?: string | null;
	notes?: string | null;
	payments: OperationPaymentInput[];
	// Extensions
	vehicle?: ExtensionInput<VehicleExtension>;
	realEstate?: ExtensionInput<RealEstateExtension>;
	jewelry?: ExtensionInput<JewelryExtension>;
	virtualAsset?: ExtensionInput<VirtualAssetExtension>;
	gambling?: ExtensionInput<GamblingExtension>;
	rental?: ExtensionInput<RentalExtension>;
	armoring?: ExtensionInput<ArmoringExtension>;
	donation?: ExtensionInput<DonationExtension>;
	loan?: ExtensionInput<LoanExtension>;
	official?: ExtensionInput<OfficialExtension>;
	notary?: ExtensionInput<NotaryExtension>;
	professional?: ExtensionInput<ProfessionalExtension>;
	travelerCheck?: ExtensionInput<TravelerCheckExtension>;
	card?: ExtensionInput<CardExtension>;
	prepaid?: ExtensionInput<PrepaidExtension>;
	reward?: ExtensionInput<RewardExtension>;
	valuable?: ExtensionInput<ValuableExtension>;
	art?: ExtensionInput<ArtExtension>;
	development?: ExtensionInput<DevelopmentExtension>;
}

// --- Pagination & List ---

export interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface OperationListResponse {
	data: OperationEntity[];
	pagination: Pagination;
}

// --- Helpers ---

/** Map from ActivityCode to the key used in OperationEntity for the extension */
export const ACTIVITY_EXTENSION_KEY: Record<
	ActivityCode,
	keyof OperationEntity | null
> = {
	VEH: "vehicle",
	INM: "realEstate",
	MJR: "jewelry",
	AVI: "virtualAsset",
	JYS: "gambling",
	ARI: "rental",
	BLI: "armoring",
	DON: "donation",
	MPC: "loan",
	FEP: "official",
	FES: "notary",
	SPR: "professional",
	CHV: "travelerCheck",
	TSC: "card",
	TPP: "prepaid",
	TDR: "reward",
	TCV: "valuable",
	OBA: "art",
	DIN: "development",
};

/** Get the extension data from an operation entity by its activity code */
export function getExtensionData(
	operation: OperationEntity,
): Record<string, unknown> | null | undefined {
	const key = ACTIVITY_EXTENSION_KEY[operation.activityCode];
	if (!key) return null;
	return operation[key] as Record<string, unknown> | null | undefined;
}

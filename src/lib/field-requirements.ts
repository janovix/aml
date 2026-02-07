/**
 * Three-tier field completeness registry.
 *
 * Maps each ActivityCode to its field requirements, derived from:
 * - SAT XSD schemas (RED = sat_required)
 * - Alert type CSV (YELLOW = alert_required)
 * - AML/KYC best practices (GREY = kyc_optional)
 *
 * FES is excluded (no XSD schema available).
 */

import type { ActivityCode } from "@/types/operation";
import type {
	FieldTier,
	FieldRequirement,
	CompletenessResult,
	CompletenessEntityType,
} from "@/types/completeness";

// --- Common client fields (persona_aviso, shared across all XSDs) ---

const CLIENT_PERSONA_FISICA_RED: FieldRequirement[] = [
	{
		fieldPath: "client.firstName",
		tier: "sat_required",
		label: "Nombre",
		xsdElement: "nombre",
	},
	{
		fieldPath: "client.lastName",
		tier: "sat_required",
		label: "Apellido paterno",
		xsdElement: "apellido_paterno",
	},
	{
		fieldPath: "client.secondLastName",
		tier: "sat_required",
		label: "Apellido materno",
		xsdElement: "apellido_materno",
	},
	{
		fieldPath: "client.countryCode",
		tier: "sat_required",
		label: "País/Nacionalidad",
		xsdElement: "pais_nacionalidad",
	},
	{
		fieldPath: "client.economicActivityCode",
		tier: "sat_required",
		label: "Actividad económica",
		xsdElement: "actividad_economica",
	},
];

const CLIENT_PERSONA_MORAL_RED: FieldRequirement[] = [
	{
		fieldPath: "client.businessName",
		tier: "sat_required",
		label: "Denominación/Razón social",
		xsdElement: "denominacion_razon",
	},
	{
		fieldPath: "client.countryCode",
		tier: "sat_required",
		label: "País/Nacionalidad",
		xsdElement: "pais_nacionalidad",
	},
	{
		fieldPath: "client.economicActivityCode",
		tier: "sat_required",
		label: "Giro mercantil / Actividad económica",
		xsdElement: "giro_mercantil",
	},
];

const CLIENT_YELLOW: FieldRequirement[] = [
	{
		fieldPath: "client.rfc",
		tier: "alert_required",
		label: "RFC",
		alertCodes: ["WATCHLIST", "INCOME_MATCH"],
	},
	{
		fieldPath: "client.curp",
		tier: "alert_required",
		label: "CURP",
		alertCodes: ["WATCHLIST", "IDENTITY"],
	},
	{
		fieldPath: "client.birthDate",
		tier: "alert_required",
		label: "Fecha de nacimiento",
		alertCodes: ["AGE_RISK", "IDENTITY"],
	},
	{
		fieldPath: "client.phone",
		tier: "alert_required",
		label: "Teléfono",
		alertCodes: ["CONTACT_VERIFY"],
	},
	{
		fieldPath: "client.email",
		tier: "alert_required",
		label: "Correo electrónico",
		alertCodes: ["CONTACT_VERIFY"],
	},
	{
		fieldPath: "client.street",
		tier: "alert_required",
		label: "Domicilio - Calle",
		alertCodes: ["GEO_RISK"],
	},
	{
		fieldPath: "client.postalCode",
		tier: "alert_required",
		label: "Domicilio - Código postal",
		alertCodes: ["GEO_RISK"],
	},
];

const CLIENT_GREY: FieldRequirement[] = [
	{
		fieldPath: "client.isPEP",
		tier: "kyc_optional",
		label: "PEP (Persona políticamente expuesta)",
	},
	{ fieldPath: "client.gender", tier: "kyc_optional", label: "Género" },
	{
		fieldPath: "client.maritalStatus",
		tier: "kyc_optional",
		label: "Estado civil",
	},
	{
		fieldPath: "client.occupation",
		tier: "kyc_optional",
		label: "Ocupación/Profesión",
	},
	{
		fieldPath: "client.sourceOfFunds",
		tier: "kyc_optional",
		label: "Origen de los recursos",
	},
	{
		fieldPath: "client.sourceOfWealth",
		tier: "kyc_optional",
		label: "Origen del patrimonio",
	},
];

// --- Common payment fields (datos_liquidacion, shared across all XSDs) ---

const PAYMENT_RED: FieldRequirement[] = [
	{
		fieldPath: "payment.paymentDate",
		tier: "sat_required",
		label: "Fecha de pago",
		xsdElement: "fecha_pago",
	},
	{
		fieldPath: "payment.paymentFormCode",
		tier: "sat_required",
		label: "Forma de pago",
		xsdElement: "forma_pago",
	},
	{
		fieldPath: "payment.currencyCode",
		tier: "sat_required",
		label: "Moneda",
		xsdElement: "moneda",
	},
	{
		fieldPath: "payment.amount",
		tier: "sat_required",
		label: "Monto de operación",
		xsdElement: "monto_operacion",
	},
];

const PAYMENT_YELLOW: FieldRequirement[] = [
	{
		fieldPath: "payment.monetaryInstrumentCode",
		tier: "alert_required",
		label: "Instrumento monetario",
		alertCodes: ["CASH_PAYMENT", "FOREIGN_TRANSFER"],
	},
];

const PAYMENT_GREY: FieldRequirement[] = [
	{
		fieldPath: "payment.bankName",
		tier: "kyc_optional",
		label: "Nombre del banco",
	},
	{
		fieldPath: "payment.accountNumberMasked",
		tier: "kyc_optional",
		label: "Número de cuenta",
	},
	{
		fieldPath: "payment.reference",
		tier: "kyc_optional",
		label: "Referencia de pago",
	},
];

// --- Common operation fields (shared across all activities) ---

const OPERATION_COMMON_RED: FieldRequirement[] = [
	{
		fieldPath: "operation.operationDate",
		tier: "sat_required",
		label: "Fecha de operación",
		xsdElement: "fecha_operacion",
	},
	{
		fieldPath: "operation.branchPostalCode",
		tier: "sat_required",
		label: "Código postal sucursal",
		xsdElement: "codigo_postal",
	},
	{
		fieldPath: "operation.amount",
		tier: "sat_required",
		label: "Monto de la operación",
		xsdElement: "monto_operacion",
	},
];

const OPERATION_COMMON_YELLOW: FieldRequirement[] = [
	{
		fieldPath: "operation.alertTypeCode",
		tier: "alert_required",
		label: "Tipo de alerta",
		alertCodes: ["ALL"],
	},
];

const OPERATION_COMMON_GREY: FieldRequirement[] = [
	{
		fieldPath: "operation.notes",
		tier: "kyc_optional",
		label: "Notas de la operación",
	},
	{
		fieldPath: "operation.referenceNumber",
		tier: "kyc_optional",
		label: "Número de referencia",
	},
];

// --- Activity-specific extension fields (from XSD per activity) ---

type ExtensionFieldMap = Partial<Record<ActivityCode, FieldRequirement[]>>;

const EXTENSION_RED: ExtensionFieldMap = {
	VEH: [
		{
			fieldPath: "extension.vehicleType",
			tier: "sat_required",
			label: "Tipo de vehículo",
			xsdElement: "tipo_vehiculo",
		},
		{
			fieldPath: "extension.brand",
			tier: "sat_required",
			label: "Marca/Fabricante",
			xsdElement: "marca_fabricante",
		},
		{
			fieldPath: "extension.model",
			tier: "sat_required",
			label: "Modelo",
			xsdElement: "modelo",
		},
		{
			fieldPath: "extension.year",
			tier: "sat_required",
			label: "Año",
			xsdElement: "anio",
		},
	],
	INM: [
		{
			fieldPath: "extension.propertyTypeCode",
			tier: "sat_required",
			label: "Tipo de inmueble",
			xsdElement: "tipo_inmueble",
		},
		{
			fieldPath: "extension.street",
			tier: "sat_required",
			label: "Calle",
			xsdElement: "calle",
		},
		{
			fieldPath: "extension.externalNumber",
			tier: "sat_required",
			label: "Número exterior",
			xsdElement: "numero_exterior",
		},
		{
			fieldPath: "extension.postalCode",
			tier: "sat_required",
			label: "Código postal",
			xsdElement: "codigo_postal",
		},
		{
			fieldPath: "extension.registryFolio",
			tier: "sat_required",
			label: "Folio real",
			xsdElement: "folio_real",
		},
		{
			fieldPath: "extension.landAreaM2",
			tier: "sat_required",
			label: "Superficie terreno (m²)",
			xsdElement: "dimension_terreno",
		},
		{
			fieldPath: "extension.constructionAreaM2",
			tier: "sat_required",
			label: "Superficie construcción (m²)",
			xsdElement: "dimension_construido",
		},
	],
	MJR: [
		{
			fieldPath: "extension.itemTypeCode",
			tier: "sat_required",
			label: "Tipo de artículo",
			xsdElement: "tipo_articulo",
		},
	],
	AVI: [
		{
			fieldPath: "extension.assetTypeCode",
			tier: "sat_required",
			label: "Tipo de activo virtual",
			xsdElement: "tipo_activo_virtual",
		},
		{
			fieldPath: "extension.blockchainTxHash",
			tier: "sat_required",
			label: "Hash de operación",
			xsdElement: "hash_operacion",
		},
	],
	JYS: [
		{
			fieldPath: "extension.gameTypeCode",
			tier: "sat_required",
			label: "Tipo de juego",
			xsdElement: "tipo_juego",
		},
	],
	ARI: [
		{
			fieldPath: "extension.propertyTypeCode",
			tier: "sat_required",
			label: "Tipo de inmueble",
			xsdElement: "tipo_inmueble",
		},
	],
	BLI: [
		{
			fieldPath: "extension.itemType",
			tier: "sat_required",
			label: "Tipo de artículo",
			xsdElement: "tipo_articulo",
		},
		{
			fieldPath: "extension.armorLevelCode",
			tier: "sat_required",
			label: "Nivel de blindaje",
			xsdElement: "nivel_blindaje",
		},
	],
	DON: [
		{
			fieldPath: "extension.donationType",
			tier: "sat_required",
			label: "Tipo de donativo",
			xsdElement: "tipo_donativo",
		},
	],
	MPC: [
		{
			fieldPath: "extension.principalAmount",
			tier: "sat_required",
			label: "Monto principal",
			xsdElement: "monto_principal",
		},
	],
	FEP: [
		{
			fieldPath: "extension.actTypeCode",
			tier: "sat_required",
			label: "Tipo de acto",
			xsdElement: "tipo_acto",
		},
	],
	SPR: [
		{
			fieldPath: "extension.serviceTypeCode",
			tier: "sat_required",
			label: "Tipo de servicio",
			xsdElement: "tipo_actividad",
		},
	],
	CHV: [
		{
			fieldPath: "extension.denominationCode",
			tier: "sat_required",
			label: "Denominación",
			xsdElement: "denominacion",
		},
		{
			fieldPath: "extension.checkCount",
			tier: "sat_required",
			label: "Cantidad de cheques",
			xsdElement: "cantidad",
		},
	],
	TSC: [
		{
			fieldPath: "extension.cardTypeCode",
			tier: "sat_required",
			label: "Tipo de tarjeta",
			xsdElement: "tipo_tarjeta",
		},
	],
	TPP: [
		{
			fieldPath: "extension.cardType",
			tier: "sat_required",
			label: "Tipo de tarjeta",
			xsdElement: "tipo_tarjeta",
		},
	],
	TDR: [
		{
			fieldPath: "extension.rewardType",
			tier: "sat_required",
			label: "Tipo de monedero/vale",
			xsdElement: "tipo_monedero",
		},
	],
	TCV: [
		{
			fieldPath: "extension.valueTypeCode",
			tier: "sat_required",
			label: "Tipo de valor",
			xsdElement: "tipo_valor",
		},
	],
	OBA: [
		{
			fieldPath: "extension.artworkTypeCode",
			tier: "sat_required",
			label: "Tipo de obra",
			xsdElement: "tipo_obra",
		},
	],
	DIN: [
		{
			fieldPath: "extension.developmentTypeCode",
			tier: "sat_required",
			label: "Tipo de desarrollo",
			xsdElement: "tipo_desarrollo",
		},
	],
};

const EXTENSION_YELLOW: ExtensionFieldMap = {
	VEH: [
		{
			fieldPath: "extension.vin",
			tier: "alert_required",
			label: "VIN / Número de serie",
			alertCodes: ["STOLEN_VEHICLE", "DUPLICATE_VIN"],
		},
		{
			fieldPath: "extension.plates",
			tier: "alert_required",
			label: "Placas",
			alertCodes: ["STOLEN_VEHICLE"],
		},
	],
	INM: [
		{
			fieldPath: "extension.municipality",
			tier: "alert_required",
			label: "Municipio",
			alertCodes: ["GEO_RISK"],
		},
		{
			fieldPath: "extension.stateCode",
			tier: "alert_required",
			label: "Estado",
			alertCodes: ["GEO_RISK"],
		},
	],
	AVI: [
		{
			fieldPath: "extension.walletAddressOrigin",
			tier: "alert_required",
			label: "Wallet origen",
			alertCodes: ["SANCTIONED_WALLET"],
		},
		{
			fieldPath: "extension.walletAddressDestination",
			tier: "alert_required",
			label: "Wallet destino",
			alertCodes: ["SANCTIONED_WALLET"],
		},
		{
			fieldPath: "extension.exchangeName",
			tier: "alert_required",
			label: "Nombre del exchange",
			alertCodes: ["UNREGISTERED_EXCHANGE"],
		},
	],
	MPC: [
		{
			fieldPath: "extension.interestRate",
			tier: "alert_required",
			label: "Tasa de interés",
			alertCodes: ["UNUSUAL_RATE"],
		},
		{
			fieldPath: "extension.termMonths",
			tier: "alert_required",
			label: "Plazo (meses)",
			alertCodes: ["SHORT_TERM_LOAN"],
		},
	],
	SPR: [
		{
			fieldPath: "extension.serviceAreaCode",
			tier: "alert_required",
			label: "Área de servicio",
			alertCodes: ["SERVICE_MISMATCH"],
		},
	],
	JYS: [
		{
			fieldPath: "extension.prizeAmount",
			tier: "alert_required",
			label: "Monto del premio",
			alertCodes: ["PRIZE_RATIO"],
		},
		{
			fieldPath: "extension.betAmount",
			tier: "alert_required",
			label: "Monto de la apuesta",
			alertCodes: ["PRIZE_RATIO"],
		},
	],
	DON: [
		{
			fieldPath: "extension.isAnonymous",
			tier: "alert_required",
			label: "Donativo anónimo",
			alertCodes: ["ANONYMOUS_DONATION"],
		},
	],
	OBA: [
		{
			fieldPath: "extension.artist",
			tier: "alert_required",
			label: "Artista",
			alertCodes: ["ART_PROVENANCE"],
		},
		{
			fieldPath: "extension.provenance",
			tier: "alert_required",
			label: "Procedencia",
			alertCodes: ["ART_PROVENANCE"],
		},
	],
};

const EXTENSION_GREY: ExtensionFieldMap = {
	VEH: [
		{ fieldPath: "extension.repuve", tier: "kyc_optional", label: "REPUVE" },
		{
			fieldPath: "extension.serialNumber",
			tier: "kyc_optional",
			label: "Número de serie",
		},
		{
			fieldPath: "extension.engineNumber",
			tier: "kyc_optional",
			label: "Número de motor",
		},
		{
			fieldPath: "extension.description",
			tier: "kyc_optional",
			label: "Descripción",
		},
	],
	INM: [
		{
			fieldPath: "extension.internalNumber",
			tier: "kyc_optional",
			label: "Número interior",
		},
		{
			fieldPath: "extension.neighborhood",
			tier: "kyc_optional",
			label: "Colonia",
		},
		{
			fieldPath: "extension.registryDate",
			tier: "kyc_optional",
			label: "Fecha de registro",
		},
		{
			fieldPath: "extension.description",
			tier: "kyc_optional",
			label: "Descripción",
		},
	],
	MJR: [
		{
			fieldPath: "extension.metalType",
			tier: "kyc_optional",
			label: "Tipo de metal",
		},
		{
			fieldPath: "extension.weightGrams",
			tier: "kyc_optional",
			label: "Peso (gramos)",
		},
		{ fieldPath: "extension.purity", tier: "kyc_optional", label: "Pureza" },
		{
			fieldPath: "extension.jewelryDescription",
			tier: "kyc_optional",
			label: "Descripción",
		},
	],
	AVI: [
		{
			fieldPath: "extension.assetName",
			tier: "kyc_optional",
			label: "Nombre del activo",
		},
		{
			fieldPath: "extension.assetQuantity",
			tier: "kyc_optional",
			label: "Cantidad",
		},
		{
			fieldPath: "extension.assetUnitPrice",
			tier: "kyc_optional",
			label: "Precio unitario",
		},
	],
	BLI: [
		{
			fieldPath: "extension.vehicleBrand",
			tier: "kyc_optional",
			label: "Marca del vehículo",
		},
		{
			fieldPath: "extension.vehicleModel",
			tier: "kyc_optional",
			label: "Modelo del vehículo",
		},
		{
			fieldPath: "extension.serviceDescription",
			tier: "kyc_optional",
			label: "Descripción del servicio",
		},
	],
	MPC: [
		{
			fieldPath: "extension.monthlyPayment",
			tier: "kyc_optional",
			label: "Pago mensual",
		},
		{
			fieldPath: "extension.guaranteeDescription",
			tier: "kyc_optional",
			label: "Descripción de garantía",
		},
		{
			fieldPath: "extension.guaranteeValue",
			tier: "kyc_optional",
			label: "Valor de garantía",
		},
	],
	FEP: [
		{
			fieldPath: "extension.instrumentNumber",
			tier: "kyc_optional",
			label: "Número de instrumento",
		},
		{
			fieldPath: "extension.instrumentDate",
			tier: "kyc_optional",
			label: "Fecha del instrumento",
		},
		{
			fieldPath: "extension.trustPurpose",
			tier: "kyc_optional",
			label: "Propósito del fideicomiso",
		},
	],
	SPR: [
		{
			fieldPath: "extension.financialInstitutionName",
			tier: "kyc_optional",
			label: "Institución financiera",
		},
		{
			fieldPath: "extension.serviceDescription",
			tier: "kyc_optional",
			label: "Descripción del servicio",
		},
	],
	OBA: [
		{
			fieldPath: "extension.title",
			tier: "kyc_optional",
			label: "Título de la obra",
		},
		{
			fieldPath: "extension.medium",
			tier: "kyc_optional",
			label: "Técnica/medio",
		},
		{
			fieldPath: "extension.dimensions",
			tier: "kyc_optional",
			label: "Dimensiones",
		},
		{
			fieldPath: "extension.certificateAuthenticity",
			tier: "kyc_optional",
			label: "Certificado de autenticidad",
		},
	],
	ARI: [
		{
			fieldPath: "extension.monthlyRent",
			tier: "kyc_optional",
			label: "Renta mensual",
		},
		{
			fieldPath: "extension.depositAmount",
			tier: "kyc_optional",
			label: "Depósito",
		},
		{
			fieldPath: "extension.description",
			tier: "kyc_optional",
			label: "Descripción",
		},
	],
	DON: [
		{
			fieldPath: "extension.purpose",
			tier: "kyc_optional",
			label: "Propósito",
		},
		{
			fieldPath: "extension.campaignName",
			tier: "kyc_optional",
			label: "Nombre de campaña",
		},
	],
	DIN: [
		{
			fieldPath: "extension.projectName",
			tier: "kyc_optional",
			label: "Nombre del proyecto",
		},
		{
			fieldPath: "extension.projectLocation",
			tier: "kyc_optional",
			label: "Ubicación del proyecto",
		},
		{
			fieldPath: "extension.contributionAmount",
			tier: "kyc_optional",
			label: "Monto de contribución",
		},
	],
	CHV: [
		{
			fieldPath: "extension.serialNumbers",
			tier: "kyc_optional",
			label: "Números de serie",
		},
		{
			fieldPath: "extension.issuerName",
			tier: "kyc_optional",
			label: "Nombre del emisor",
		},
	],
	TSC: [
		{
			fieldPath: "extension.cardBrand",
			tier: "kyc_optional",
			label: "Marca de tarjeta",
		},
		{
			fieldPath: "extension.creditLimit",
			tier: "kyc_optional",
			label: "Límite de crédito",
		},
	],
	TPP: [
		{
			fieldPath: "extension.reloadAmount",
			tier: "kyc_optional",
			label: "Monto de recarga",
		},
		{
			fieldPath: "extension.currentBalance",
			tier: "kyc_optional",
			label: "Saldo actual",
		},
	],
	TDR: [
		{
			fieldPath: "extension.programName",
			tier: "kyc_optional",
			label: "Nombre del programa",
		},
		{
			fieldPath: "extension.pointsAmount",
			tier: "kyc_optional",
			label: "Cantidad de puntos",
		},
	],
	TCV: [
		{
			fieldPath: "extension.transportMethod",
			tier: "kyc_optional",
			label: "Método de transporte",
		},
		{
			fieldPath: "extension.declaredValue",
			tier: "kyc_optional",
			label: "Valor declarado",
		},
		{
			fieldPath: "extension.description",
			tier: "kyc_optional",
			label: "Descripción",
		},
	],
};

// --- Public API ---

/**
 * Options for filtering client field requirements by person type.
 */
export interface FieldRequirementsOptions {
	/** When entityType is "client", filter RED fields by person type */
	personType?: "physical" | "moral" | "trust";
}

/**
 * Get all field requirements for a given activity and entity type.
 * FES returns empty arrays (no XSD available).
 */
export function getFieldRequirements(
	activityCode: ActivityCode,
	entityType: CompletenessEntityType,
	options?: FieldRequirementsOptions,
): FieldRequirement[] {
	// FES has no XSD -- no field requirements
	if (activityCode === "FES") return [];

	switch (entityType) {
		case "client": {
			const personType = options?.personType;
			const redFields =
				personType === "physical"
					? CLIENT_PERSONA_FISICA_RED
					: personType === "moral" || personType === "trust"
						? CLIENT_PERSONA_MORAL_RED
						: [...CLIENT_PERSONA_FISICA_RED, ...CLIENT_PERSONA_MORAL_RED];
			return [...redFields, ...CLIENT_YELLOW, ...CLIENT_GREY];
		}
		case "payment":
			return [...PAYMENT_RED, ...PAYMENT_YELLOW, ...PAYMENT_GREY];
		case "operation":
			return [
				...OPERATION_COMMON_RED,
				...(EXTENSION_RED[activityCode] ?? []),
				...OPERATION_COMMON_YELLOW,
				...(EXTENSION_YELLOW[activityCode] ?? []),
				...OPERATION_COMMON_GREY,
				...(EXTENSION_GREY[activityCode] ?? []),
			];
		default:
			return [];
	}
}

/**
 * Get field requirements filtered by a specific tier.
 */
export function getFieldRequirementsByTier(
	activityCode: ActivityCode,
	entityType: CompletenessEntityType,
	tier: FieldTier,
	options?: FieldRequirementsOptions,
): FieldRequirement[] {
	return getFieldRequirements(activityCode, entityType, options).filter(
		(f) => f.tier === tier,
	);
}

/**
 * Resolve a dot-separated field path against a data object.
 * e.g. "extension.brand" against { extension: { brand: "Toyota" } } => "Toyota"
 */
function resolveFieldPath(
	data: Record<string, unknown>,
	fieldPath: string,
): unknown {
	// Strip the entity prefix (client., operation., extension., payment.)
	const parts = fieldPath.split(".");
	const pathWithoutPrefix = parts.length > 1 ? parts.slice(1) : parts;

	let current: unknown = data;
	for (const part of pathWithoutPrefix) {
		if (
			current === null ||
			current === undefined ||
			typeof current !== "object"
		) {
			return undefined;
		}
		current = (current as Record<string, unknown>)[part];
	}
	return current;
}

/**
 * Check if a value is "present" (non-null, non-undefined, non-empty-string).
 */
function isPresent(value: unknown): boolean {
	if (value === null || value === undefined) return false;
	if (typeof value === "string" && value.trim() === "") return false;
	return true;
}

/**
 * Compute the completeness of an entity against the field requirements for an activity.
 *
 * @param activityCode - The activity code
 * @param entityType - client, operation, or payment
 * @param data - The entity data to check (flat or nested object)
 * @returns CompletenessResult with summary and missing fields
 */
export function computeCompleteness(
	activityCode: ActivityCode,
	entityType: CompletenessEntityType,
	data: Record<string, unknown>,
	options?: FieldRequirementsOptions,
): CompletenessResult {
	const requirements = getFieldRequirements(activityCode, entityType, options);

	const missing: CompletenessResult["missing"] = [];
	const summary = {
		red: { total: 0, filled: 0, missing: 0 },
		yellow: { total: 0, filled: 0, missing: 0 },
		grey: { total: 0, filled: 0, missing: 0 },
		total: 0,
		filled: 0,
	};

	for (const req of requirements) {
		const tierKey =
			req.tier === "sat_required"
				? "red"
				: req.tier === "alert_required"
					? "yellow"
					: "grey";

		summary[tierKey].total++;
		summary.total++;

		const value = resolveFieldPath(data, req.fieldPath);
		if (isPresent(value)) {
			summary[tierKey].filled++;
			summary.filled++;
		} else {
			summary[tierKey].missing++;
			missing.push({ field: req, value: undefined });
		}
	}

	return {
		satReady: summary.red.missing === 0,
		alertReady: summary.yellow.missing === 0,
		fullyEnriched: summary.grey.missing === 0,
		missing,
		summary,
	};
}

/**
 * Build a lookup map from client field names to their FieldTier.
 *
 * Useful for passing `tier` props to form labels/inputs.
 * Keys are the field name portion after "client." (e.g. "firstName", "rfc").
 */
export function getClientFieldTierMap(
	personType: "physical" | "moral" | "trust",
): Record<string, FieldTier> {
	const redFields =
		personType === "physical"
			? CLIENT_PERSONA_FISICA_RED
			: CLIENT_PERSONA_MORAL_RED;

	const allFields = [...redFields, ...CLIENT_YELLOW, ...CLIENT_GREY];
	const map: Record<string, FieldTier> = {};

	for (const req of allFields) {
		const fieldName = req.fieldPath.replace("client.", "");
		// If a field appears in multiple tiers, RED wins over YELLOW wins over GREY
		if (
			!map[fieldName] ||
			req.tier === "sat_required" ||
			(req.tier === "alert_required" && map[fieldName] === "kyc_optional")
		) {
			map[fieldName] = req.tier;
		}
	}

	return map;
}

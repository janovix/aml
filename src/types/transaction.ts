export type TransactionOperationType = "purchase" | "sale";
export type TransactionVehicleType = "land" | "marine" | "air";

// Compatibility types for UI components (legacy)
export type TransactionType = "COMPRA" | "VENTA";
export type VehicleType = "TERRESTRE" | "MARITIMO" | "AEREO";
export type PaymentMethod =
	| "EFECTIVO"
	| "TRANSFERENCIA"
	| "CHEQUE"
	| "FINANCIAMIENTO";
export type TransactionStatus = "COMPLETADA" | "PENDIENTE" | "EN_REVISION";

// Helper functions to convert between old and new types
export function mapOperationTypeToLegacy(
	type: TransactionOperationType,
): TransactionType {
	return type === "purchase" ? "COMPRA" : "VENTA";
}

export function mapLegacyToOperationType(
	type: TransactionType,
): TransactionOperationType {
	return type === "COMPRA" ? "purchase" : "sale";
}

export function mapVehicleTypeToLegacy(
	type: TransactionVehicleType,
): VehicleType {
	const mapping: Record<TransactionVehicleType, VehicleType> = {
		land: "TERRESTRE",
		marine: "MARITIMO",
		air: "AEREO",
	};
	return mapping[type];
}

export function mapLegacyToVehicleType(
	type: VehicleType,
): TransactionVehicleType {
	const mapping: Record<VehicleType, TransactionVehicleType> = {
		TERRESTRE: "land",
		MARITIMO: "marine",
		AEREO: "air",
	};
	return mapping[type];
}

export interface Transaction {
	id: string;
	clientId: string;
	operationDate: string; // date-time format
	operationType: TransactionOperationType;
	branchPostalCode: string;
	vehicleType: TransactionVehicleType;
	brandId: string;
	model: string;
	year: number;
	serialNumber: string;
	armorLevel?: string | null;
	engineNumber?: string | null;
	plates?: string | null;
	registrationNumber?: string | null;
	flagCountryId?: string | null;
	amount: string;
	currency: string;
	paymentMethod: string;
	paymentDate: string; // date-time format
	createdAt: string; // date-time format
	updatedAt: string; // date-time format
	deletedAt?: string | null; // date-time format
}

export interface TransactionCreateRequest {
	clientId: string;
	operationDate: string; // date-time format
	operationType: TransactionOperationType;
	branchPostalCode: string;
	vehicleType: TransactionVehicleType;
	brandId: string;
	model: string;
	year: number;
	serialNumber: string;
	armorLevel?: string | null;
	engineNumber?: string | null;
	plates?: string | null;
	registrationNumber?: string | null;
	flagCountryId?: string | null;
	amount: string;
	currency: string;
	paymentMethod: string;
	paymentDate: string; // date-time format
}

export interface TransactionUpdateRequest {
	operationDate: string; // date-time format
	operationType: TransactionOperationType;
	branchPostalCode: string;
	vehicleType: TransactionVehicleType;
	brandId: string;
	model: string;
	year: number;
	serialNumber: string;
	armorLevel?: string | null;
	engineNumber?: string | null;
	plates?: string | null;
	registrationNumber?: string | null;
	flagCountryId?: string | null;
	amount: string;
	currency: string;
	paymentMethod: string;
	paymentDate: string; // date-time format
}

export interface TransactionPagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface TransactionListResponse {
	data: Transaction[];
	pagination: TransactionPagination;
}

// Compatibility interface for UI components that haven't been migrated yet
export interface TransactionLegacy {
	id: string;
	date: string;
	clientId: string;
	clientName: string;
	transactionType: TransactionType;
	vehicleType: VehicleType;
	vehicle: string;
	brand: string;
	model: string;
	year: string;
	serialNumber: string;
	plates?: string;
	engineNumber?: string;
	registrationNumber?: string;
	flagCountry?: string;
	amount: string;
	currency: string;
	paymentMethod: PaymentMethod;
	paymentDate: string;
	branch: string;
	status: TransactionStatus;
	riskFlag: boolean;
}

// Helper function to convert new Transaction to legacy format for UI compatibility
export function transactionToLegacy(
	tx: Transaction,
	clientName?: string,
): TransactionLegacy {
	return {
		id: tx.id,
		date: tx.operationDate.split("T")[0] || tx.operationDate,
		clientId: tx.clientId,
		clientName: clientName || tx.clientId,
		transactionType: mapOperationTypeToLegacy(tx.operationType),
		vehicleType: mapVehicleTypeToLegacy(tx.vehicleType),
		vehicle: `${tx.brandId} ${tx.model} ${tx.year}`,
		brand: tx.brandId,
		model: tx.model,
		year: String(tx.year),
		serialNumber: tx.serialNumber,
		plates: tx.plates || undefined,
		engineNumber: tx.engineNumber || undefined,
		registrationNumber: tx.registrationNumber || undefined,
		flagCountry: tx.flagCountryId || undefined,
		amount: tx.amount,
		currency: tx.currency,
		paymentMethod: tx.paymentMethod as PaymentMethod,
		paymentDate: tx.paymentDate.split("T")[0] || tx.paymentDate,
		branch: tx.branchPostalCode,
		status: "COMPLETADA", // Default since API doesn't have status
		riskFlag: false, // Default since API doesn't have riskFlag
	};
}

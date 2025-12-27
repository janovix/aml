export type TransactionOperationType = "purchase" | "sale";
export type TransactionVehicleType = "land" | "marine" | "air";

export interface PaymentMethod {
	id: string;
	method: string;
	amount: string;
	createdAt: string; // date-time format
	updatedAt: string; // date-time format
}

export interface PaymentMethodInput {
	method: string;
	amount: string;
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
	vin?: string | null;
	repuve?: string | null;
	armorLevel?: string | null;
	engineNumber?: string | null;
	plates?: string | null;
	registrationNumber?: string | null;
	flagCountryId?: string | null;
	amount: string;
	currency: string;
	paymentDate: string; // date-time format
	paymentMethods: PaymentMethod[];
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
	vin?: string | null;
	repuve?: string | null;
	armorLevel?: string | null;
	engineNumber?: string | null;
	plates?: string | null;
	registrationNumber?: string | null;
	flagCountryId?: string | null;
	amount: string;
	currency: string;
	paymentMethods: PaymentMethodInput[];
	paymentDate?: string; // date-time format (optional)
}

export interface TransactionUpdateRequest {
	operationDate: string; // date-time format
	operationType: TransactionOperationType;
	branchPostalCode: string;
	vehicleType: TransactionVehicleType;
	brandId: string;
	model: string;
	year: number;
	vin?: string | null;
	repuve?: string | null;
	armorLevel?: string | null;
	engineNumber?: string | null;
	plates?: string | null;
	registrationNumber?: string | null;
	flagCountryId?: string | null;
	amount: string;
	currency: string;
	paymentMethods: PaymentMethodInput[];
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

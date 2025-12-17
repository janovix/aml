export type TransactionType = "COMPRA" | "VENTA";
export type VehicleType = "TERRESTRE" | "MARITIMO" | "AEREO";
export type PaymentMethod =
	| "EFECTIVO"
	| "TRANSFERENCIA"
	| "CHEQUE"
	| "FINANCIAMIENTO";
export type TransactionStatus = "COMPLETADA" | "PENDIENTE" | "EN_REVISION";

export interface Transaction {
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

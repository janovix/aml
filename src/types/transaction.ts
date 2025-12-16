export type TransactionType =
	| "DEPOSITO"
	| "RETIRO"
	| "TRANSFERENCIA"
	| "PAGO"
	| "COBRANZA"
	| "OTRO";

export type TransactionStatus =
	| "PENDIENTE"
	| "COMPLETADA"
	| "RECHAZADA"
	| "CANCELADA"
	| "EN_REVISION";

export type TransactionChannel =
	| "BANCA_EN_LINEA"
	| "CAJERO_AUTOMATICO"
	| "SUCURSAL"
	| "MOVIL"
	| "TRANSFERENCIA_ELECTRONICA"
	| "OTRO";

export interface Transaction {
	id: string;
	clientId: string;
	clientName: string;
	clientRfc: string;
	amount: number;
	currency: string;
	type: TransactionType;
	status: TransactionStatus;
	channel: TransactionChannel;
	date: string;
	description?: string;
	reference?: string;
	riskScore?: number;
	alertCount: number;
	originAccount?: string;
	destinationAccount?: string;
	createdAt: string;
	updatedAt: string;
}

export function getTransactionTypeLabel(type: TransactionType): string {
	const labels: Record<TransactionType, string> = {
		DEPOSITO: "Depósito",
		RETIRO: "Retiro",
		TRANSFERENCIA: "Transferencia",
		PAGO: "Pago",
		COBRANZA: "Cobranza",
		OTRO: "Otro",
	};
	return labels[type];
}

export function getTransactionStatusLabel(status: TransactionStatus): string {
	const labels: Record<TransactionStatus, string> = {
		PENDIENTE: "Pendiente",
		COMPLETADA: "Completada",
		RECHAZADA: "Rechazada",
		CANCELADA: "Cancelada",
		EN_REVISION: "En Revisión",
	};
	return labels[status];
}

export function getTransactionChannelLabel(
	channel: TransactionChannel,
): string {
	const labels: Record<TransactionChannel, string> = {
		BANCA_EN_LINEA: "Banca en Línea",
		CAJERO_AUTOMATICO: "Cajero Automático",
		SUCURSAL: "Sucursal",
		MOVIL: "Móvil",
		TRANSFERENCIA_ELECTRONICA: "Transferencia Electrónica",
		OTRO: "Otro",
	};
	return labels[channel];
}

export function formatCurrency(
	amount: number,
	currency: string = "MXN",
): string {
	return new Intl.NumberFormat("es-MX", {
		style: "currency",
		currency,
	}).format(amount);
}

import type { Alert } from "@/types/alert";
import { getFiscalMonth } from "@/lib/fiscalMonth";

// Generate mock alerts with various statuses, severities, and fiscal months
const now = new Date();
const currentFiscalMonth = getFiscalMonth(now);

// Helper to create dates in different fiscal months
function createDateInFiscalMonth(fiscalMonth: string, day: number): Date {
	const [year, month] = fiscalMonth.split("-").map(Number);
	// Fiscal month ends on 17th, so dates should be between 18th of prev month and 17th of current month
	if (day <= 17) {
		return new Date(year, month - 1, day);
	}
	// If day > 17, it's in the next fiscal month
	const prevMonth = month - 1;
	if (prevMonth < 0) {
		return new Date(year - 1, 11, day);
	}
	return new Date(year, prevMonth, day);
}

export const mockAlerts: Alert[] = [
	// Current fiscal month alerts
	{
		id: "1",
		title: "Transacción sospechosa - Monto elevado",
		description:
			"Cliente realizó transacción por $2,500,000 MXN en vehículo blindado sin historial previo de transacciones similares.",
		status: "pending",
		severity: "high",
		source: "olap",
		clientId: "1",
		clientRfc: "EGL850101AAA",
		transactionId: "tx-001",
		fiscalMonth: currentFiscalMonth,
		detectedAt: createDateInFiscalMonth(currentFiscalMonth, 5).toISOString(),
		createdAt: createDateInFiscalMonth(currentFiscalMonth, 5).toISOString(),
		updatedAt: createDateInFiscalMonth(currentFiscalMonth, 5).toISOString(),
		notes: "Requiere revisión manual del caso.",
	},
	{
		id: "2",
		title: "Múltiples transacciones en corto tiempo",
		description:
			"Cliente realizó 5 transacciones en un período de 3 días, totalizando $1,800,000 MXN.",
		status: "in_review",
		severity: "medium",
		source: "olap",
		clientId: "2",
		clientRfc: "CNO920315BBB",
		transactionId: "tx-002",
		fiscalMonth: currentFiscalMonth,
		detectedAt: createDateInFiscalMonth(currentFiscalMonth, 8).toISOString(),
		createdAt: createDateInFiscalMonth(currentFiscalMonth, 8).toISOString(),
		updatedAt: createDateInFiscalMonth(currentFiscalMonth, 10).toISOString(),
		notes: "En revisión por equipo de compliance.",
	},
	{
		id: "3",
		title: "Cliente en lista de sanciones",
		description:
			"Cliente aparece en lista de personas sancionadas internacionalmente.",
		status: "pending",
		severity: "critical",
		source: "system",
		clientId: "3",
		clientRfc: "SFM880520CCC",
		fiscalMonth: currentFiscalMonth,
		detectedAt: createDateInFiscalMonth(currentFiscalMonth, 12).toISOString(),
		createdAt: createDateInFiscalMonth(currentFiscalMonth, 12).toISOString(),
		updatedAt: createDateInFiscalMonth(currentFiscalMonth, 12).toISOString(),
		notes: "URGENTE: Bloquear todas las transacciones pendientes.",
	},
	{
		id: "4",
		title: "Patrón de estructuración detectado",
		description:
			"Transacciones fragmentadas que suman exactamente $599,999 MXN (justo debajo del límite de reporte).",
		status: "pending",
		severity: "high",
		source: "olap",
		clientId: "4",
		clientRfc: "IDP950712DDD",
		transactionId: "tx-003",
		fiscalMonth: currentFiscalMonth,
		detectedAt: createDateInFiscalMonth(currentFiscalMonth, 15).toISOString(),
		createdAt: createDateInFiscalMonth(currentFiscalMonth, 15).toISOString(),
		updatedAt: createDateInFiscalMonth(currentFiscalMonth, 15).toISOString(),
	},
	{
		id: "5",
		title: "Alerta manual - Revisión requerida",
		description:
			"Cliente reportado por empleado por comportamiento sospechoso durante visita.",
		status: "in_review",
		severity: "medium",
		source: "manual",
		clientId: "5",
		clientRfc: "PECJ850615E56",
		fiscalMonth: currentFiscalMonth,
		detectedAt: createDateInFiscalMonth(currentFiscalMonth, 3).toISOString(),
		createdAt: createDateInFiscalMonth(currentFiscalMonth, 3).toISOString(),
		updatedAt: createDateInFiscalMonth(currentFiscalMonth, 6).toISOString(),
		notes: "Reportado por: María González",
	},
	// Previous fiscal month alerts
	{
		id: "6",
		title: "Transacción con país de alto riesgo",
		description:
			"Transacción involucra cliente con origen en país de alto riesgo según lista OFAC.",
		status: "resolved",
		severity: "high",
		source: "olap",
		clientId: "6",
		clientRfc: "GIQ870830FFF",
		transactionId: "tx-004",
		fiscalMonth: (() => {
			const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			return getFiscalMonth(prevMonth);
		})(),
		detectedAt: createDateInFiscalMonth(
			(() => {
				const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				return getFiscalMonth(prevMonth);
			})(),
			20,
		).toISOString(),
		createdAt: createDateInFiscalMonth(
			(() => {
				const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				return getFiscalMonth(prevMonth);
			})(),
			20,
		).toISOString(),
		updatedAt: createDateInFiscalMonth(
			(() => {
				const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				return getFiscalMonth(prevMonth);
			})(),
			25,
		).toISOString(),
		resolvedAt: createDateInFiscalMonth(
			(() => {
				const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				return getFiscalMonth(prevMonth);
			})(),
			25,
		).toISOString(),
		resolvedBy: "admin@example.com",
		notes: "Cliente verificado, transacción aprobada.",
	},
	{
		id: "7",
		title: "Inconsistencia en documentos",
		description:
			"RFC proporcionado no coincide con documentos de identificación presentados.",
		status: "resolved",
		severity: "medium",
		source: "manual",
		clientId: "7",
		clientRfc: "DCM911105GGG",
		fiscalMonth: (() => {
			const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			return getFiscalMonth(prevMonth);
		})(),
		detectedAt: createDateInFiscalMonth(
			(() => {
				const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				return getFiscalMonth(prevMonth);
			})(),
			10,
		).toISOString(),
		createdAt: createDateInFiscalMonth(
			(() => {
				const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				return getFiscalMonth(prevMonth);
			})(),
			10,
		).toISOString(),
		updatedAt: createDateInFiscalMonth(
			(() => {
				const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				return getFiscalMonth(prevMonth);
			})(),
			12,
		).toISOString(),
		resolvedAt: createDateInFiscalMonth(
			(() => {
				const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				return getFiscalMonth(prevMonth);
			})(),
			12,
		).toISOString(),
		resolvedBy: "compliance@example.com",
		notes: "Error de captura corregido.",
	},
	{
		id: "8",
		title: "Alerta de bajo riesgo",
		description:
			"Transacción ligeramente fuera del patrón normal del cliente, pero dentro de parámetros aceptables.",
		status: "dismissed",
		severity: "low",
		source: "olap",
		clientId: "8",
		clientRfc: "CIB880415HHH",
		transactionId: "tx-005",
		fiscalMonth: (() => {
			const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			return getFiscalMonth(prevMonth);
		})(),
		detectedAt: createDateInFiscalMonth(
			(() => {
				const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				return getFiscalMonth(prevMonth);
			})(),
			5,
		).toISOString(),
		createdAt: createDateInFiscalMonth(
			(() => {
				const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				return getFiscalMonth(prevMonth);
			})(),
			5,
		).toISOString(),
		updatedAt: createDateInFiscalMonth(
			(() => {
				const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				return getFiscalMonth(prevMonth);
			})(),
			7,
		).toISOString(),
		notes: "Falsa alarma, descartada.",
	},
	// Two months ago alerts
	{
		id: "9",
		title: "Transacción con efectivo excesivo",
		description:
			"Cliente pagó $800,000 MXN en efectivo, superando el límite recomendado.",
		status: "resolved",
		severity: "high",
		source: "olap",
		clientId: "1",
		clientRfc: "EGL850101AAA",
		transactionId: "tx-006",
		fiscalMonth: (() => {
			const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
			return getFiscalMonth(twoMonthsAgo);
		})(),
		detectedAt: createDateInFiscalMonth(
			(() => {
				const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
				return getFiscalMonth(twoMonthsAgo);
			})(),
			15,
		).toISOString(),
		createdAt: createDateInFiscalMonth(
			(() => {
				const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
				return getFiscalMonth(twoMonthsAgo);
			})(),
			15,
		).toISOString(),
		updatedAt: createDateInFiscalMonth(
			(() => {
				const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
				return getFiscalMonth(twoMonthsAgo);
			})(),
			20,
		).toISOString(),
		resolvedAt: createDateInFiscalMonth(
			(() => {
				const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
				return getFiscalMonth(twoMonthsAgo);
			})(),
			20,
		).toISOString(),
		resolvedBy: "compliance@example.com",
		notes: "Documentación adicional proporcionada y verificada.",
	},
	{
		id: "10",
		title: "Cambio abrupto en comportamiento",
		description:
			"Cliente con historial de transacciones pequeñas realizó compra de vehículo de lujo por $3,200,000 MXN.",
		status: "resolved",
		severity: "medium",
		source: "olap",
		clientId: "2",
		clientRfc: "CNO920315BBB",
		transactionId: "tx-007",
		fiscalMonth: (() => {
			const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
			return getFiscalMonth(twoMonthsAgo);
		})(),
		detectedAt: createDateInFiscalMonth(
			(() => {
				const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
				return getFiscalMonth(twoMonthsAgo);
			})(),
			8,
		).toISOString(),
		createdAt: createDateInFiscalMonth(
			(() => {
				const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
				return getFiscalMonth(twoMonthsAgo);
			})(),
			8,
		).toISOString(),
		updatedAt: createDateInFiscalMonth(
			(() => {
				const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
				return getFiscalMonth(twoMonthsAgo);
			})(),
			10,
		).toISOString(),
		resolvedAt: createDateInFiscalMonth(
			(() => {
				const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
				return getFiscalMonth(twoMonthsAgo);
			})(),
			10,
		).toISOString(),
		resolvedBy: "admin@example.com",
		notes: "Cliente proporcionó justificación válida (herencia).",
	},
];

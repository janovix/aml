import { describe, expect, it } from "vitest";
import {
	getTransactionTypeLabel,
	getTransactionStatusLabel,
	getTransactionChannelLabel,
	formatCurrency,
	type TransactionType,
	type TransactionStatus,
	type TransactionChannel,
} from "./transaction";

describe("Transaction utilities", () => {
	describe("getTransactionTypeLabel", () => {
		it("returns correct label for DEPOSITO", () => {
			expect(getTransactionTypeLabel("DEPOSITO")).toBe("Depósito");
		});

		it("returns correct label for RETIRO", () => {
			expect(getTransactionTypeLabel("RETIRO")).toBe("Retiro");
		});

		it("returns correct label for TRANSFERENCIA", () => {
			expect(getTransactionTypeLabel("TRANSFERENCIA")).toBe("Transferencia");
		});

		it("returns correct label for PAGO", () => {
			expect(getTransactionTypeLabel("PAGO")).toBe("Pago");
		});

		it("returns correct label for COBRANZA", () => {
			expect(getTransactionTypeLabel("COBRANZA")).toBe("Cobranza");
		});

		it("returns correct label for OTRO", () => {
			expect(getTransactionTypeLabel("OTRO")).toBe("Otro");
		});
	});

	describe("getTransactionStatusLabel", () => {
		it("returns correct label for PENDIENTE", () => {
			expect(getTransactionStatusLabel("PENDIENTE")).toBe("Pendiente");
		});

		it("returns correct label for COMPLETADA", () => {
			expect(getTransactionStatusLabel("COMPLETADA")).toBe("Completada");
		});

		it("returns correct label for RECHAZADA", () => {
			expect(getTransactionStatusLabel("RECHAZADA")).toBe("Rechazada");
		});

		it("returns correct label for CANCELADA", () => {
			expect(getTransactionStatusLabel("CANCELADA")).toBe("Cancelada");
		});

		it("returns correct label for EN_REVISION", () => {
			expect(getTransactionStatusLabel("EN_REVISION")).toBe("En Revisión");
		});
	});

	describe("getTransactionChannelLabel", () => {
		it("returns correct label for BANCA_EN_LINEA", () => {
			expect(getTransactionChannelLabel("BANCA_EN_LINEA")).toBe(
				"Banca en Línea",
			);
		});

		it("returns correct label for CAJERO_AUTOMATICO", () => {
			expect(getTransactionChannelLabel("CAJERO_AUTOMATICO")).toBe(
				"Cajero Automático",
			);
		});

		it("returns correct label for SUCURSAL", () => {
			expect(getTransactionChannelLabel("SUCURSAL")).toBe("Sucursal");
		});

		it("returns correct label for MOVIL", () => {
			expect(getTransactionChannelLabel("MOVIL")).toBe("Móvil");
		});

		it("returns correct label for TRANSFERENCIA_ELECTRONICA", () => {
			expect(getTransactionChannelLabel("TRANSFERENCIA_ELECTRONICA")).toBe(
				"Transferencia Electrónica",
			);
		});

		it("returns correct label for OTRO", () => {
			expect(getTransactionChannelLabel("OTRO")).toBe("Otro");
		});
	});

	describe("formatCurrency", () => {
		it("formats MXN currency correctly", () => {
			const result = formatCurrency(1234.56, "MXN");
			expect(result).toContain("1,234.56");
			expect(result).toContain("$");
		});

		it("defaults to MXN when currency is not provided", () => {
			const result = formatCurrency(1234.56);
			expect(result).toContain("1,234.56");
		});

		it("formats large amounts correctly", () => {
			const result = formatCurrency(1000000, "MXN");
			expect(result).toContain("1,000,000");
		});

		it("formats zero correctly", () => {
			const result = formatCurrency(0, "MXN");
			expect(result).toContain("0");
		});
	});
});

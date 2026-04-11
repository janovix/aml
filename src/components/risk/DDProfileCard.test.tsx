import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DDProfileCard } from "./DDProfileCard";
import type { DDProfile } from "@/lib/api/risk";

describe("DDProfileCard", () => {
	const profile: DDProfile = {
		clientAcceptance: "STANDARD",
		identificationVerification: "ENHANCED",
		ongoingMonitoring: "ENHANCED",
		transactionScrutiny: "STANDARD",
		reportingObligations: "SIMPLIFIED",
	};

	it("renders all 5 DD fields in Spanish", () => {
		render(<DDProfileCard profile={profile} language="es" />);
		expect(screen.getByText("Aceptación de cliente")).toBeInTheDocument();
		expect(
			screen.getByText("Identificación y verificación"),
		).toBeInTheDocument();
		expect(screen.getByText("Monitoreo continuo")).toBeInTheDocument();
		expect(screen.getByText("Escrutinio transaccional")).toBeInTheDocument();
		expect(screen.getByText("Obligaciones de reporte")).toBeInTheDocument();
	});

	it("renders all 5 DD fields in English", () => {
		render(<DDProfileCard profile={profile} language="en" />);
		expect(screen.getByText("Client acceptance")).toBeInTheDocument();
		expect(screen.getByText("ID & verification")).toBeInTheDocument();
		expect(screen.getByText("Ongoing monitoring")).toBeInTheDocument();
		expect(screen.getByText("Transaction scrutiny")).toBeInTheDocument();
		expect(screen.getByText("Reporting obligations")).toBeInTheDocument();
	});

	it("renders DD level badges", () => {
		render(<DDProfileCard profile={profile} language="es" />);
		expect(screen.getAllByText("Reforzada")).toHaveLength(2);
		expect(screen.getAllByText("Estándar")).toHaveLength(2);
		expect(screen.getByText("Simplificada")).toBeInTheDocument();
	});
});

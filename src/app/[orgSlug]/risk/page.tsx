import type { Metadata } from "next";
import { RiskDashboardView } from "@/components/risk/RiskDashboardView";

export const metadata: Metadata = {
	title: "Modelos de Riesgo | Plataforma AML",
	description:
		"Panel de evaluación basada en riesgo con distribución de clientes y evaluación organizacional",
};

export default function RiskPage(): React.ReactElement {
	return <RiskDashboardView />;
}

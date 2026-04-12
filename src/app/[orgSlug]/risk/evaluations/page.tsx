import type { Metadata } from "next";
import { EvaluationsTable } from "@/components/risk/EvaluationsTable";

export const metadata: Metadata = {
	title: "Evaluaciones de Riesgo | Plataforma AML",
	description:
		"Historial de evaluaciones de riesgo de clientes con detalle por factores",
};

export default function EvaluationsPage(): React.ReactElement {
	return <EvaluationsTable />;
}

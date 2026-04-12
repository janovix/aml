import type { Metadata } from "next";
import { EvaluationDetailView } from "@/components/risk/EvaluationDetailView";

export const metadata: Metadata = {
	title: "Detalle de Evaluación | Plataforma AML",
	description: "Detalle completo de evaluación de riesgo de cliente",
};

export default function EvaluationDetailPage(): React.ReactElement {
	return <EvaluationDetailView />;
}

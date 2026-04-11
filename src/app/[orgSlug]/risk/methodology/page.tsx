import type { Metadata } from "next";
import { MethodologySettingsView } from "@/components/risk/MethodologySettingsView";

export const metadata: Metadata = {
	title: "Metodología de Riesgo | Plataforma AML",
	description:
		"Configuración de la metodología de evaluación de riesgo para la organización",
};

export default function MethodologyPage(): React.ReactElement {
	return <MethodologySettingsView />;
}

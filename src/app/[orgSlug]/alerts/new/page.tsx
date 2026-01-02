import type { Metadata } from "next";
import { CreateManualAlertView } from "@/components/alerts";

export const metadata: Metadata = {
	title: "Nueva Alerta | Plataforma AML",
	description: "Crear una nueva alerta manual",
};

export default function NuevaAlertaPage(): React.ReactElement {
	return <CreateManualAlertView />;
}

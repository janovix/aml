import type { Metadata } from "next";
import { AlertsPageContent } from "@/components/alerts/AlertsPageContent";

export const metadata: Metadata = {
	title: "Avisos | Plataforma AML",
	description: "Gestión y monitoreo de avisos de alerta AML",
};

export default function AlertasPage(): React.ReactElement {
	return <AlertsPageContent />;
}

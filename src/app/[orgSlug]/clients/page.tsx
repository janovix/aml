import type { Metadata } from "next";
import { ClientsPageContent } from "@/components/clients/ClientsPageContent";

export const metadata: Metadata = {
	title: "Clientes | Plataforma AML",
	description: "Gestión de clientes y análisis de riesgo AML",
};

export default function ClientesPage(): React.ReactElement {
	return <ClientsPageContent />;
}

import type { Metadata } from "next";
import { ClientNewPageContent } from "@/components/clients/ClientNewPageContent";

export const metadata: Metadata = {
	title: "Nuevo Cliente | Plataforma AML",
	description: "Crear un nuevo cliente en el sistema",
};

export default function ClientNewPage(): React.ReactElement {
	return <ClientNewPageContent />;
}

import type { Metadata } from "next";
import { ClientEditPageContent } from "@/components/clients/ClientEditPageContent";
import { mockClients } from "@/data/mockClients";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const client = mockClients.find((c) => c.id === id);

	if (!client) {
		return {
			title: "Cliente no encontrado | Plataforma AML",
		};
	}

	return {
		title: `Editar Cliente | Plataforma AML`,
		description: `Editar información del cliente ${client.rfc}`,
	};
}

export default async function ClientEditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
	const { id } = await params;
	return <ClientEditPageContent clientId={id} />;
}

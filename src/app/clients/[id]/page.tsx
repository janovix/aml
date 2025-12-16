import type { Metadata } from "next";
import { ClientDetailPageContent } from "@/components/clients/ClientDetailPageContent";
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
		title: `${client.personType === "FISICA" ? `${client.firstName} ${client.lastName}` : client.businessName} | Plataforma AML`,
		description: `Detalles del cliente ${client.rfc}`,
	};
}

export default async function ClientDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
	const { id } = await params;
	return <ClientDetailPageContent clientId={id} />;
}

import type { Metadata } from "next";
import { ClientDetailsView } from "@/components/clients/ClientDetailsView";

export const metadata: Metadata = {
	title: "Detalle Cliente | Plataforma AML",
	description: "Ver detalles del cliente",
};

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function ClienteDetallePage({
	params,
}: PageProps): Promise<React.ReactElement> {
	const { id } = await params;
	return <ClientDetailsView clientId={id} />;
}

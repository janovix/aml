import type { Metadata } from "next";
import { ClientEditView } from "@/components/clients/ClientEditView";

export const metadata: Metadata = {
	title: "Editar Cliente | Plataforma AML",
	description: "Editar información del cliente",
};

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function EditarClientePage({
	params,
}: PageProps): Promise<React.ReactElement> {
	const { id } = await params;
	return <ClientEditView clientId={id} />;
}

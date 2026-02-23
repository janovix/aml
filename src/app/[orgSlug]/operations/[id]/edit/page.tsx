import type { Metadata } from "next";
import { OperationEditView } from "@/components/operations/OperationEditView";

export const metadata: Metadata = {
	title: "Editar Operación | Plataforma AML",
	description: "Editar información de la operación",
};

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function EditarOperacionPage({
	params,
}: PageProps): Promise<React.ReactElement> {
	const { id } = await params;
	return <OperationEditView operationId={id} />;
}

import type { Metadata } from "next";
import { OperationDetailsView } from "@/components/operations/OperationDetailsView";

export const metadata: Metadata = {
	title: "Detalle de Operación | Plataforma AML",
	description: "Ver detalles de la operación",
};

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function OperacionDetallePage({
	params,
}: PageProps): Promise<React.ReactElement> {
	const { id } = await params;
	return <OperationDetailsView operationId={id} />;
}

import type { Metadata } from "next";
import { TransactionDetailsView } from "@/components/transactions/TransactionDetailsView";

export const metadata: Metadata = {
	title: "Detalle de Transacción | Plataforma AML",
	description: "Ver detalles de la transacción",
};

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function TransaccionDetallePage({
	params,
}: PageProps): Promise<React.ReactElement> {
	const { id } = await params;
	return <TransactionDetailsView transactionId={id} />;
}

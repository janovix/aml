import type { Metadata } from "next";
import { TransactionDetailPageContent } from "@/components/transactions/TransactionDetailPageContent";
import { mockTransactions } from "@/data/mockTransactions";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const transaction = mockTransactions.find((t) => t.id === id);

	if (!transaction) {
		return {
			title: "Transacción no encontrada | Plataforma AML",
		};
	}

	return {
		title: `Transacción ${transaction.reference || transaction.id} | Plataforma AML`,
		description: `Detalles de la transacción ${transaction.reference || transaction.id}`,
	};
}

export default async function TransactionDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
	const { id } = await params;
	return <TransactionDetailPageContent transactionId={id} />;
}

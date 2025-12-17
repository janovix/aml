import type { Metadata } from "next";
import { TransactionEditView } from "../../../../components/transactions/TransactionEditView";

export const metadata: Metadata = {
	title: "Editar Transacción | Plataforma AML",
	description: "Editar información de la transacción",
};

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function EditarTransaccionPage({
	params,
}: PageProps): Promise<React.ReactElement> {
	const { id } = await params;
	return <TransactionEditView transactionId={id} />;
}

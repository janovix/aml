import type { Metadata } from "next";
import { TransactionNewPageContent } from "@/components/transactions/TransactionNewPageContent";

export const metadata: Metadata = {
	title: "Nueva Transacción | Plataforma AML",
	description: "Registrar una nueva transacción en el sistema",
};

export default function TransactionNewPage(): React.ReactElement {
	return <TransactionNewPageContent />;
}

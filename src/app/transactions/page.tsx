import type { Metadata } from "next";
import { TransactionsPageContent } from "@/components/transactions/TransactionsPageContent";

export const metadata: Metadata = {
	title: "Transacciones | Plataforma AML",
	description: "Monitoreo y análisis de transacciones AML",
};

export default function TransactionsPage(): React.ReactElement {
	return <TransactionsPageContent />;
}

import type { Metadata } from "next";
import { TransactionsPageContent } from "@/components/transactions/TransactionsPageContent";

export const metadata: Metadata = {
	title: "Transacciones | Plataforma AML",
	description: "Gestión de transacciones de vehículos",
};

export default function TransaccionesPage(): React.ReactElement {
	return <TransactionsPageContent />;
}

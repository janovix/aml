import type { Metadata } from "next";
import { TransactionCreateView } from "@/components/transactions/TransactionCreateView";

export const metadata: Metadata = {
	title: "Nueva Transacción | Plataforma AML",
	description: "Registrar una nueva transacción",
};

export default function NuevaTransaccionPage(): React.ReactElement {
	return <TransactionCreateView />;
}

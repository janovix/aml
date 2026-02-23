import type { Metadata } from "next";
import { OperationCreateView } from "@/components/operations/OperationCreateView";

export const metadata: Metadata = {
	title: "Nueva Operación | Plataforma AML",
	description: "Registrar una nueva operación",
};

export default function NuevaOperacionPage(): React.ReactElement {
	return <OperationCreateView />;
}

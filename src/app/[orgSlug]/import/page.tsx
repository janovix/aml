import type { Metadata } from "next";
import { ImportPageContent } from "@/components/import";

export const metadata: Metadata = {
	title: "Importar Datos | Plataforma AML",
	description: "Importación masiva de clientes y transacciones",
};

export default function ImportPage(): React.ReactElement {
	return <ImportPageContent />;
}

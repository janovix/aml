import type { Metadata } from "next";
import { Suspense } from "react";
import { ImportPageContent } from "@/components/import";

export const metadata: Metadata = {
	title: "Importar Datos | Plataforma AML",
	description: "Importación masiva de clientes y transacciones",
};

export default function ImportPage(): React.ReactElement {
	return (
		<Suspense
			fallback={
				<div className="h-full flex items-center justify-center">
					Cargando...
				</div>
			}
		>
			<ImportPageContent />
		</Suspense>
	);
}

import type { Metadata } from "next";
import { CreateReportView } from "@/components/reports/CreateReportView";

export const metadata: Metadata = {
	title: "Nuevo Reporte | Plataforma AML",
	description: "Crear un nuevo reporte AML",
};

export default function NuevoReportePage(): React.ReactElement {
	return <CreateReportView />;
}

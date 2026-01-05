import type { Metadata } from "next";
import { ReportDetailsView } from "@/components/reports/ReportDetailsView";

export const metadata: Metadata = {
	title: "Detalle de Reporte | Plataforma AML",
	description: "Ver detalle de reporte AML",
};

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({
	params,
}: PageProps): Promise<React.ReactElement> {
	const { id } = await params;
	return <ReportDetailsView reportId={id} />;
}

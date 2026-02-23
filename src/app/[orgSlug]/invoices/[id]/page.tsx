import type { Metadata } from "next";
import { InvoiceDetailsView } from "@/components/invoices/InvoiceDetailsView";

export const metadata: Metadata = {
	title: "Detalle de Factura | Plataforma AML",
	description: "Ver detalles de la factura",
};

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({
	params,
}: PageProps): Promise<React.ReactElement> {
	const { id } = await params;
	return <InvoiceDetailsView invoiceId={id} />;
}

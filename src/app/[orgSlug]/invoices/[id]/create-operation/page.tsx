import type { Metadata } from "next";
import { CfdiReviewView } from "@/components/invoices/CfdiReviewView";

export const metadata: Metadata = {
	title: "Crear Operación desde Factura | Plataforma AML",
	description: "Crear operación a partir de CFDI",
};

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function CreateOperationFromInvoicePage({
	params,
}: PageProps): Promise<React.ReactElement> {
	const { id } = await params;
	return <CfdiReviewView invoiceId={id} />;
}

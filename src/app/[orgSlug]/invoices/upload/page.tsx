import type { Metadata } from "next";
import { InvoiceXmlUpload } from "@/components/invoices/InvoiceXmlUpload";

export const metadata: Metadata = {
	title: "Subir Factura XML | Plataforma AML",
	description: "Subir archivo CFDI XML",
};

export default function InvoiceUploadPage() {
	return <InvoiceXmlUpload />;
}

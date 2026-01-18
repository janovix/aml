import type { Metadata } from "next";
import { ImportViewContent } from "@/components/import/ImportViewContent";

export const metadata: Metadata = {
	title: "Importación en Progreso | Plataforma AML",
	description: "Seguimiento de importación masiva",
};

interface ImportViewPageProps {
	params: Promise<{ orgSlug: string; importId: string }>;
}

export default async function ImportViewPage({
	params,
}: ImportViewPageProps): Promise<React.ReactElement> {
	const { importId } = await params;
	return <ImportViewContent importId={importId} />;
}

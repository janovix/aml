import type { Metadata } from "next";
import { NoticeDetailsView } from "@/components/notices/NoticeDetailsView";

export const metadata: Metadata = {
	title: "Detalle de Aviso | Plataforma AML",
	description: "Ver detalle de aviso SAT",
};

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function NoticeDetailPage({
	params,
}: PageProps): Promise<React.ReactElement> {
	const { id } = await params;
	return <NoticeDetailsView noticeId={id} />;
}

import { AlertDetailsView } from "@/components/alerts/AlertDetailsView";

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function AlertaDetallePage({
	params,
}: PageProps): Promise<React.ReactElement> {
	const { id } = await params;
	return <AlertDetailsView alertId={id} />;
}


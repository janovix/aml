import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
	title: "Inicio | Plataforma AML",
	description:
		"Vista general del sistema AML con estadísticas, valor UMA y métricas clave",
};

export default function OrgHomePage(): React.ReactElement {
	return <DashboardView />;
}

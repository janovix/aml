import type { Metadata } from "next";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

export const metadata: Metadata = {
	title: "Actividad | Plataforma AML",
	description: "Historial de notificaciones y actividad del sistema",
};

export default function ActivityPage(): React.ReactElement {
	return <ActivityFeed />;
}

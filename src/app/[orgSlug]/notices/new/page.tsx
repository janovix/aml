import type { Metadata } from "next";
import { CreateNoticeView } from "@/components/notices/CreateNoticeView";

export const metadata: Metadata = {
	title: "Nuevo Aviso SAT | Plataforma AML",
	description: "Crear un nuevo aviso para envío al SAT",
};

export default function NuevoAvisoPage(): React.ReactElement {
	return <CreateNoticeView />;
}

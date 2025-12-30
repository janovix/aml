import type { Metadata } from "next";
import { ClientCreateView } from "../../../components/clients/ClientCreateView";

export const metadata: Metadata = {
	title: "Nuevo Cliente | Plataforma AML",
	description: "Crear un nuevo cliente en el sistema AML",
};

export default function NuevoClientePage(): React.ReactElement {
	return <ClientCreateView />;
}

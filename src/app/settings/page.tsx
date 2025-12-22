import type { Metadata } from "next";
import { SettingsPageContent } from "@/components/settings/SettingsPageContent";

export const metadata: Metadata = {
	title: "Configuración | Plataforma AML",
	description: "Configuración de la organización",
};

export default function SettingsPage(): React.ReactElement {
	return <SettingsPageContent />;
}

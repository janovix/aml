import ClientLayout from "@/components/ClientLayout";
import { getServerSession } from "@/lib/auth/getServerSession";
import { SessionHydrator } from "@/lib/auth/useAuthSession";
import { listOrganizationsServer } from "@/lib/auth/organizations-server";
import { getSidebarCollapsedServer } from "@/lib/settings/settingsServer";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Plataforma AML",
	description: "Sistema de gestión y análisis Anti-Lavado de Dinero",
	manifest: "/site.webmanifest",
	icons: {
		icon: [
			{ url: "/favicon.ico" },
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
		],
		apple: [
			{
				url: "/apple-touch-icon.png",
				sizes: "180x180",
				type: "image/png",
			},
		],
	},
};

export const viewport: Viewport = {
	themeColor: "#0f766e",
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	userScalable: true,
	viewportFit: "cover",
	interactiveWidget: "resizes-content",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getServerSession();
	const initialOrganizations = await listOrganizationsServer();
	const initialSidebarCollapsed = await getSidebarCollapsedServer();

	return (
		<html lang="es" suppressHydrationWarning>
			<body className={`${inter.variable} antialiased`}>
				<SessionHydrator serverSession={session}>
					<ClientLayout
						initialOrganizations={initialOrganizations}
						initialSidebarCollapsed={initialSidebarCollapsed}
					>
						{children}
					</ClientLayout>
				</SessionHydrator>
			</body>
		</html>
	);
}

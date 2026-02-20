import ClientLayout from "@/components/ClientLayout";
import { getServerSession } from "@/lib/auth/getServerSession";
import { SessionHydrator } from "@/lib/auth/useAuthSession";
import { listOrganizationsServer } from "@/lib/auth/organizations-server";
import { normalizeOrganization } from "@/lib/auth/organizations";
import { getSidebarCollapsedServer } from "@/lib/settings/settingsServer";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
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
	const requestHeaders = await headers();

	// Use session and org data forwarded by middleware to avoid duplicate auth-svc
	// API calls. Middleware already validates these on every request, so re-fetching
	// here would be redundant. Fall back to direct API calls when headers are absent
	// (e.g. direct server invocations, tests, or routes that bypass the middleware).
	const rawSession = requestHeaders.get("x-aml-session");
	const rawOrgs = requestHeaders.get("x-aml-organizations");

	const session = rawSession
		? // eslint-disable-next-line @typescript-eslint/no-explicit-any
			(JSON.parse(rawSession) as any)
		: await getServerSession();

	const initialOrganizations = rawOrgs
		? (() => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const parsed = JSON.parse(rawOrgs) as any;
				return {
					organizations: (parsed.organizations ?? []).map(
						normalizeOrganization,
					),
					activeOrganizationId: parsed.activeOrganizationId ?? null,
				};
			})()
		: await listOrganizationsServer();

	const initialSidebarCollapsed = await getSidebarCollapsedServer();

	return (
		<html lang="es" suppressHydrationWarning>
			<head>
				{/* Polyfill for esbuild's __name helper used by next-themes */}
				<script
					dangerouslySetInnerHTML={{
						__html: `if(typeof __name==="undefined"){window.__name=function(e){return e}}`,
					}}
				/>
			</head>
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

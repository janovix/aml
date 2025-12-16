import ClientLayout from "@/components/ClientLayout";
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
};

export const viewport: Viewport = {
	themeColor: "#0f766e",
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	userScalable: true,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es" suppressHydrationWarning>
			<body className={`${inter.variable} antialiased`}>
				<ClientLayout>{children}</ClientLayout>
			</body>
		</html>
	);
}

"use client";

import { AlertTriangle } from "lucide-react";

import { useLanguage } from "@/components/LanguageProvider";

export function ExpirationBanner({ count }: { count: number }) {
	const { t } = useLanguage();
	if (count <= 0) return null;

	return (
		<div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
			<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
			<div>
				<p className="font-medium">{t("trainingExpirySoon")}</p>
				<p className="text-muted-foreground">
					{count}{" "}
					{count === 1
						? t("trainingCertificateOne")
						: t("trainingCertificateMany")}{" "}
					{t("trainingExpiringSuffix")}.
				</p>
			</div>
		</div>
	);
}

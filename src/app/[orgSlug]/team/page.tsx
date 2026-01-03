"use client";

import { OrgTeamTable } from "@/components/org";
import { PageHero } from "@/components/page-hero";
import { Users } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function TeamPage() {
	const { t } = useLanguage();
	return (
		<div className="space-y-6">
			<PageHero
				title={t("teamTitle")}
				subtitle={t("teamSubtitle")}
				icon={Users}
				stats={[]}
			/>
			<OrgTeamTable />
		</div>
	);
}

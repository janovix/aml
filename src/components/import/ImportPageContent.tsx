"use client";

import { useState, useCallback } from "react";
import { Plus, FileSpreadsheet } from "lucide-react";
import { ImportsTable } from "./ImportsTable";
import { CreateImportDialog } from "./CreateImportDialog";
import { PageHero, type PageHeroAction } from "@/components/page-hero";
import { useLanguage } from "@/components/LanguageProvider";

export function ImportPageContent() {
	const { t } = useLanguage();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const handleImportSuccess = useCallback(() => {
		setRefreshTrigger((prev) => prev + 1);
	}, []);

	const heroActions: PageHeroAction[] = [
		{
			label: t("importsNewImport"),
			icon: Plus,
			onClick: () => setIsCreateDialogOpen(true),
			variant: "default",
		},
	];

	return (
		<div className="space-y-6">
			<PageHero
				title={t("importsPageTitle")}
				subtitle={t("importsPageSubtitle")}
				icon={FileSpreadsheet}
				actions={heroActions}
			/>

			<ImportsTable refreshTrigger={refreshTrigger} />

			<CreateImportDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				onSuccess={handleImportSuccess}
			/>
		</div>
	);
}

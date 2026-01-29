"use client";

import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useCallback, useEffect, useState } from "react";
import { ClientsTable } from "@/components/clients/ClientsTable";
import {
	PageHero,
	type StatCard,
	type PageHeroAction,
} from "@/components/page-hero";
import { Users, User, Building2, Plus, Upload } from "lucide-react";
import { getClientStats } from "@/lib/api/stats";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/mutations";
import { ApiError, isOrganizationRequiredError } from "@/lib/api/http";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocaleForLanguage } from "@/lib/translations";
import { useJwt } from "@/hooks/useJwt";
import { CreateImportDialog } from "@/components/import/CreateImportDialog";
import { useStatesCatalog } from "@/hooks/useStatesCatalog";

export function ClientsPageContent(): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { t, language } = useLanguage();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { isLoading: isStatesLoading } = useStatesCatalog(); // Preload states catalog
	const [stats, setStats] = useState<{
		totalClients: number;
		physicalClients: number;
		moralClients: number;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

	const fetchStats = useCallback(async () => {
		// Wait for JWT to be available (which means org is synced)
		if (!jwt) {
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			const data = await getClientStats({ jwt });
			setStats(data);
		} catch (error) {
			// Silently handle org-required errors - this can happen during org switching
			if (isOrganizationRequiredError(error)) {
				console.debug(
					"[ClientsPageContent] Organization required error - org may be syncing",
				);
				return;
			}

			if (error instanceof ApiError) {
				console.error(
					"[ClientsPageContent] API error fetching client stats:",
					`status=${error.status}`,
					`message=${error.message}`,
					"body=",
					error.body,
				);
			} else {
				console.error(
					"[ClientsPageContent] Error fetching client stats:",
					error instanceof Error ? error.message : error,
				);
			}
			toast.error(extractErrorMessage(error));
		} finally {
			setIsLoading(false);
		}
	}, [jwt]);

	useEffect(() => {
		// Only fetch when JWT is ready (which means org is ready)
		if (!isJwtLoading && jwt) {
			fetchStats();
		} else if (!isJwtLoading && !jwt) {
			// No JWT available (no org selected)
			setIsLoading(false);
		}
	}, [fetchStats, isJwtLoading, jwt]);

	const formatNumber = (num: number): string => {
		return new Intl.NumberFormat(getLocaleForLanguage(language)).format(num);
	};

	const heroStats: StatCard[] = [
		{
			label: t("statsTotalClients"),
			value: isLoading
				? "..."
				: stats?.totalClients
					? formatNumber(stats.totalClients)
					: "0",
			icon: Users,
			variant: "primary",
		},
		{
			label: t("statsPhysicalClients"),
			value: isLoading
				? "..."
				: stats?.physicalClients
					? formatNumber(stats.physicalClients)
					: "0",
			icon: User,
		},
		{
			label: t("statsMoralClients"),
			value: isLoading
				? "..."
				: stats?.moralClients
					? formatNumber(stats.moralClients)
					: "0",
			icon: Building2,
		},
	];

	const heroActions: PageHeroAction[] = [
		{
			label: t("clientsNew"),
			icon: Plus,
			onClick: () => navigateTo("/clients/new"),
			variant: "default",
		},
		{
			label: t("importClients"),
			icon: Upload,
			onClick: () => setIsImportDialogOpen(true),
			variant: "outline",
		},
	];

	return (
		<div className="space-y-6">
			<PageHero
				title={t("clientsTitle")}
				subtitle={t("clientsSubtitle")}
				icon={Users}
				stats={heroStats}
				actions={heroActions}
			/>

			<ClientsTable />

			<CreateImportDialog
				open={isImportDialogOpen}
				onOpenChange={setIsImportDialogOpen}
				defaultEntityType="CLIENT"
			/>
		</div>
	);
}

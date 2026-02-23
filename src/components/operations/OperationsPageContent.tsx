"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { OperationsTable } from "@/components/operations/OperationsTable";
import {
	PageHero,
	type StatCard,
	type PageHeroAction,
} from "@/components/page-hero";
import {
	FileText,
	Plus,
	Upload,
	AlertCircle,
	CheckCircle2,
} from "lucide-react";
import { ApiError, isOrganizationRequiredError } from "@/lib/api/http";
import { showFetchError } from "@/lib/toast-utils";
import { listOperations } from "@/lib/api/operations";
import { useJwt } from "@/hooks/useJwt";
import { useOrgStore } from "@/lib/org-store";
import { CreateImportDialog } from "@/components/import/CreateImportDialog";

export function OperationsPageContent(): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();
	const [totalCount, setTotalCount] = useState<number | null>(null);
	const [incompleteCount, setIncompleteCount] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

	const hasAttemptedForOrgRef = useRef<string | null>(null);

	const fetchStats = useCallback(async () => {
		if (!jwt || !currentOrg?.id) {
			setIsLoading(false);
			return;
		}

		// Don't re-fetch if we already attempted for this org (success or error)
		if (hasAttemptedForOrgRef.current === currentOrg.id) return;

		try {
			setIsLoading(true);

			// Fetch total count
			const totalResponse = await listOperations({
				page: 1,
				limit: 1,
				jwt,
			});
			setTotalCount(totalResponse.pagination.total);

			// Fetch incomplete count — we can't filter by completeness on the API,
			// so just use the total from main request.
			// For now, show total only. If a completeness filter is added, use it.
			setIncompleteCount(null);
			hasAttemptedForOrgRef.current = currentOrg.id;
		} catch (error) {
			hasAttemptedForOrgRef.current = currentOrg.id;

			if (isOrganizationRequiredError(error)) {
				console.debug(
					"[OperationsPageContent] Organization required error - org may be syncing",
				);
				// Reset so it retries after org sync
				hasAttemptedForOrgRef.current = null;
				return;
			}

			if (error instanceof ApiError) {
				console.error(
					"[OperationsPageContent] API error:",
					`status=${error.status}`,
					`message=${error.message}`,
				);
			} else {
				console.error(
					"[OperationsPageContent] Error:",
					error instanceof Error ? error.message : error,
				);
			}
			showFetchError("operations-stats", error);
		} finally {
			setIsLoading(false);
		}
	}, [jwt, currentOrg?.id]);

	useEffect(() => {
		if (!isJwtLoading && jwt) {
			fetchStats();
		} else if (!isJwtLoading && !jwt) {
			setIsLoading(false);
		}
	}, [fetchStats, isJwtLoading, jwt]);

	const heroStats: StatCard[] = [
		{
			label: "Total operaciones",
			value: isLoading ? "..." : (totalCount ?? 0),
			icon: FileText,
		},
		{
			label: "Operaciones completas",
			value: isLoading ? "..." : "—",
			icon: CheckCircle2,
		},
		{
			label: "Requieren atención",
			value: isLoading ? "..." : (incompleteCount ?? "—"),
			icon: AlertCircle,
			variant: "primary",
		},
	];

	const heroActions: PageHeroAction[] = [
		{
			label: "Nueva operación",
			icon: Plus,
			onClick: () => navigateTo("/operations/new"),
			variant: "default",
		},
		{
			label: "Importar operaciones",
			icon: Upload,
			onClick: () => setIsImportDialogOpen(true),
			variant: "outline",
		},
	];

	return (
		<div className="space-y-6">
			<PageHero
				title="Operaciones"
				subtitle="Gestiona las operaciones de tu actividad vulnerable"
				icon={FileText}
				stats={heroStats}
				actions={heroActions}
			/>

			<OperationsTable />

			<CreateImportDialog
				open={isImportDialogOpen}
				onOpenChange={setIsImportDialogOpen}
				defaultEntityType="OPERATION"
			/>
		</div>
	);
}

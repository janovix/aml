"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { InvoicesTable } from "@/components/invoices/InvoicesTable";
import {
	PageHero,
	type StatCard,
	type PageHeroAction,
} from "@/components/page-hero";
import { Receipt, Upload } from "lucide-react";
import { ApiError, isOrganizationRequiredError } from "@/lib/api/http";
import { showFetchError } from "@/lib/toast-utils";
import { listInvoices } from "@/lib/api/invoices";
import { useJwt } from "@/hooks/useJwt";
import { useOrgStore } from "@/lib/org-store";

export function InvoicesPageContent(): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { currentOrg } = useOrgStore();
	const [totalCount, setTotalCount] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const hasAttemptedForOrgRef = useRef<string | null>(null);

	const fetchStats = useCallback(async () => {
		if (!jwt || !currentOrg?.id) {
			setIsLoading(false);
			return;
		}

		if (hasAttemptedForOrgRef.current === currentOrg.id) return;

		try {
			setIsLoading(true);

			const totalResponse = await listInvoices({
				page: 1,
				limit: 1,
				jwt,
			});
			setTotalCount(totalResponse.pagination.total);
			hasAttemptedForOrgRef.current = currentOrg.id;
		} catch (error) {
			hasAttemptedForOrgRef.current = currentOrg.id;

			if (isOrganizationRequiredError(error)) {
				console.debug(
					"[InvoicesPageContent] Organization required error - org may be syncing",
				);
				hasAttemptedForOrgRef.current = null;
				return;
			}

			if (error instanceof ApiError) {
				console.error(
					"[InvoicesPageContent] API error:",
					`status=${error.status}`,
					`message=${error.message}`,
				);
			} else {
				console.error(
					"[InvoicesPageContent] Error:",
					error instanceof Error ? error.message : error,
				);
			}
			showFetchError("invoices-stats", error);
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
			label: "Total facturas",
			value: isLoading ? "..." : (totalCount ?? 0),
			icon: Receipt,
		},
	];

	const heroActions: PageHeroAction[] = [
		{
			label: "Subir XML",
			icon: Upload,
			onClick: () => navigateTo("/invoices/upload"),
			variant: "default",
		},
	];

	return (
		<div className="space-y-6">
			<PageHero
				title="Facturas"
				subtitle="Gestiona las facturas CFDI de tu organización"
				icon={Receipt}
				stats={heroStats}
				actions={heroActions}
			/>

			<InvoicesTable />
		</div>
	);
}

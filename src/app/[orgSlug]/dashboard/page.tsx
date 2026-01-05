import { redirect } from "next/navigation";

interface PageProps {
	params: Promise<{ orgSlug: string }>;
}

/**
 * Redirect /dashboard to org home for backwards compatibility
 */
export default async function DashboardRedirect({
	params,
}: PageProps): Promise<void> {
	const { orgSlug } = await params;
	redirect(`/${orgSlug}`);
}

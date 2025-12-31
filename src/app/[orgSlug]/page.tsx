import { redirect } from "next/navigation";

interface PageProps {
	params: Promise<{ orgSlug: string }>;
}

export default async function OrgHomePage({
	params,
}: PageProps): Promise<void> {
	const { orgSlug } = await params;
	redirect(`/${orgSlug}/clients`);
}

import { OrgTeamTable } from "@/components/org";
import { PageHero } from "@/components/page-hero";
import { Users } from "lucide-react";

export default function TeamPage() {
	return (
		<div className="space-y-6">
			<PageHero
				title="Team"
				subtitle="Manage your organization's team members and invitations."
				icon={Users}
				stats={[]}
			/>
			<OrgTeamTable />
		</div>
	);
}

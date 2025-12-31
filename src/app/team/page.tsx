import { OrgTeamTable } from "@/components/org";
import { AlertsTable } from "@/components/alerts";
import { ReportsTable } from "@/components/reports";

export default function TeamPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Team</h1>
				<p className="text-muted-foreground">
					Manage your organization&apos;s team members and invitations.
				</p>
			</div>
			<OrgTeamTable />
			<AlertsTable />
			<ReportsTable />
		</div>
	);
}

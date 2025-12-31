import { OrgTeamTable } from "@/components/org";
import { Users } from "lucide-react";

export default function TeamPage() {
	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-start gap-3 min-w-0">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
					<Users className="h-5 w-5" />
				</div>
				<div className="min-w-0">
					<h1 className="text-2xl font-semibold text-foreground tracking-tight">
						Team
					</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						Manage your organization&apos;s team members and invitations.
					</p>
				</div>
			</div>
			<OrgTeamTable />
		</div>
	);
}

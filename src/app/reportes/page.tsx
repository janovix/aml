import { ReportsTable } from "@/components/reports";

export default function ReportesPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
				<p className="text-muted-foreground">
					Gestión y seguimiento de reportes AML
				</p>
			</div>
			<ReportsTable />
		</div>
	);
}

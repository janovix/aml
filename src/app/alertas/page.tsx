import { AlertsTable } from "@/components/alerts";

export default function AlertasPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Alertas</h1>
				<p className="text-muted-foreground">
					Monitoreo y gestión de alertas AML
				</p>
			</div>
			<AlertsTable />
		</div>
	);
}

import { Skeleton } from "@/components/ui/skeleton";

export default function RiskLoading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-32 rounded-xl" />
			<div className="grid gap-6 @2xl/main:grid-cols-2">
				<Skeleton className="h-[300px] rounded-xl" />
				<Skeleton className="h-[300px] rounded-xl" />
			</div>
			<Skeleton className="h-[200px] rounded-xl" />
		</div>
	);
}

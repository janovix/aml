"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	ShieldCheck,
	ShieldAlert,
	ShieldQuestion,
	Loader2,
	AlertCircle,
	Activity,
} from "lucide-react";
import { useWatchlistScreening } from "@/hooks/useWatchlistScreening";
import { cn } from "@/lib/utils";

interface WatchlistScreeningSectionProps {
	watchlistQueryId: string | null | undefined;
	className?: string;
	authToken?: string;
}

const STATUS_CONFIG = {
	pending: {
		label: "Pending",
		icon: ShieldQuestion,
		color: "text-gray-500",
		bgColor: "bg-gray-100",
	},
	processing: {
		label: "Processing",
		icon: Loader2,
		color: "text-blue-500",
		bgColor: "bg-blue-100",
	},
	completed: {
		label: "Completed",
		icon: ShieldCheck,
		color: "text-green-500",
		bgColor: "bg-green-100",
	},
	failed: {
		label: "Failed",
		icon: AlertCircle,
		color: "text-red-500",
		bgColor: "bg-red-100",
	},
	skipped: {
		label: "Skipped",
		icon: ShieldQuestion,
		color: "text-gray-400",
		bgColor: "bg-gray-50",
	},
};

function StatusBadge({ status }: { status: string }) {
	const config =
		STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ||
		STATUS_CONFIG.pending;
	const Icon = config.icon;

	return (
		<Badge variant="outline" className={cn("gap-1", config.bgColor)}>
			<Icon
				className={cn(
					"h-3 w-3",
					config.color,
					status === "processing" && "animate-spin",
				)}
			/>
			<span className={config.color}>{config.label}</span>
		</Badge>
	);
}

function ScreeningResult({
	label,
	status,
	count,
}: {
	label: string;
	status: string;
	count?: number;
}) {
	const hasMatches = count && count > 0;

	return (
		<div className="flex items-center justify-between py-2 border-b last:border-0">
			<span className="text-sm font-medium">{label}</span>
			<div className="flex items-center gap-2">
				{hasMatches && (
					<Badge variant="destructive" className="gap-1">
						<ShieldAlert className="h-3 w-3" />
						{count} {count === 1 ? "match" : "matches"}
					</Badge>
				)}
				<StatusBadge status={status} />
			</div>
		</div>
	);
}

export function WatchlistScreeningSection({
	watchlistQueryId,
	className,
	authToken,
}: WatchlistScreeningSectionProps) {
	const { data, isLoading, error, connectionStatus, isComplete } =
		useWatchlistScreening({
			watchlistQueryId,
			enabled: !!watchlistQueryId,
			authToken,
		});

	if (!watchlistQueryId) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ShieldCheck className="h-5 w-5" />
						Watchlist Screening
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							No screening initiated yet. Screening will be triggered
							automatically when client data is saved.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	if (isLoading && !data) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ShieldCheck className="h-5 w-5" />
						Watchlist Screening
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ShieldCheck className="h-5 w-5" />
						Watchlist Screening
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	if (!data) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ShieldCheck className="h-5 w-5" />
						Watchlist Screening
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>No screening data available.</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	const hasAnyMatches =
		data.ofacCount > 0 ||
		data.sat69bCount > 0 ||
		data.unCount > 0 ||
		data.pepOfficialCount > 0;

	return (
		<Card className={className}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						{hasAnyMatches ? (
							<ShieldAlert className="h-5 w-5 text-red-500" />
						) : (
							<ShieldCheck className="h-5 w-5 text-green-500" />
						)}
						Watchlist Screening
					</CardTitle>
					{connectionStatus === "connected" && (
						<Badge variant="outline" className="gap-1 bg-blue-50">
							<Activity className="h-3 w-3 text-blue-500 animate-pulse" />
							<span className="text-blue-500">Live</span>
						</Badge>
					)}
					{!isComplete && connectionStatus !== "connected" && (
						<Badge variant="outline" className="gap-1">
							<Loader2 className="h-3 w-3 animate-spin" />
							In Progress
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-1">
					{/* Synchronous results */}
					<ScreeningResult
						label="OFAC Sanctions List"
						status={data.ofacStatus}
						count={data.ofacCount}
					/>
					<ScreeningResult
						label="UN Sanctions List"
						status={data.unStatus}
						count={data.unCount}
					/>
					<ScreeningResult
						label="SAT 69-B (Mexico)"
						status={data.sat69bStatus}
						count={data.sat69bCount}
					/>

					{/* Asynchronous results */}
					<ScreeningResult
						label="PEP Official (Transparency)"
						status={data.pepOfficialStatus}
						count={data.pepOfficialCount}
					/>
					<ScreeningResult label="PEP AI Detection" status={data.pepAiStatus} />
					<ScreeningResult
						label="Adverse Media"
						status={data.adverseMediaStatus}
					/>
				</div>

				{hasAnyMatches && (
					<Alert variant="destructive" className="mt-4">
						<ShieldAlert className="h-4 w-4" />
						<AlertDescription>
							Matches found in one or more watchlists. Please review the
							detailed results in the Watchlist Service dashboard.
						</AlertDescription>
					</Alert>
				)}

				<div className="mt-4 text-xs text-muted-foreground">
					<p>Query ID: {data.id}</p>
					<p>Last Updated: {new Date(data.updatedAt).toLocaleString()}</p>
				</div>
			</CardContent>
		</Card>
	);
}

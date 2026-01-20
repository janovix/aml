"use client";

/**
 * ChatUsageDisplay
 *
 * Shows the current token usage and remaining allowance.
 *
 * TODO: Implement centralized chat infrastructure
 * - Move chat API to auth-svc for cross-app support (aml, auth, watchlist)
 * - Create /api/chat/usage endpoint in auth-svc for billing/tracking
 * - Add service bindings from auth-svc to aml-svc, watchlist-svc for tools
 * - Context-aware tools based on calling app
 * - Future: MCP server with OAuth/OpenID for user access to their data
 *   (settings, organizations, members, transactions, etc.)
 */

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
	formatTokenCount,
	calculateUsagePercentage,
	type TokenUsageResponse,
} from "@/lib/ai";
import { Zap, AlertTriangle } from "lucide-react";

interface ChatUsageDisplayProps {
	className?: string;
}

export function ChatUsageDisplay({ className }: ChatUsageDisplayProps) {
	// TODO: Enable when auth-svc /api/chat/usage endpoint is implemented
	// const [usage, setUsage] = useState<TokenUsageResponse["data"] | null>(null);
	// const [isLoading, setIsLoading] = useState(true);
	//
	// useEffect(() => {
	// 	async function fetchUsage() {
	// 		setIsLoading(true);
	// 		const response = await getTokenUsage();
	// 		if (response.success && response.data) {
	// 			setUsage(response.data);
	// 		}
	// 		setIsLoading(false);
	// 	}
	// 	fetchUsage();
	// }, []);

	// Temporarily disabled until centralized billing is implemented
	return null;

	// Original implementation below - uncomment when ready
	/* eslint-disable @typescript-eslint/no-unused-vars */
	/*const usage: TokenUsageResponse["data"] | null = null;
	const isLoading = false;

	if (isLoading) {
		return (
			<div className={cn("animate-pulse flex items-center gap-2", className)}>
				<div className="h-4 w-24 bg-muted rounded" />
			</div>
		);
	}

	if (!usage) {
		return null;
	}

	const percentage = calculateUsagePercentage(usage.used, usage.included);
	const isNearLimit = percentage >= 80;
	const isOverLimit = usage.remaining <= 0;

	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<div className="flex items-center justify-between text-xs">
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<Zap className="h-3 w-3" />
					<span>Token Usage</span>
				</div>
				<span
					className={cn(
						"font-medium",
						isOverLimit
							? "text-red-500"
							: isNearLimit
								? "text-yellow-500"
								: "text-foreground",
					)}
				>
					{formatTokenCount(usage.used)} / {formatTokenCount(usage.included)}
				</span>
			</div>
			<Progress
				value={Math.min(percentage, 100)}
				className={cn(
					"h-1.5",
					isOverLimit
						? "[&>div]:bg-red-500"
						: isNearLimit
							? "[&>div]:bg-yellow-500"
							: "",
				)}
			/>
			{isOverLimit && (
				<div className="flex items-center gap-1 text-xs text-red-500">
					<AlertTriangle className="h-3 w-3" />
					<span>Overage: {formatTokenCount(usage.overageCount)} tokens</span>
				</div>
			)}
			{isNearLimit && !isOverLimit && (
				<p className="text-xs text-yellow-500">
					{usage.remaining > 0
						? `${formatTokenCount(usage.remaining)} tokens remaining`
						: "Token limit reached"}
				</p>
			)}
		</div>
	);*/
	/* eslint-enable @typescript-eslint/no-unused-vars */
}

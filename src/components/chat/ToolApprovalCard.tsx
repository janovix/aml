"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

interface ToolApprovalCardProps {
	approvalId: string;
	toolLabel: string;
	onApprove: (approvalId: string) => void;
	onDeny: (approvalId: string) => void;
	className?: string;
}

export function ToolApprovalCard({
	approvalId,
	toolLabel,
	onApprove,
	onDeny,
	className,
}: ToolApprovalCardProps) {
	return (
		<div
			className={cn(
				"rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm space-y-2",
				className,
			)}
		>
			<div className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-100">
				<ShieldAlert className="h-4 w-4 shrink-0" />
				<span>Confirmation required: {toolLabel || "tool"}</span>
			</div>
			<p className="text-muted-foreground text-xs">
				This action can change data in your organization. Approve only if you
				intend to run it.
			</p>
			<div className="flex gap-2 pt-1">
				<Button
					type="button"
					size="sm"
					variant="default"
					className="h-8"
					onClick={() => onApprove(approvalId)}
				>
					Approve
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					className="h-8"
					onClick={() => onDeny(approvalId)}
				>
					Deny
				</Button>
			</div>
		</div>
	);
}

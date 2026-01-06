"use client";

import type React from "react";
import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

interface LabelWithInfoProps {
	htmlFor?: string;
	children: React.ReactNode;
	description?: string;
	required?: boolean;
	className?: string;
}

export function LabelWithInfo({
	htmlFor,
	children,
	description,
	required,
	className,
}: LabelWithInfoProps): React.JSX.Element {
	if (!description) {
		return (
			<Label htmlFor={htmlFor} className={className}>
				{children}
				{required && <span className="text-destructive ml-1">*</span>}
			</Label>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<Label htmlFor={htmlFor} className={className}>
				{children}
				{required && <span className="text-destructive ml-1">*</span>}
			</Label>
			<Tooltip>
				<TooltipTrigger asChild>
					<span
						role="img"
						aria-label="Información del campo"
						className="inline-flex items-center justify-center cursor-default"
					>
						<Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
					</span>
				</TooltipTrigger>
				<TooltipContent
					side="top"
					className="max-w-sm text-sm leading-relaxed"
					sideOffset={5}
				>
					<p className="whitespace-pre-wrap">{description}</p>
				</TooltipContent>
			</Tooltip>
		</div>
	);
}

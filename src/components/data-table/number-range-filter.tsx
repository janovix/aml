"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface NumberRangeFilterProps {
	id: string;
	label: string;
	/** Dataset minimum (as numeric string) */
	min?: string;
	/** Dataset maximum (as numeric string) */
	max?: string;
	/** Current active value: ["1000", "50000"] or empty */
	activeValues: string[];
	onChangeRange: (from: string, to: string) => void;
	onClear: () => void;
	clearText?: string;
}

export function NumberRangeFilter({
	label,
	min,
	max,
	activeValues,
	onChangeRange,
	onClear,
	clearText = "Limpiar",
}: NumberRangeFilterProps) {
	const [from, setFrom] = useState(activeValues[0] ?? "");
	const [to, setTo] = useState(activeValues[1] ?? "");

	const isActive =
		activeValues.length > 0 && (activeValues[0] || activeValues[1]);

	const minNum = min != null ? parseFloat(min) : undefined;
	const maxNum = max != null ? parseFloat(max) : undefined;

	function handleApply() {
		if (from || to) {
			onChangeRange(from, to);
		}
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					className={cn(
						"flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
						"border hover:bg-secondary/50",
						isActive
							? "bg-primary/5 border-primary/30 text-foreground"
							: "bg-transparent border-border text-muted-foreground hover:text-foreground",
					)}
				>
					<TrendingUp className="h-3.5 w-3.5" />
					<span className="hidden @sm/main:inline">{label}</span>
					{isActive && (
						<Badge
							variant="secondary"
							className="h-4 px-1 text-[10px] bg-primary text-primary-foreground ml-0.5"
						>
							1
						</Badge>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-0" align="start">
				<div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
					<span className="text-sm font-medium">{label}</span>
					{isActive && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								onClear();
								setFrom("");
								setTo("");
							}}
							className="h-6 px-2 text-xs text-muted-foreground"
						>
							{clearText}
						</Button>
					)}
				</div>
				<div className="p-3 space-y-3">
					{(minNum !== undefined || maxNum !== undefined) && (
						<p className="text-[10px] text-muted-foreground">
							Rango: {minNum?.toLocaleString("es-MX")} –{" "}
							{maxNum?.toLocaleString("es-MX")}
						</p>
					)}
					<div className="space-y-1.5">
						<Label className="text-xs text-muted-foreground">Mínimo</Label>
						<Input
							type="number"
							value={from}
							min={minNum}
							max={to ? parseFloat(to) : maxNum}
							placeholder={minNum?.toLocaleString("es-MX") ?? "0"}
							onChange={(e) => setFrom(e.target.value)}
							className="h-8 text-sm"
						/>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs text-muted-foreground">Máximo</Label>
						<Input
							type="number"
							value={to}
							min={from ? parseFloat(from) : minNum}
							max={maxNum}
							placeholder={maxNum?.toLocaleString("es-MX") ?? ""}
							onChange={(e) => setTo(e.target.value)}
							className="h-8 text-sm"
						/>
					</div>
					<Button size="sm" className="w-full" onClick={handleApply}>
						Aplicar
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}

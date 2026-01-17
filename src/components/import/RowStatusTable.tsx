"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
	CheckCircle2,
	AlertTriangle,
	XCircle,
	Clock,
	ChevronDown,
	ChevronUp,
	ChevronsDown,
	ChevronsUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { RowDisplayData, ImportRowStatus } from "@/types/import";

interface RowStatusTableProps {
	rows: RowDisplayData[];
	currentRow: number;
}

const statusConfig: Record<
	ImportRowStatus,
	{
		icon: typeof CheckCircle2;
		label: string;
		color: string;
		bgColor: string;
		badgeClass: string;
	}
> = {
	PENDING: {
		icon: Clock,
		label: "Pendiente",
		color: "text-muted-foreground",
		bgColor: "bg-muted",
		badgeClass: "bg-muted text-muted-foreground",
	},
	SUCCESS: {
		icon: CheckCircle2,
		label: "Exitoso",
		color: "text-success",
		bgColor: "bg-success/10",
		badgeClass: "bg-success/20 text-success border-success/30",
	},
	WARNING: {
		icon: AlertTriangle,
		label: "Advertencia",
		color: "text-warning",
		bgColor: "bg-warning/10",
		badgeClass: "bg-warning/20 text-warning border-warning/30",
	},
	ERROR: {
		icon: XCircle,
		label: "Error",
		color: "text-destructive",
		bgColor: "bg-destructive/10",
		badgeClass: "bg-destructive/20 text-destructive border-destructive/30",
	},
	SKIPPED: {
		icon: AlertTriangle,
		label: "Omitido",
		color: "text-warning",
		bgColor: "bg-warning/10",
		badgeClass: "bg-warning/20 text-warning border-warning/30",
	},
};

function RowItem({
	row,
	isActive,
}: {
	row: RowDisplayData;
	isActive: boolean;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const config = statusConfig[row.status];
	const Icon = config.icon;

	// Parse the raw data for display
	const displayData = row.data || {};
	const primaryFields = Object.entries(displayData).slice(0, 4);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<div
				className={cn(
					"border-b border-border last:border-b-0 transition-colors",
					isActive && row.status === "PENDING" && "bg-primary/5",
					row.status !== "PENDING" && "animate-slide-in",
				)}
			>
				<CollapsibleTrigger asChild>
					<button className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
						<div className="flex items-center gap-3 md:gap-4">
							<span className="text-xs md:text-sm font-mono text-muted-foreground w-8 md:w-12">
								#{row.rowNumber.toString().padStart(3, "0")}
							</span>
							<div className={cn("p-1 md:p-1.5 rounded-md", config.bgColor)}>
								<Icon
									className={cn("h-3.5 w-3.5 md:h-4 md:w-4", config.color)}
								/>
							</div>
							<div className="text-left">
								<p className="text-sm font-medium text-foreground truncate max-w-[200px]">
									{primaryFields[0]?.[1] || "—"}
								</p>
								<p className="text-xs text-muted-foreground truncate max-w-[200px]">
									{primaryFields[1]?.[1] || "—"}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2 md:gap-3">
							{row.message && (
								<Badge
									variant="outline"
									className={cn("font-normal text-xs", config.badgeClass)}
								>
									{config.label}
								</Badge>
							)}
							{row.status !== "PENDING" &&
								(isOpen ? (
									<ChevronUp className="h-4 w-4 text-muted-foreground" />
								) : (
									<ChevronDown className="h-4 w-4 text-muted-foreground" />
								))}
						</div>
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="px-3 md:px-4 pb-3 md:pb-4 pl-12 md:pl-20">
						<div className="p-3 md:p-4 rounded-lg bg-secondary/50 space-y-3">
							<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
								{primaryFields.map(([key, value]) => (
									<div key={key}>
										<p className="text-muted-foreground text-xs mb-1 capitalize">
											{key.replace(/_/g, " ")}
										</p>
										<p className="font-medium text-foreground truncate">
											{value || "—"}
										</p>
									</div>
								))}
							</div>
							{row.message && (
								<div
									className={cn(
										"p-2 md:p-3 rounded-md text-xs md:text-sm",
										row.status === "SUCCESS" && "bg-success/10 text-success",
										row.status === "WARNING" && "bg-warning/10 text-warning",
										row.status === "SKIPPED" && "bg-warning/10 text-warning",
										row.status === "ERROR" &&
											"bg-destructive/10 text-destructive",
									)}
								>
									{row.message}
								</div>
							)}
							{row.errors && row.errors.length > 0 && (
								<div className="p-2 md:p-3 rounded-md bg-destructive/10 text-destructive text-xs md:text-sm">
									<ul className="list-disc list-inside space-y-1">
										{row.errors.map((error, idx) => (
											<li key={idx}>{error}</li>
										))}
									</ul>
								</div>
							)}
							{row.entityId && (
								<div className="text-xs text-muted-foreground">
									ID creado: <code className="font-mono">{row.entityId}</code>
								</div>
							)}
						</div>
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}

export function RowStatusTable({ rows, currentRow }: RowStatusTableProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const [filter, setFilter] = useState<"all" | "SUCCESS" | "WARNING" | "ERROR">(
		"all",
	);
	const [showGoToTop, setShowGoToTop] = useState(false);
	const [showGoToBottom, setShowGoToBottom] = useState(false);

	const isNearBottom = useCallback(() => {
		if (!scrollRef.current) return true;
		const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
		return scrollHeight - scrollTop - clientHeight < 100;
	}, []);

	const handleScroll = useCallback(() => {
		if (scrollRef.current) {
			const scrollTop = scrollRef.current.scrollTop;
			setShowGoToTop(scrollTop > 200);
			setShowGoToBottom(!isNearBottom() && rows.length > 0);
		}
	}, [isNearBottom, rows.length]);

	useEffect(() => {
		const scrollElement = scrollRef.current;
		if (scrollElement) {
			scrollElement.addEventListener("scroll", handleScroll, { passive: true });
			return () => scrollElement.removeEventListener("scroll", handleScroll);
		}
	}, [handleScroll]);

	const handleGoToTop = useCallback(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, []);

	const handleGoToBottom = useCallback(() => {
		if (bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
		}
	}, []);

	const filteredRows = useMemo(() => {
		if (filter === "all") return rows;
		return rows.filter((row) => row.status === filter);
	}, [rows, filter]);

	const filterButtons = [
		{ value: "all" as const, label: "Todos" },
		{ value: "SUCCESS" as const, label: "Exitosos" },
		{ value: "WARNING" as const, label: "Advertencias" },
		{ value: "ERROR" as const, label: "Errores" },
	];

	return (
		<div className="h-full flex flex-col overflow-hidden bg-background relative">
			{/* Sticky filter header */}
			<div className="flex-shrink-0 border-b border-border bg-card">
				<div className="flex items-center justify-between gap-2 px-3 py-2">
					<h2 className="text-sm font-semibold text-foreground">
						Detalle de Importación
					</h2>
					<div className="flex items-center gap-1">
						{filterButtons.map((btn) => (
							<Button
								key={btn.value}
								variant={filter === btn.value ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setFilter(btn.value)}
								className={cn(
									"text-xs h-7 px-2",
									filter === btn.value && "bg-secondary",
								)}
							>
								{btn.label}
							</Button>
						))}
					</div>
				</div>
			</div>

			{/* Scrollable row list */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto">
				<div className="bg-card">
					{filteredRows.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground">
							No hay filas que coincidan con el filtro seleccionado
						</div>
					) : (
						filteredRows.map((row) => (
							<div key={row.rowNumber} data-row={row.rowNumber}>
								<RowItem row={row} isActive={row.rowNumber === currentRow} />
							</div>
						))
					)}
					<div ref={bottomRef} className="h-24" />
				</div>
			</div>

			{/* Go to Top button */}
			<div
				className={cn(
					"absolute right-3 top-1/2 -translate-y-1/2 z-20 transition-all duration-300",
					showGoToTop
						? "opacity-100 translate-x-0"
						: "opacity-0 translate-x-4 pointer-events-none",
				)}
			>
				<Button
					onClick={handleGoToTop}
					size="icon"
					variant="secondary"
					className="h-9 w-9 rounded-full shadow-lg bg-card hover:bg-secondary border border-border"
				>
					<ChevronsUp className="h-4 w-4" />
					<span className="sr-only">Ir arriba</span>
				</Button>
			</div>

			{/* Go to Bottom button */}
			<div
				className={cn(
					"absolute bottom-4 left-1/2 -translate-x-1/2 z-20 transition-all duration-300",
					showGoToBottom
						? "opacity-100 translate-y-0"
						: "opacity-0 translate-y-4 pointer-events-none",
				)}
			>
				<Button
					onClick={handleGoToBottom}
					size="sm"
					className="shadow-lg gap-2 px-4 h-9 rounded-full bg-card hover:bg-secondary text-foreground border border-border"
				>
					<ChevronsDown className="h-4 w-4" />
					<span>Ir abajo</span>
				</Button>
			</div>
		</div>
	);
}

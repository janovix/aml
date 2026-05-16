"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { isJanbotToolResult, type JanbotToolResult } from "@/lib/ai/tool-types";

function JsonBlock({ data }: { data: unknown }) {
	return (
		<pre className="text-[11px] leading-snug overflow-x-auto max-h-56 whitespace-pre-wrap font-mono">
			{JSON.stringify(data, null, 2)}
		</pre>
	);
}

export function ToolResultCard({
	toolName,
	output,
}: {
	toolName: string;
	output: unknown;
}) {
	if (isJanbotToolResult(output)) {
		const r = output as JanbotToolResult;
		switch (r.kind) {
			case "janbot.markdown":
				return (
					<div className="rounded-lg border bg-muted/40 p-2 text-xs max-h-64 overflow-y-auto">
						<div className="font-semibold text-foreground mb-1">
							{r.title ?? toolName}
						</div>
						<ReactMarkdown>{r.markdown}</ReactMarkdown>
					</div>
				);
			case "janbot.api":
				return (
					<div className="rounded-lg border bg-muted/40 p-2 text-xs space-y-1 max-h-64 overflow-y-auto">
						<div className="font-semibold text-foreground">{r.title}</div>
						<div className="text-muted-foreground font-mono text-[10px]">
							{r.endpoint}
						</div>
						<JsonBlock data={r.data} />
					</div>
				);
			case "janbot.table":
				return (
					<div className="rounded-lg border bg-muted/40 p-2 text-xs max-h-64 overflow-x-auto">
						<div className="font-semibold text-foreground mb-2">{r.title}</div>
						<table className="w-full border-collapse text-[11px]">
							<thead>
								<tr>
									{r.columns.map((c) => (
										<th
											key={c}
											className="border border-border px-2 py-1 text-left font-medium bg-muted"
										>
											{c}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{r.rows.map((row, i) => (
									<tr key={i} className="odd:bg-background/50">
										{r.columns.map((c) => (
											<td key={c} className="border border-border px-2 py-1">
												{String(row[c] ?? "")}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				);
			case "janbot.watchlist.screen":
				return (
					<div
						className={cn(
							"rounded-lg border p-2 text-xs space-y-1",
							"bg-amber-500/5 border-amber-500/30",
						)}
					>
						<div className="font-semibold">Watchlist screen started</div>
						<div>
							<span className="text-muted-foreground">queryId:</span>{" "}
							<code className="text-[11px]">{r.queryId}</code>
						</div>
						<div className="grid grid-cols-3 gap-2 text-[11px]">
							<div>
								<span className="text-muted-foreground">OFAC</span>{" "}
								<span className="font-mono">{r.ofacCount}</span>
							</div>
							<div>
								<span className="text-muted-foreground">UNSC</span>{" "}
								<span className="font-mono">{r.unscCount}</span>
							</div>
							<div>
								<span className="text-muted-foreground">SAT 69-B</span>{" "}
								<span className="font-mono">{r.sat69bCount}</span>
							</div>
						</div>
					</div>
				);
			default:
				return null;
		}
	}

	const text =
		typeof output === "string" ? output : JSON.stringify(output, null, 2);
	return (
		<div className="rounded-lg border bg-muted/40 p-2 text-xs font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
			<div className="font-semibold text-foreground mb-1">{toolName}</div>
			{text}
		</div>
	);
}

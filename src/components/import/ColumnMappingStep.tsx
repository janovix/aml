"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, Info, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImportTargetField } from "@/lib/api/imports";

export interface ColumnMappingStepProps {
	fileName: string;
	entityType: "CLIENT" | "OPERATION";
	activityCode?: string | null;
	headers: string[];
	sampleRows: Record<string, string>[];
	targetFields: ImportTargetField[];
	/** Pre-filled mapping from auto-suggest (optional) */
	initialMapping?: Record<string, string>;
	/** Show the "Auto-mapping applied" notice when initialMapping was used */
	showAutoMappingNotice?: boolean;
	onStartImport: (mapping: Record<string, string>) => void | Promise<void>;
}

export function ColumnMappingStep({
	fileName,
	entityType,
	activityCode,
	headers,
	sampleRows,
	targetFields,
	initialMapping = {},
	showAutoMappingNotice = false,
	onStartImport,
}: ColumnMappingStepProps) {
	const requiredFields = targetFields.filter((f) => f.required);
	const [mapping, setMapping] = useState<Record<string, string>>(() => {
		const initial: Record<string, string> = {};
		headers.forEach((h) => {
			if (initialMapping[h]) {
				initial[h] = initialMapping[h];
			}
		});
		return initial;
	});
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [submitting, setSubmitting] = useState(false);

	const usedValues = Object.values(mapping).filter(Boolean);

	function getAvailableOptions(currentHeader: string) {
		const currentVal = mapping[currentHeader];
		return targetFields.filter(
			(f) => !usedValues.includes(f.value) || f.value === currentVal,
		);
	}

	async function handleSubmit() {
		const missing = requiredFields.filter(
			(f) => !Object.values(mapping).includes(f.value),
		);
		if (missing.length > 0) {
			setValidationErrors(
				missing.map((f) => `Mapea el campo requerido: ${f.label}`),
			);
			return;
		}
		setValidationErrors([]);
		setSubmitting(true);
		const toSend: Record<string, string> = {};
		Object.entries(mapping).forEach(([col, target]) => {
			if (target) toSend[col] = target;
		});
		try {
			await onStartImport(toSend);
		} catch {
			setSubmitting(false);
		}
	}

	const displayErrors = validationErrors;

	return (
		<div>
			{/* Header */}
			<div className="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-balance text-xl font-semibold text-foreground">
						Mapear columnas
					</h1>
					<p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
						Asocia cada columna de tu archivo con el campo correspondiente. Los
						campos requeridos deben estar mapeados.
					</p>
				</div>
				<div className="flex shrink-0 flex-col items-end gap-1">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span className="font-medium text-foreground">{fileName}</span>
						<span className="rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground capitalize">
							{entityType === "CLIENT" ? "clientes" : "operaciones"}
						</span>
						{activityCode && (
							<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
								{activityCode}
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Auto-mapping notice */}
			{showAutoMappingNotice && (
				<div className="mb-5 flex items-start gap-2 rounded border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm text-accent-foreground">
					<Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
					<span>
						<strong>Auto-mapeo aplicado.</strong> Los nombres de columna se
						asociaron a campos cuando fue posible. Revisa y ajusta si hace
						falta.
					</span>
				</div>
			)}

			{/* Validation errors */}
			{displayErrors.length > 0 && (
				<div
					role="alert"
					className="mb-5 rounded border border-destructive/30 bg-destructive/5 px-4 py-3"
				>
					<div className="mb-2 flex items-center gap-2">
						<AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
						<span className="text-sm font-semibold text-destructive">
							Resuelve lo siguiente antes de iniciar la importación:
						</span>
					</div>
					<ul className="list-inside list-disc space-y-1">
						{displayErrors.map((err) => (
							<li key={err} className="text-sm text-destructive">
								{err}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* File preview */}
			<section className="mb-6">
				<h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Vista previa del archivo
				</h2>
				<div className="overflow-x-auto rounded border border-border">
					<table className="w-full text-xs">
						<thead>
							<tr className="border-b border-border bg-muted">
								{headers.map((h) => (
									<th
										key={h}
										className="whitespace-nowrap px-3 py-2 text-left font-semibold text-foreground"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{sampleRows.slice(0, 5).map((row, ri) => (
								<tr
									key={ri}
									className={cn(
										"border-b border-border last:border-0",
										ri % 2 === 0 ? "bg-card" : "bg-background",
									)}
								>
									{headers.map((h) => (
										<td
											key={h}
											className="whitespace-nowrap px-3 py-2 text-muted-foreground"
										>
											{row[h] ?? ""}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<p className="mt-1.5 text-xs text-muted-foreground">
					Se muestran las primeras {sampleRows.length} filas de tu archivo como
					referencia.
				</p>
			</section>

			{/* Column mapping */}
			<section>
				<h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Mapeo de columnas
				</h2>
				<div className="overflow-hidden rounded border border-border">
					<div className="grid grid-cols-[1fr_1fr_2fr] gap-4 border-b border-border bg-muted px-4 py-2">
						<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Columna CSV
						</span>
						<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Valores de ejemplo
						</span>
						<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Mapea a
						</span>
					</div>
					{headers.map((header, idx) => {
						const sampleVals = sampleRows
							.map((r) => r[header])
							.filter(Boolean)
							.slice(0, 2);
						const currentVal = mapping[header] ?? "";
						const availableOptions = getAvailableOptions(header);

						return (
							<div
								key={header}
								className={cn(
									"grid grid-cols-[1fr_1fr_2fr] items-center gap-4 border-b border-border px-4 py-3 last:border-0",
									idx % 2 === 0 ? "bg-card" : "bg-background",
								)}
							>
								<div className="flex items-center gap-2">
									<code className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
										{header}
									</code>
								</div>
								<div className="flex flex-col gap-0.5">
									{sampleVals.map((v, i) => (
										<span
											key={i}
											className="max-w-[140px] truncate text-xs text-muted-foreground"
										>
											{v}
										</span>
									))}
								</div>
								<div className="relative">
									<select
										aria-label={`Mapear "${header}" a campo`}
										value={currentVal}
										onChange={(e) =>
											setMapping((prev) => ({
												...prev,
												[header]: e.target.value,
											}))
										}
										className={cn(
											"w-full appearance-none rounded border border-input bg-card px-3 py-2 pr-8 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
											currentVal ? "text-foreground" : "text-muted-foreground",
										)}
									>
										<option value="">No mapear</option>
										{availableOptions.map((f) => (
											<option key={f.value} value={f.value}>
												{f.label}
												{f.required ? " *" : ""}
											</option>
										))}
									</select>
									<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
									{currentVal &&
										requiredFields.some((f) => f.value === currentVal) && (
											<span className="absolute -right-2 -top-2 rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold leading-tight text-primary-foreground">
												req
											</span>
										)}
								</div>
							</div>
						);
					})}
				</div>
				<div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
					<Info className="h-3.5 w-3.5" />
					<span>
						Los campos marcados con <strong>*</strong> son obligatorios.
						&quot;No mapear&quot; omite la columna en la importación.
					</span>
				</div>
			</section>

			{/* Submit */}
			<div className="mt-8 flex items-center gap-4">
				<button
					type="button"
					disabled={submitting}
					onClick={handleSubmit}
					className="inline-flex items-center gap-2 rounded bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
				>
					{submitting ? (
						<>
							<span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
							Iniciando importación…
						</>
					) : (
						"Guardar mapeo e iniciar importación"
					)}
				</button>
				<p className="text-xs text-muted-foreground">
					Se validarán y procesarán todas las filas del archivo.
				</p>
			</div>
		</div>
	);
}

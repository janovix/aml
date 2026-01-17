"use client";

import { useState } from "react";
import { AlertOctagon, RotateCcw, ArrowLeft, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CatastrophicError as CatastrophicErrorType } from "@/types/import";

interface CatastrophicErrorProps {
	error: CatastrophicErrorType;
	onRetry?: () => void;
	onReset: () => void;
}

export function CatastrophicError({
	error,
	onRetry,
	onReset,
}: CatastrophicErrorProps) {
	const [copied, setCopied] = useState(false);

	const handleCopyError = () => {
		const errorText = `
Error Type: ${error.type}
Message: ${error.message}
${error.details ? `Details: ${error.details}` : ""}
Timestamp: ${error.timestamp}
    `.trim();

		navigator.clipboard.writeText(errorText);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="max-w-2xl mx-auto">
			<Card className="bg-card border-2 border-destructive/50 overflow-hidden">
				<div className="h-1 bg-destructive animate-pulse" />
				<CardHeader className="pb-4">
					<div className="flex items-start gap-4">
						<div className="p-3 rounded-xl bg-destructive/10 shrink-0">
							<AlertOctagon className="h-8 w-8 text-destructive" />
						</div>
						<div className="space-y-1">
							<h2 className="text-xl font-semibold text-foreground">
								Importación Fallida
							</h2>
							<p className="text-sm text-muted-foreground">
								Ocurrió un error crítico que impidió completar la importación
							</p>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-4">
						<div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
							<div className="flex items-center justify-between mb-3">
								<span className="text-xs font-medium text-destructive uppercase tracking-wider">
									{error.type.replace(/_/g, " ")}
								</span>
							</div>
							<p className="text-foreground font-medium mb-2">
								{error.message}
							</p>
							{error.details && (
								<p className="text-sm text-muted-foreground">{error.details}</p>
							)}
						</div>

						<div className="p-4 rounded-lg bg-secondary/50 border border-border">
							<div className="flex items-center justify-between mb-3">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Detalles Técnicos
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleCopyError}
									className="h-7 text-xs gap-1.5"
								>
									{copied ? (
										<>
											<Check className="h-3 w-3" />
											Copiado
										</>
									) : (
										<>
											<Copy className="h-3 w-3" />
											Copiar
										</>
									)}
								</Button>
							</div>
							<div className="font-mono text-xs text-muted-foreground space-y-1">
								<p>
									<span className="text-foreground">timestamp:</span>{" "}
									{new Date(error.timestamp).toLocaleString()}
								</p>
								<p>
									<span className="text-foreground">error_type:</span>{" "}
									{error.type}
								</p>
							</div>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-3">
						{onRetry && (
							<Button
								onClick={onRetry}
								className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
							>
								<RotateCcw className="h-4 w-4" />
								Reintentar Importación
							</Button>
						)}
						<Button
							variant="outline"
							onClick={onReset}
							className="flex-1 gap-2 bg-transparent"
						>
							<ArrowLeft className="h-4 w-4" />
							Comenzar de Nuevo
						</Button>
					</div>

					<div className="pt-4 border-t border-border">
						<p className="text-xs text-muted-foreground text-center">
							Si este error persiste, por favor contacta a soporte con los
							detalles del error
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

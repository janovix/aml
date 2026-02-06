"use client";

import { useState, useEffect } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useJwt } from "@/hooks/useJwt";
import { useOrgSettings } from "@/hooks/useOrgSettings";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Receipt,
	ArrowRight,
	AlertTriangle,
	CheckCircle2,
	FileText,
	Info,
	Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/mutations";
import { showFetchError } from "@/lib/toast-utils";
import { getInvoiceById } from "@/lib/api/invoices";
import type { InvoiceEntity, PldHintFromCfdi } from "@/types/invoice";
import { PageHero } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";

const VOUCHER_TYPE_LABELS: Record<string, string> = {
	I: "Ingreso",
	E: "Egreso",
	T: "Traslado",
	N: "Nómina",
	P: "Pago",
};

interface CfdiReviewViewProps {
	invoiceId: string;
}

type WizardStep = 1 | 2 | 3;

/**
 * Skeleton for CfdiReviewView loading state
 */
function CfdiReviewSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<PageHeroSkeleton
				showStats={false}
				showBackButton={true}
				actionCount={1}
			/>
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
				</CardHeader>
				<CardContent className="space-y-4">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-5 w-64" />
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

export function CfdiReviewView({
	invoiceId,
}: CfdiReviewViewProps): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { activityCode: orgActivityCode, isLoading: isSettingsLoading } =
		useOrgSettings();

	const [invoice, setInvoice] = useState<InvoiceEntity | null>(null);
	const [pldHints, setPldHints] = useState<PldHintFromCfdi | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [currentStep, setCurrentStep] = useState<WizardStep>(1);

	// Fetch invoice data
	useEffect(() => {
		if (isJwtLoading || !jwt) return;

		const fetchInvoice = async () => {
			try {
				setIsLoading(true);
				const data = await getInvoiceById({ id: invoiceId, jwt });
				setInvoice(data);

				// Try to extract PLD hints from sessionStorage (set during XML parse)
				try {
					const storedHints = sessionStorage.getItem(
						`cfdi_pld_hints_${invoiceId}`,
					);
					if (storedHints) {
						setPldHints(JSON.parse(storedHints) as PldHintFromCfdi);
					}
				} catch {
					// Ignore sessionStorage errors
				}
			} catch (error) {
				console.error("Error fetching invoice:", error);
				showFetchError("cfdi-review", error);
				navigateTo("/invoices");
			} finally {
				setIsLoading(false);
			}
		};
		fetchInvoice();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [invoiceId, jwt, isJwtLoading]);

	const handleProceedToOperation = (): void => {
		if (!invoice) return;

		// Store pre-fill data in sessionStorage for OperationCreateView
		const preFillData = {
			invoiceId: invoice.id,
			dataSource: "CFDI",
			amount: invoice.total,
			currencyCode: invoice.currencyCode,
			exchangeRate: invoice.exchangeRate ?? "",
			operationDate: invoice.issueDate
				? invoice.issueDate.slice(0, 10)
				: new Date().toISOString().slice(0, 10),
			notes: `Operación creada desde factura CFDI ${invoice.uuid ?? invoice.id}`,
			payments: [
				{
					paymentDate: invoice.issueDate
						? invoice.issueDate.slice(0, 10)
						: new Date().toISOString().slice(0, 10),
					paymentFormCode:
						pldHints?.paymentFormCode ?? invoice.paymentFormCode ?? "",
					monetaryInstrumentCode: pldHints?.monetaryInstrumentCode ?? null,
					currencyCode: invoice.currencyCode || "MXN",
					amount: invoice.total,
					bankName: null,
					accountNumberMasked: null,
					checkNumber: null,
					reference: null,
				},
			],
		};

		try {
			sessionStorage.setItem(
				"aml_form_draft_operation_create",
				JSON.stringify(preFillData),
			);
		} catch {
			// Ignore sessionStorage errors
		}

		// Navigate to operation creation with query params
		navigateTo(`/operations/new?invoiceId=${invoice.id}&dataSource=CFDI`);
	};

	if (isLoading || isJwtLoading || isSettingsLoading) {
		return <CfdiReviewSkeleton />;
	}

	if (!invoice) {
		return (
			<div className="space-y-6">
				<PageHero
					title="Factura no encontrada"
					subtitle={`La factura ${invoiceId} no existe`}
					icon={Receipt}
					backButton={{
						label: "Volver a Facturas",
						onClick: () => navigateTo("/invoices"),
					}}
				/>
			</div>
		);
	}

	const totalNum = parseFloat(invoice.total) || 0;
	const hasMismatch =
		pldHints?.suggestedActivityCode &&
		orgActivityCode &&
		pldHints.suggestedActivityCode !== orgActivityCode;

	const steps = [
		{ number: 1 as const, label: "Resumen de factura" },
		{ number: 2 as const, label: "Datos PLD sugeridos" },
		{ number: 3 as const, label: "Crear operación" },
	];

	return (
		<div className="space-y-6">
			<PageHero
				title="Crear Operación desde Factura"
				subtitle="Revisa los datos del CFDI antes de crear la operación"
				icon={Receipt}
				backButton={{
					label: "Volver a Factura",
					onClick: () => navigateTo(`/invoices/${invoice.id}`),
				}}
			/>

			{/* Step indicator */}
			<div className="flex items-center gap-2">
				{steps.map((step, index) => (
					<div key={step.number} className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setCurrentStep(step.number)}
							className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
								currentStep === step.number
									? "bg-primary text-primary-foreground"
									: currentStep > step.number
										? "bg-primary/20 text-primary"
										: "bg-muted text-muted-foreground"
							}`}
						>
							<span className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold">
								{currentStep > step.number ? (
									<CheckCircle2 className="h-4 w-4" />
								) : (
									step.number
								)}
							</span>
							<span className="hidden @md/main:inline">{step.label}</span>
						</button>
						{index < steps.length - 1 && (
							<ArrowRight className="h-4 w-4 text-muted-foreground" />
						)}
					</div>
				))}
			</div>

			{/* Step 1: Invoice Summary */}
			{currentStep === 1 && (
				<div className="space-y-6">
					{/* Activity mismatch warning */}
					{hasMismatch && (
						<div className="flex items-center gap-3 rounded-lg border p-3 bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800">
							<AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
							<div>
								<p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
									Actividad sugerida no coincide
								</p>
								<p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
									La actividad sugerida por el CFDI (
									{pldHints?.suggestedActivityCode}) no coincide con la
									actividad de tu organización ({orgActivityCode}
									). Se usará la actividad de la organización.
								</p>
							</div>
						</div>
					)}

					<div className="grid gap-6 @md/main:grid-cols-2">
						{/* CFDI core data */}
						<Card>
							<CardHeader>
								<CardTitle>Datos del CFDI</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-2">
									<Badge variant="outline">CFDI {invoice.version}</Badge>
									<Badge variant="default">
										{VOUCHER_TYPE_LABELS[invoice.voucherTypeCode] ??
											invoice.voucherTypeCode}
									</Badge>
								</div>
								{invoice.uuid && (
									<div>
										<p className="text-xs font-medium text-muted-foreground">
											UUID
										</p>
										<p className="text-sm font-mono mt-0.5">{invoice.uuid}</p>
									</div>
								)}
								<div>
									<p className="text-xs font-medium text-muted-foreground">
										Fecha de emisión
									</p>
									<p className="text-sm mt-0.5">
										{new Date(invoice.issueDate).toLocaleDateString("es-MX", {
											day: "2-digit",
											month: "long",
											year: "numeric",
										})}
									</p>
								</div>
							</CardContent>
						</Card>

						{/* Financial summary */}
						<Card>
							<CardHeader>
								<CardTitle>Resumen financiero</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div>
									<p className="text-xs font-medium text-muted-foreground">
										Total
									</p>
									<p className="text-2xl font-bold mt-0.5">
										{new Intl.NumberFormat("es-MX", {
											style: "currency",
											currency: invoice.currencyCode || "MXN",
										}).format(totalNum)}
									</p>
									<p className="text-xs text-muted-foreground">
										{invoice.currencyCatalog?.name ?? invoice.currencyCode}
									</p>
								</div>
								<Separator />
								<div className="grid grid-cols-2 gap-3">
									<div>
										<p className="text-xs font-medium text-muted-foreground">
											Emisor
										</p>
										<p className="text-sm font-medium mt-0.5">
											{invoice.issuerName}
										</p>
										<p className="text-xs text-muted-foreground font-mono">
											{invoice.issuerRfc}
										</p>
									</div>
									<div>
										<p className="text-xs font-medium text-muted-foreground">
											Receptor
										</p>
										<p className="text-sm font-medium mt-0.5">
											{invoice.receiverName}
										</p>
										<p className="text-xs text-muted-foreground font-mono">
											{invoice.receiverRfc}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Items preview */}
					{invoice.items && invoice.items.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Conceptos ({invoice.items.length})</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Clave</TableHead>
												<TableHead>Descripción</TableHead>
												<TableHead className="text-right">Cantidad</TableHead>
												<TableHead className="text-right">Importe</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{invoice.items.map((item) => (
												<TableRow key={item.id}>
													<TableCell className="font-mono text-xs">
														{item.productServiceCode}
													</TableCell>
													<TableCell className="max-w-[200px] truncate">
														{item.description}
													</TableCell>
													<TableCell className="text-right tabular-nums">
														{item.quantity}
													</TableCell>
													<TableCell className="text-right tabular-nums font-medium">
														{new Intl.NumberFormat("es-MX", {
															style: "currency",
															currency: invoice.currencyCode || "MXN",
														}).format(parseFloat(item.amount))}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Navigation */}
					<div className="flex justify-end gap-3">
						<Button
							variant="outline"
							onClick={() => navigateTo(`/invoices/${invoice.id}`)}
						>
							Cancelar
						</Button>
						<Button onClick={() => setCurrentStep(2)}>
							Continuar
							<ArrowRight className="h-4 w-4 ml-2" />
						</Button>
					</div>
				</div>
			)}

			{/* Step 2: PLD Hints */}
			{currentStep === 2 && (
				<div className="space-y-6">
					{pldHints ? (
						<>
							{/* Suggested activity */}
							{pldHints.suggestedActivityCode && (
								<Card>
									<CardHeader>
										<CardTitle>Actividad sugerida</CardTitle>
										<CardDescription>
											Actividad PLD sugerida en base al análisis del CFDI
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex items-center gap-3">
											<Badge
												variant={hasMismatch ? "destructive" : "default"}
												className="text-sm"
											>
												{pldHints.suggestedActivityCode}
											</Badge>
											{hasMismatch && (
												<div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
													<AlertTriangle className="h-4 w-4" />
													<span className="text-xs">
														Difiere de la actividad de la organización (
														{orgActivityCode})
													</span>
												</div>
											)}
											{!hasMismatch && pldHints.suggestedActivityCode && (
												<div className="flex items-center gap-1 text-green-600 dark:text-green-400">
													<CheckCircle2 className="h-4 w-4" />
													<span className="text-xs">
														Coincide con la actividad de la organización
													</span>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							)}

							{/* Payment form hint */}
							{pldHints.paymentFormCode && (
								<Card>
									<CardHeader>
										<CardTitle>Forma de pago sugerida</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex items-center gap-2">
											<Badge variant="outline">
												{pldHints.paymentFormCode}
											</Badge>
											{pldHints.monetaryInstrumentCode && (
												<Badge variant="secondary">
													Instrumento: {pldHints.monetaryInstrumentCode}
												</Badge>
											)}
										</div>
									</CardContent>
								</Card>
							)}

							{/* Item metadata hints */}
							{pldHints.itemHints && pldHints.itemHints.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle>Datos de conceptos para PLD</CardTitle>
										<CardDescription>
											Metadatos relevantes extraídos de los conceptos del CFDI
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="overflow-x-auto">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Clave</TableHead>
														<TableHead>Descripción</TableHead>
														<TableHead className="text-right">
															Importe
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{pldHints.itemHints.map((hint, index) => (
														<TableRow key={index}>
															<TableCell className="font-mono text-xs">
																{hint.productServiceCode}
															</TableCell>
															<TableCell className="max-w-[200px] truncate">
																{hint.description}
															</TableCell>
															<TableCell className="text-right tabular-nums font-medium">
																{new Intl.NumberFormat("es-MX", {
																	style: "currency",
																	currency: invoice.currencyCode || "MXN",
																}).format(parseFloat(hint.amount))}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									</CardContent>
								</Card>
							)}
						</>
					) : (
						<Card>
							<CardContent className="py-12">
								<div className="flex flex-col items-center gap-3 text-center">
									<Info className="h-10 w-10 text-muted-foreground" />
									<p className="text-lg font-medium">Sin sugerencias PLD</p>
									<p className="text-sm text-muted-foreground max-w-md">
										No se encontraron datos PLD sugeridos para esta factura.
										Podrás completar los campos manualmente al crear la
										operación.
									</p>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Navigation */}
					<div className="flex justify-between gap-3">
						<Button variant="outline" onClick={() => setCurrentStep(1)}>
							Anterior
						</Button>
						<Button onClick={() => setCurrentStep(3)}>
							Continuar
							<ArrowRight className="h-4 w-4 ml-2" />
						</Button>
					</div>
				</div>
			)}

			{/* Step 3: Confirm and redirect */}
			{currentStep === 3 && (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Confirmar creación de operación</CardTitle>
							<CardDescription>
								Se pre-llenarán los datos de la operación con la información de
								la factura
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="rounded-lg border p-4 bg-muted/30 space-y-3">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-xs font-medium text-muted-foreground">
											Monto
										</p>
										<p className="text-lg font-bold mt-0.5">
											{new Intl.NumberFormat("es-MX", {
												style: "currency",
												currency: invoice.currencyCode || "MXN",
											}).format(totalNum)}
										</p>
									</div>
									<div>
										<p className="text-xs font-medium text-muted-foreground">
											Moneda
										</p>
										<p className="text-lg font-medium mt-0.5">
											{invoice.currencyCode}
										</p>
									</div>
								</div>
								<Separator />
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-xs font-medium text-muted-foreground">
											Fecha de operación
										</p>
										<p className="text-sm mt-0.5">
											{new Date(invoice.issueDate).toLocaleDateString("es-MX", {
												day: "2-digit",
												month: "long",
												year: "numeric",
											})}
										</p>
									</div>
									<div>
										<p className="text-xs font-medium text-muted-foreground">
											Origen
										</p>
										<Badge variant="default">CFDI</Badge>
									</div>
								</div>
								<Separator />
								<div>
									<p className="text-xs font-medium text-muted-foreground">
										Factura vinculada
									</p>
									<p className="text-sm font-mono mt-0.5">
										{invoice.uuid ?? invoice.id}
									</p>
								</div>
								{pldHints?.paymentFormCode && (
									<>
										<Separator />
										<div>
											<p className="text-xs font-medium text-muted-foreground">
												Forma de pago (pre-llenada)
											</p>
											<p className="text-sm mt-0.5">
												{pldHints.paymentFormCode}
											</p>
										</div>
									</>
								)}
							</div>

							<div className="flex items-center gap-3 rounded-lg border p-3 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
								<Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
								<p className="text-sm text-blue-800 dark:text-blue-300">
									Serás redirigido al formulario de creación de operación con
									los datos pre-llenados. Podrás ajustarlos antes de guardar.
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Navigation */}
					<div className="flex justify-between gap-3">
						<Button variant="outline" onClick={() => setCurrentStep(2)}>
							Anterior
						</Button>
						<Button onClick={handleProceedToOperation}>
							<FileText className="h-4 w-4 mr-2" />
							Crear operación
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

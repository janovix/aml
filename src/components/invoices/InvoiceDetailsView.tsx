"use client";

import { useState, useEffect } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useJwt } from "@/hooks/useJwt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Receipt, ExternalLink, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/mutations";
import { showFetchError } from "@/lib/toast-utils";
import { getInvoiceById } from "@/lib/api/invoices";
import type { InvoiceEntity } from "@/types/invoice";
import { PageHero } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";
import { useLanguage } from "@/components/LanguageProvider";

const VOUCHER_TYPE_LABELS: Record<string, string> = {
	I: "Ingreso",
	E: "Egreso",
	T: "Traslado",
	N: "Nómina",
	P: "Pago",
};

interface InvoiceDetailsViewProps {
	invoiceId: string;
}

/**
 * Skeleton component for InvoiceDetailsView
 */
function InvoiceDetailsSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<PageHeroSkeleton
				showStats={false}
				showBackButton={true}
				actionCount={1}
			/>
			<div className="grid gap-6 @md/main:grid-cols-2">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
						</CardHeader>
						<CardContent className="space-y-4">
							{[1, 2, 3].map((j) => (
								<div key={j} className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-5 w-40" />
								</div>
							))}
						</CardContent>
					</Card>
				))}
			</div>
			{/* Items table skeleton */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-10 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export function InvoiceDetailsView({
	invoiceId,
}: InvoiceDetailsViewProps): React.ReactElement {
	const { navigateTo } = useOrgNavigation();
	const { jwt, isLoading: isJwtLoading } = useJwt();
	const { t } = useLanguage();
	const [invoice, setInvoice] = useState<InvoiceEntity | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (isJwtLoading || !jwt) return;

		const fetchInvoice = async () => {
			try {
				setIsLoading(true);
				const data = await getInvoiceById({ id: invoiceId, jwt });
				setInvoice(data);
			} catch (error) {
				console.error("Error fetching invoice:", error);
				showFetchError("invoice-details", error);
				navigateTo("/invoices");
			} finally {
				setIsLoading(false);
			}
		};
		fetchInvoice();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [invoiceId, jwt, isJwtLoading]);

	if (isLoading || isJwtLoading) {
		return <InvoiceDetailsSkeleton />;
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
	const subtotalNum = parseFloat(invoice.subtotal) || 0;
	const discountNum = invoice.discount ? parseFloat(invoice.discount) : 0;

	const formatDateTime = (dateString: string | null | undefined): string => {
		if (!dateString) return t("invDateNotAvailable");
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return t("invDateInvalid");
		return date.toLocaleString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatDate = (dateString: string | null | undefined): string => {
		if (!dateString) return t("invDateNotAvailable");
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return t("invDateInvalid");
		return date.toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	return (
		<div className="space-y-6">
			<PageHero
				title={invoice.uuid ?? invoiceId}
				subtitle="Detalle de factura CFDI"
				icon={Receipt}
				backButton={{
					label: "Volver a Facturas",
					onClick: () => navigateTo("/invoices"),
				}}
				actions={[
					{
						label: "Crear Operación desde Factura",
						icon: Plus,
						onClick: () =>
							navigateTo(`/invoices/${invoice.id}/create-operation`),
					},
				]}
			/>

			{/* CFDI Type badge */}
			<div className="flex items-center gap-3 flex-wrap">
				<Badge variant="outline">CFDI {invoice.version}</Badge>
				<Badge variant="default">
					{VOUCHER_TYPE_LABELS[invoice.voucherTypeCode] ??
						invoice.voucherTypeCode}
				</Badge>
				{invoice.series && (
					<Badge variant="secondary">Serie: {invoice.series}</Badge>
				)}
				{invoice.folio && (
					<Badge variant="secondary">Folio: {invoice.folio}</Badge>
				)}
			</div>

			<div className="grid gap-6 @md/main:grid-cols-2">
				{/* Issuer information */}
				<Card>
					<CardHeader>
						<CardTitle>Emisor</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Nombre / Razón social
							</p>
							<p className="text-base font-medium mt-1">{invoice.issuerName}</p>
						</div>
						<Separator />
						<div>
							<p className="text-sm font-medium text-muted-foreground">RFC</p>
							<p className="text-base font-mono mt-1">{invoice.issuerRfc}</p>
						</div>
						<Separator />
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Régimen fiscal
							</p>
							<p className="text-base font-medium mt-1">
								{invoice.taxRegimeCatalog?.name ?? invoice.issuerTaxRegimeCode}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Receiver information */}
				<Card>
					<CardHeader>
						<CardTitle>Receptor</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Nombre / Razón social
							</p>
							<p className="text-base font-medium mt-1">
								{invoice.receiverName}
							</p>
						</div>
						<Separator />
						<div>
							<p className="text-sm font-medium text-muted-foreground">RFC</p>
							<p className="text-base font-mono mt-1">{invoice.receiverRfc}</p>
						</div>
						{invoice.receiverTaxRegimeCode && (
							<>
								<Separator />
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Régimen fiscal
									</p>
									<p className="text-base font-medium mt-1">
										{invoice.receiverTaxRegimeCode}
									</p>
								</div>
							</>
						)}
						{invoice.receiverUsageCode && (
							<>
								<Separator />
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Uso CFDI
									</p>
									<p className="text-base font-medium mt-1">
										{invoice.usageCatalog?.name ?? invoice.receiverUsageCode}
									</p>
								</div>
							</>
						)}
						{invoice.receiverPostalCode && (
							<>
								<Separator />
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Código postal
									</p>
									<p className="text-base font-mono mt-1">
										{invoice.receiverPostalCode}
									</p>
								</div>
							</>
						)}
					</CardContent>
				</Card>

				{/* Financial information */}
				<Card>
					<CardHeader>
						<CardTitle>Información financiera</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-sm font-medium text-muted-foreground">Total</p>
							<p className="text-3xl font-bold mt-1">
								{new Intl.NumberFormat("es-MX", {
									style: "currency",
									currency: invoice.currencyCode || "MXN",
								}).format(totalNum)}
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								{invoice.currencyCatalog?.name ?? invoice.currencyCode}
							</p>
						</div>
						<Separator />
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Subtotal
								</p>
								<p className="text-base font-medium mt-1 tabular-nums">
									{new Intl.NumberFormat("es-MX", {
										style: "currency",
										currency: invoice.currencyCode || "MXN",
									}).format(subtotalNum)}
								</p>
							</div>
							{discountNum > 0 && (
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Descuento
									</p>
									<p className="text-base font-medium mt-1 tabular-nums text-red-600">
										-
										{new Intl.NumberFormat("es-MX", {
											style: "currency",
											currency: invoice.currencyCode || "MXN",
										}).format(discountNum)}
									</p>
								</div>
							)}
						</div>
						{invoice.exchangeRate && (
							<>
								<Separator />
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Tipo de cambio
									</p>
									<p className="text-base font-medium mt-1">
										{invoice.exchangeRate}
									</p>
								</div>
							</>
						)}
					</CardContent>
				</Card>

				{/* Payment information */}
				<Card>
					<CardHeader>
						<CardTitle>Información de pago</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Forma de pago
							</p>
							<p className="text-base font-medium mt-1">
								{invoice.paymentFormCatalog?.name ??
									invoice.paymentFormCode ??
									t("invPaymentMethodNotSpecified")}
							</p>
						</div>
						<Separator />
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Método de pago
							</p>
							<p className="text-base font-medium mt-1">
								{invoice.paymentMethodCatalog?.name ??
									invoice.paymentMethodCode ??
									t("invIssuerNotSpecified")}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Dates and metadata */}
				<Card>
					<CardHeader>
						<CardTitle>Fechas y metadatos</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Fecha de emisión
							</p>
							<p className="text-base font-medium mt-1">
								{formatDate(invoice.issueDate)}
							</p>
						</div>
						{invoice.certificationDate && (
							<>
								<Separator />
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Fecha de certificación
									</p>
									<p className="text-base font-medium mt-1">
										{formatDateTime(invoice.certificationDate)}
									</p>
								</div>
							</>
						)}
						{invoice.exportCode && (
							<>
								<Separator />
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Código de exportación
									</p>
									<p className="text-base font-mono mt-1">
										{invoice.exportCode}
									</p>
								</div>
							</>
						)}
						<Separator />
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Registrada en plataforma
							</p>
							<p className="text-base font-medium mt-1">
								{formatDateTime(invoice.createdAt)}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* TFD Stamp data */}
				{invoice.tfdUuid && (
					<Card>
						<CardHeader>
							<CardTitle>Timbre Fiscal Digital (TFD)</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									UUID TFD
								</p>
								<p className="text-sm font-mono mt-1 break-all">
									{invoice.tfdUuid}
								</p>
							</div>
							{invoice.tfdStampDate && (
								<>
									<Separator />
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Fecha de timbrado
										</p>
										<p className="text-base font-medium mt-1">
											{formatDateTime(invoice.tfdStampDate)}
										</p>
									</div>
								</>
							)}
							{invoice.tfdSatCertificate && (
								<>
									<Separator />
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Certificado SAT
										</p>
										<p className="text-xs font-mono mt-1 break-all text-muted-foreground">
											{invoice.tfdSatCertificate}
										</p>
									</div>
								</>
							)}
							{invoice.tfdSignature && (
								<>
									<Separator />
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Sello digital
										</p>
										<p className="text-xs font-mono mt-1 break-all text-muted-foreground max-h-20 overflow-y-auto">
											{invoice.tfdSignature}
										</p>
									</div>
								</>
							)}
						</CardContent>
					</Card>
				)}
			</div>

			{/* Items table */}
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
										<TableHead>Unidad</TableHead>
										<TableHead className="text-right">P. Unitario</TableHead>
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
											<TableCell className="text-xs">
												{item.unitName ?? item.unitCode}
											</TableCell>
											<TableCell className="text-right tabular-nums">
												{new Intl.NumberFormat("es-MX", {
													style: "currency",
													currency: invoice.currencyCode || "MXN",
												}).format(parseFloat(item.unitPrice))}
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

			{/* Notes */}
			{invoice.notes && (
				<Card>
					<CardHeader>
						<CardTitle>Notas</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
					</CardContent>
				</Card>
			)}

			{/* Operation link CTA */}
			<Card>
				<CardContent className="py-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<FileText className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="text-sm font-medium">Operación vinculada</p>
								<p className="text-xs text-muted-foreground">
									Crear o ver la operación PLD asociada a esta factura
								</p>
							</div>
						</div>
						<Button
							onClick={() =>
								navigateTo(`/invoices/${invoice.id}/create-operation`)
							}
						>
							<Plus className="h-4 w-4 mr-1.5" />
							Crear Operación desde Factura
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

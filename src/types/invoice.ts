import type { EnrichedCatalogItem } from "./catalog";

// --- Invoice Item ---

export interface InvoiceItemEntity {
	id: string;
	invoiceId: string;
	productServiceCode: string;
	productServiceId: string | null;
	quantity: string;
	unitCode: string;
	unitName: string | null;
	description: string;
	unitPrice: string;
	amount: string;
	discount: string | null;
	taxObjectCode: string;
	transferredTaxAmount: string | null;
	withheldTaxAmount: string | null;
	metadata: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
}

// --- Invoice Entity ---

export interface InvoiceEntity {
	id: string;
	organizationId: string;
	// CFDI Core
	uuid: string | null;
	version: string;
	series: string | null;
	folio: string | null;
	// Issuer
	issuerRfc: string;
	issuerName: string;
	issuerTaxRegimeCode: string;
	// Receiver
	receiverRfc: string;
	receiverName: string;
	receiverUsageCode: string | null;
	receiverTaxRegimeCode: string | null;
	receiverPostalCode: string | null;
	// Financial
	subtotal: string;
	discount: string | null;
	total: string;
	currencyCode: string;
	exchangeRate: string | null;
	// Payment
	paymentFormCode: string | null;
	paymentMethodCode: string | null;
	// Type and dates
	voucherTypeCode: string;
	issueDate: string;
	certificationDate: string | null;
	// Export
	exportCode: string | null;
	// TFD
	tfdUuid: string | null;
	tfdSatCertificate: string | null;
	tfdSignature: string | null;
	tfdStampDate: string | null;
	// XML
	xmlContent: string | null;
	// Metadata
	notes: string | null;
	// Timestamps
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	// Relations
	items: InvoiceItemEntity[];
	// Enriched catalog items
	paymentFormCatalog?: EnrichedCatalogItem | null;
	paymentMethodCatalog?: EnrichedCatalogItem | null;
	currencyCatalog?: EnrichedCatalogItem | null;
	taxRegimeCatalog?: EnrichedCatalogItem | null;
	usageCatalog?: EnrichedCatalogItem | null;
}

// --- Request Types ---

export interface InvoiceItemCreateInput {
	productServiceCode: string;
	productServiceId?: string | null;
	quantity: string;
	unitCode: string;
	unitName?: string | null;
	description: string;
	unitPrice: string;
	amount: string;
	discount?: string | null;
	taxObjectCode?: string;
	transferredTaxAmount?: string | null;
	withheldTaxAmount?: string | null;
	metadata?: Record<string, unknown> | null;
}

export interface InvoiceCreateRequest {
	uuid?: string | null;
	version?: string;
	series?: string | null;
	folio?: string | null;
	issuerRfc: string;
	issuerName: string;
	issuerTaxRegimeCode: string;
	receiverRfc: string;
	receiverName: string;
	receiverUsageCode?: string | null;
	receiverTaxRegimeCode?: string | null;
	receiverPostalCode?: string | null;
	subtotal: string;
	discount?: string | null;
	total: string;
	currencyCode?: string;
	exchangeRate?: string | null;
	paymentFormCode?: string | null;
	paymentMethodCode?: string | null;
	voucherTypeCode?: string;
	issueDate: string;
	certificationDate?: string | null;
	exportCode?: string | null;
	notes?: string | null;
	items: InvoiceItemCreateInput[];
}

export interface InvoiceParseXmlRequest {
	xmlContent: string;
	notes?: string | null;
}

// --- PLD Hints from CFDI ---

export interface PldHintItemMetadata {
	productServiceCode: string;
	description: string;
	amount: string;
	metadata?: Record<string, unknown>;
}

export interface PldHintFromCfdi {
	suggestedActivityCode?: string;
	paymentFormCode?: string;
	monetaryInstrumentCode?: string;
	itemHints: PldHintItemMetadata[];
}

export interface ParseXmlResponse {
	invoice: InvoiceEntity;
	pldHints: PldHintFromCfdi;
}

// --- Pagination & List ---

export interface InvoiceListResponse {
	data: InvoiceEntity[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

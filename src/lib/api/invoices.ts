import { getAmlCoreBaseUrl } from "./config";
import { fetchJson } from "./http";
import type {
	InvoiceEntity,
	InvoiceCreateRequest,
	InvoiceParseXmlRequest,
	InvoiceListResponse,
	ParseXmlResponse,
} from "@/types/invoice";

export interface ListInvoicesOptions {
	page?: number;
	limit?: number;
	issuerRfc?: string;
	receiverRfc?: string;
	uuid?: string;
	voucherTypeCode?: string;
	currencyCode?: string;
	startDate?: string;
	endDate?: string;
	minAmount?: string;
	maxAmount?: string;
	baseUrl?: string;
	signal?: AbortSignal;
	/** JWT token for authentication */
	jwt?: string;
}

export async function listInvoices(
	opts?: ListInvoicesOptions,
): Promise<InvoiceListResponse> {
	const baseUrl = opts?.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/invoices", baseUrl);

	if (opts?.page) url.searchParams.set("page", String(opts.page));
	if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
	if (opts?.issuerRfc) url.searchParams.set("issuerRfc", opts.issuerRfc);
	if (opts?.receiverRfc) url.searchParams.set("receiverRfc", opts.receiverRfc);
	if (opts?.uuid) url.searchParams.set("uuid", opts.uuid);
	if (opts?.voucherTypeCode)
		url.searchParams.set("voucherTypeCode", opts.voucherTypeCode);
	if (opts?.currencyCode)
		url.searchParams.set("currencyCode", opts.currencyCode);
	if (opts?.startDate) url.searchParams.set("startDate", opts.startDate);
	if (opts?.endDate) url.searchParams.set("endDate", opts.endDate);
	if (opts?.minAmount) url.searchParams.set("minAmount", opts.minAmount);
	if (opts?.maxAmount) url.searchParams.set("maxAmount", opts.maxAmount);

	const { json } = await fetchJson<InvoiceListResponse>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts?.signal,
		jwt: opts?.jwt,
	});
	return json;
}

export async function getInvoiceById(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<InvoiceEntity> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/invoices/${opts.id}`, baseUrl);

	const { json } = await fetchJson<InvoiceEntity>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function getInvoiceByUuid(opts: {
	uuid: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<InvoiceEntity> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/invoices/uuid/${opts.uuid}`, baseUrl);

	const { json } = await fetchJson<InvoiceEntity>(url.toString(), {
		method: "GET",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function createInvoice(opts: {
	input: InvoiceCreateRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<InvoiceEntity> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/invoices", baseUrl);

	const { json } = await fetchJson<InvoiceEntity>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(opts.input),
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function parseInvoiceXml(opts: {
	input: InvoiceParseXmlRequest;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<ParseXmlResponse> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL("/api/v1/invoices/parse-xml", baseUrl);

	// Debug logging
	console.log("parseInvoiceXml called with:", {
		hasXmlContent: !!opts.input.xmlContent,
		xmlContentLength: opts.input.xmlContent?.length ?? 0,
		xmlContentPreview: opts.input.xmlContent?.substring(0, 100),
	});

	const requestBody = JSON.stringify(opts.input);
	console.log("Request body length:", requestBody.length);
	console.log("Request body preview:", requestBody.substring(0, 200));

	const { json } = await fetchJson<ParseXmlResponse>(url.toString(), {
		method: "POST",
		cache: "no-store",
		headers: { "content-type": "application/json" },
		body: requestBody,
		signal: opts.signal,
		jwt: opts.jwt,
	});
	return json;
}

export async function deleteInvoice(opts: {
	id: string;
	baseUrl?: string;
	signal?: AbortSignal;
	jwt?: string;
}): Promise<void> {
	const baseUrl = opts.baseUrl ?? getAmlCoreBaseUrl();
	const url = new URL(`/api/v1/invoices/${opts.id}`, baseUrl);

	await fetchJson(url.toString(), {
		method: "DELETE",
		cache: "no-store",
		signal: opts.signal,
		jwt: opts.jwt,
	});
}

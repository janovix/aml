/**
 * AI Chat Usage API Route
 *
 * Handles token usage tracking for billing purposes.
 * This is a proxy to the auth-svc which manages the actual billing.
 */

import * as Sentry from "@sentry/nextjs";
import { cookies } from "next/headers";
import { getAuthServiceUrl } from "@/lib/auth/config";

/**
 * GET /api/chat/usage
 *
 * Get current token usage for the organization
 */
export async function GET() {
	return Sentry.startSpan(
		{ op: "http.client", name: "GET /api/chat/usage" },
		async (span) => {
			try {
				const baseUrl = getAuthServiceUrl();
				const cookieStore = await cookies();

				// Forward cookies for authentication
				const cookieHeader = cookieStore
					.getAll()
					.map((c) => `${c.name}=${c.value}`)
					.join("; ");

				const response = await fetch(`${baseUrl}/api/chat/usage`, {
					method: "GET",
					headers: {
						Cookie: cookieHeader,
					},
				});

				if (!response.ok) {
					const errorBody = await response.json().catch(() => ({}));
					span.setStatus({ code: 2, message: "error" });
					return new Response(
						JSON.stringify({
							success: false,
							error:
								(errorBody as { message?: string }).message ||
								"Failed to get usage",
						}),
						{
							status: response.status,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				span.setStatus({ code: 1, message: "ok" });
				const data = await response.json();
				return new Response(JSON.stringify(data), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			} catch (error) {
				span.setStatus({ code: 2, message: "error" });
				Sentry.captureException(error);
				Sentry.logger.error(
					`Usage API GET error: ${error instanceof Error ? error.message : String(error)}`,
				);
				return new Response(
					JSON.stringify({
						success: false,
						error:
							error instanceof Error ? error.message : "Failed to get usage",
					}),
					{ status: 500, headers: { "Content-Type": "application/json" } },
				);
			}
		},
	);
}

/**
 * POST /api/chat/usage
 *
 * Report token usage for billing
 */
export async function POST(request: Request) {
	return Sentry.startSpan(
		{ op: "http.client", name: "POST /api/chat/usage" },
		async (span) => {
			try {
				const body = await request.json();
				const baseUrl = getAuthServiceUrl();
				const cookieStore = await cookies();

				// Forward cookies for authentication
				const cookieHeader = cookieStore
					.getAll()
					.map((c) => `${c.name}=${c.value}`)
					.join("; ");

				const response = await fetch(`${baseUrl}/api/chat/usage`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Cookie: cookieHeader,
					},
					body: JSON.stringify(body),
				});

				if (!response.ok) {
					const errorBody = await response.json().catch(() => ({}));
					span.setStatus({ code: 2, message: "error" });
					return new Response(
						JSON.stringify({
							success: false,
							error:
								(errorBody as { message?: string }).message ||
								"Failed to report usage",
						}),
						{
							status: response.status,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				span.setStatus({ code: 1, message: "ok" });
				const data = await response.json();
				return new Response(JSON.stringify(data), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			} catch (error) {
				span.setStatus({ code: 2, message: "error" });
				Sentry.captureException(error);
				Sentry.logger.error(
					`Usage API POST error: ${error instanceof Error ? error.message : String(error)}`,
				);
				return new Response(
					JSON.stringify({
						success: false,
						error:
							error instanceof Error ? error.message : "Failed to report usage",
					}),
					{ status: 500, headers: { "Content-Type": "application/json" } },
				);
			}
		},
	);
}

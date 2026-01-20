/**
 * AI Chat Usage API Route
 *
 * Handles token usage tracking for billing purposes.
 * This is a proxy to the auth-svc which manages the actual billing.
 */

import { cookies } from "next/headers";
import { getAuthServiceUrl } from "@/lib/auth/config";

/**
 * GET /api/chat/usage
 *
 * Get current token usage for the organization
 */
export async function GET() {
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

		const data = await response.json();
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Usage API error:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: error instanceof Error ? error.message : "Failed to get usage",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
}

/**
 * POST /api/chat/usage
 *
 * Report token usage for billing
 */
export async function POST(request: Request) {
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

		const data = await response.json();
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Usage API error:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to report usage",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
}

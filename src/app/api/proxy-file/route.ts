/**
 * File Proxy API Route
 * Proxies authenticated file requests to aml-svc
 * This allows <img> tags to display images that require authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { getAmlCoreBaseUrl } from "@/lib/api/config";
import { getJwt } from "@/lib/auth/getJwt";

export const runtime = "edge";

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}

export async function GET(request: NextRequest) {
	try {
		// Get the file URL from query parameter
		const searchParams = request.nextUrl.searchParams;
		const fileUrl = searchParams.get("url");

		if (!fileUrl) {
			return NextResponse.json(
				{ error: "Missing url parameter" },
				{ status: 400 },
			);
		}

		// Validate that the URL is from our aml-svc domain
		// Handle both http and https protocols for local development
		const amlCoreBaseUrl = getAmlCoreBaseUrl();
		const amlCoreHost = new URL(amlCoreBaseUrl).hostname;

		try {
			const fileUrlObj = new URL(fileUrl);
			if (fileUrlObj.hostname !== amlCoreHost) {
				return NextResponse.json(
					{ error: "Invalid file URL" },
					{ status: 400 },
				);
			}
		} catch {
			return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
		}

		// Get JWT from session cookies
		const jwt = await getJwt();

		if (!jwt) {
			console.error("[Proxy] No JWT token found in session");
			return NextResponse.json(
				{ error: "Unauthorized - No JWT token" },
				{ status: 401 },
			);
		}

		console.log("[Proxy] JWT token found, proxying request to:", fileUrl);

		// Fetch the file from aml-svc with authentication
		const response = await fetch(fileUrl, {
			headers: {
				Authorization: `Bearer ${jwt}`,
			},
		});

		if (!response.ok) {
			console.error(
				"[Proxy] aml-svc returned error:",
				response.status,
				response.statusText,
			);
			const errorText = await response.text();
			console.error("[Proxy] Error details:", errorText);
			return NextResponse.json(
				{
					error: `Failed to fetch file: ${response.statusText}`,
					details: errorText,
				},
				{ status: response.status },
			);
		}

		// Get the file content and headers
		const fileBuffer = await response.arrayBuffer();
		const contentType =
			response.headers.get("content-type") || "application/octet-stream";
		const contentLength = response.headers.get("content-length");
		const etag = response.headers.get("etag");

		// Return the file with appropriate headers
		const headers = new Headers({
			"Content-Type": contentType,
			"Cache-Control": "private, max-age=3600", // Cache for 1 hour
			// CORS headers to allow cross-origin image loading
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
			// Allow browser to use this as an image
			"Cross-Origin-Resource-Policy": "cross-origin",
		});

		if (contentLength) {
			headers.set("Content-Length", contentLength);
		}

		if (etag) {
			headers.set("ETag", etag);
		}

		return new NextResponse(fileBuffer, {
			status: 200,
			headers,
		});
	} catch (error) {
		console.error("Error proxying file:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

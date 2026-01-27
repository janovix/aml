/**
 * File Proxy API Route
 * Proxies authenticated file requests to aml-svc
 * This allows <img> tags to display images that require authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { getAmlCoreBaseUrl } from "@/lib/api/config";
import { getJwt } from "@/lib/auth/getJwt";

export const runtime = "edge";

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
		const amlCoreBaseUrl = getAmlCoreBaseUrl();
		if (!fileUrl.startsWith(amlCoreBaseUrl)) {
			return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
		}

		// Get JWT from session cookies
		const jwt = await getJwt();

		if (!jwt) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Fetch the file from aml-svc with authentication
		const response = await fetch(fileUrl, {
			headers: {
				Authorization: `Bearer ${jwt}`,
			},
		});

		if (!response.ok) {
			return NextResponse.json(
				{ error: `Failed to fetch file: ${response.statusText}` },
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

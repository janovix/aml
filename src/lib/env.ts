/**
 * Environment variable utilities
 *
 * Provides fail-fast access to required environment variables.
 * Throws immediately if a required variable is missing or empty.
 *
 * IMPORTANT for NEXT_PUBLIC_* vars:
 * Next.js only inlines env vars accessed via literal keys (process.env.NEXT_PUBLIC_FOO).
 * Dynamic key access (process.env[name]) returns undefined for NEXT_PUBLIC_* vars.
 * Always pass the value explicitly: requireEnv("NEXT_PUBLIC_FOO", process.env.NEXT_PUBLIC_FOO)
 */
export function requireEnv(name: string, value: string | undefined): string {
	if (!value || value.trim().length === 0) {
		throw new Error(
			`Missing required environment variable: ${name}. ` +
				`Check your .env.local file or Cloudflare build environment variables.`,
		);
	}
	return value.trim().replace(/\/$/, "");
}

/**
 * Root page - This page is never rendered directly.
 * The middleware redirects to /{orgSlug}/clients based on the user's active organization.
 * This component exists only as a fallback for edge cases.
 */
export default function Home(): null {
	// The middleware should have redirected to /{orgSlug}/clients
	// If we reach here, something unexpected happened
	return null;
}

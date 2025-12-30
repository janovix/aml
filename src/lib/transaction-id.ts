/**
 * Generates a shorter, user-friendly transaction ID from a full transaction ID.
 * The ID is designed to be easy to dictate and remember while avoiding collisions.
 *
 * Format: YYYYMMDD-XXXX where:
 * - YYYYMMDD is the date extracted from the transaction ID or current date
 * - XXXX is a 4-character alphanumeric code derived from the ID hash
 *
 * @param fullId - The full transaction ID (e.g., "TRX-2024-001-abc123...")
 * @returns A shorter ID like "20240115-A3B2"
 */
export function generateShortTransactionId(fullId: string): string {
	// Extract date from ID if it follows a pattern like "TRX-2024-001" or contains a date
	// Otherwise use current date
	let dateStr = "";
	const dateMatch = fullId.match(/(\d{4})-(\d{2})-(\d{2})/);
	if (dateMatch) {
		dateStr = dateMatch[1] + dateMatch[2] + dateMatch[3];
	} else {
		// Try to extract year from patterns like "TRX-2024-001"
		const yearMatch = fullId.match(/-(\d{4})-/);
		if (yearMatch) {
			const year = yearMatch[1];
			const now = new Date();
			dateStr =
				year +
				String(now.getMonth() + 1).padStart(2, "0") +
				String(now.getDate()).padStart(2, "0");
		} else {
			// Use current date
			const now = new Date();
			dateStr =
				now.getFullYear().toString() +
				String(now.getMonth() + 1).padStart(2, "0") +
				String(now.getDate()).padStart(2, "0");
		}
	}

	// Generate a short hash from the full ID
	// Simple hash function to convert string to a number
	let hash = 0;
	for (let i = 0; i < fullId.length; i++) {
		const char = fullId.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	// Convert to positive and create 4-character alphanumeric code
	const absHash = Math.abs(hash);
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed I, O, 0, 1 for clarity
	let code = "";
	let num = absHash;
	for (let i = 0; i < 4; i++) {
		code += chars[num % chars.length];
		num = Math.floor(num / chars.length);
	}

	return `${dateStr}-${code}`;
}

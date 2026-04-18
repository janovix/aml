/**
 * Output-side drift guard (Layer 4) — placeholder hook for periodic sampling.
 * Returns true when assistant text should be aborted as off-domain.
 */
export function shouldAbortForOffDomainOutput(_window: string): boolean {
	return false;
}

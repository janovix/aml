/* Storybook mock for Next.js App Router navigation.
 *
 * @storybook/nextjs automatically wires mocks from `.storybook/mocks/*`.
 * This prevents runtime errors like "invariant expected app router to be mounted"
 * when components call `next/navigation` hooks in stories/Chromatic.
 */

export const redirect = (url: string) => {
	// In Storybook we just simulate a navigation side-effect.
	// eslint-disable-next-line no-console
	console.warn(`[storybook] redirect("${url}") called`);
};

export const notFound = () => {
	const error = new Error("[storybook] notFound() called");
	// Make this distinguishable in logs if it ever happens.
	(error as Error & { digest?: string }).digest = "STORYBOOK_NOT_FOUND";
	throw error;
};

export const useRouter = () => ({
	push: (_href: string) => undefined,
	replace: (_href: string) => undefined,
	prefetch: async (_href: string) => undefined,
	back: () => undefined,
	forward: () => undefined,
	refresh: () => undefined,
});

export const usePathname = () => "/";

export const useSearchParams = () => new URLSearchParams();

export const useParams = () => ({});

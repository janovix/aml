import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CoursePlayer, type CourseDetailPayload } from "./CoursePlayer";
import { renderWithProviders } from "@/lib/testHelpers";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
	useParams: () => ({ orgSlug: "org" }),
	usePathname: () => "/org/training/slug-one",
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

vi.mock("@algenium/blocks", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@algenium/blocks")>();
	return {
		...actual,
		PdfViewerDialog: ({ open, title }: { open: boolean; title?: string }) =>
			open ? <div data-testid="pdf-viewer-dialog">{title ?? ""}</div> : null,
	};
});

const ftMocks = vi.hoisted(() => ({
	fetchPdf: vi.fn(async () => new ArrayBuffer(8)),
	fetchImg: vi.fn(
		async () => new Blob([Uint8Array.from([137, 80])], { type: "image/png" }),
	),
}));

vi.mock("@/lib/training/fetchTrainingModulePdf", async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import("@/lib/training/fetchTrainingModulePdf")
		>();
	return {
		...actual,
		fetchTrainingModulePdfBuffer: ftMocks.fetchPdf,
		fetchTrainingModuleImageBlob: ftMocks.fetchImg,
	};
});

describe("CoursePlayer", () => {
	beforeEach(() => {
		mockPush.mockReset();
		ftMocks.fetchPdf.mockClear();
		ftMocks.fetchImg.mockClear();
	});

	function detailBase(
		modules: CourseDetailPayload["modules"],
	): CourseDetailPayload {
		return {
			course: {
				id: "c1",
				slug: "slug-one",
				titleI18n: { es: "Curso", en: "Course" },
			},
			modules,
			enrollment: { id: "e1", status: "IN_PROGRESS" },
		};
	}

	it("renders localized module kind label instead of raw enum", () => {
		renderWithProviders(
			<CoursePlayer
				courseSlug="slug-one"
				orgSlug="org"
				initialDetail={detailBase([
					{
						id: "m1",
						sortOrder: 0,
						kind: "TEXT",
						titleI18n: { es: "Lección", en: "Lesson" },
						body: "contenido",
						progress: { completedAt: null, watchedSeconds: null },
					},
				])}
			/>,
		);

		expect(screen.getByText("Texto")).toBeInTheDocument();
		expect(screen.queryByText("TEXT")).not.toBeInTheDocument();
	});

	it("fetches PDF only after opening the viewer", async () => {
		const user = userEvent.setup();

		renderWithProviders(
			<CoursePlayer
				courseSlug="slug-one"
				orgSlug="org"
				initialDetail={detailBase([
					{
						id: "m1",
						sortOrder: 0,
						kind: "PDF",
						titleI18n: { es: "Doc", en: "Doc" },
						assetPath: "/training/asset.pdf",
						progress: { completedAt: null, watchedSeconds: null },
					},
				])}
			/>,
		);

		expect(ftMocks.fetchPdf).not.toHaveBeenCalled();

		await user.click(screen.getByText(/abrir documento/i));

		await waitFor(() => {
			expect(ftMocks.fetchPdf).toHaveBeenCalledTimes(1);
		});

		await waitFor(() => {
			expect(screen.getByTestId("pdf-viewer-dialog")).toBeInTheDocument();
		});
	});

	it("opens image gallery at the clicked thumbnail index", async () => {
		const user = userEvent.setup();

		renderWithProviders(
			<CoursePlayer
				courseSlug="slug-one"
				orgSlug="org"
				initialDetail={detailBase([
					{
						id: "m1",
						sortOrder: 0,
						kind: "IMAGE",
						titleI18n: { es: "Imgs", en: "Imgs" },
						assetPath: "/training/img",
						imageCount: 2,
						progress: { completedAt: null, watchedSeconds: null },
					},
				])}
			/>,
		);

		await waitFor(() => {
			expect(ftMocks.fetchImg.mock.calls.length).toBeGreaterThanOrEqual(2);
		});

		await user.click(screen.getByRole("button", { name: /imagen 2/i }));

		const dialog = await screen.findByRole("dialog");
		expect(within(dialog).getByText("Imagen 2")).toBeInTheDocument();
	});
});

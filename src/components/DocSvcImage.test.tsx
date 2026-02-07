import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocSvcImage, DocSvcImageGallery } from "./DocSvcImage";

vi.mock("@/hooks/useDocSvcUrls", () => ({
	useDocSvcImageUrl: vi.fn(
		({
			documentId,
		}: {
			organizationId: string;
			documentId: string | null | undefined;
			imageIndex?: number;
		}) => {
			if (!documentId) {
				return { url: null, isLoading: false, error: null };
			}
			if (documentId === "error-doc") {
				return {
					url: null,
					isLoading: false,
					error: new Error("Failed"),
				};
			}
			if (documentId === "loading-doc") {
				return { url: null, isLoading: true, error: null };
			}
			return {
				url: "https://example.com/image.jpg",
				isLoading: false,
				error: null,
			};
		},
	),
	useDocSvcUrls: vi.fn(
		({
			documentId,
		}: {
			organizationId: string;
			documentId: string | null | undefined;
			type?: string;
		}) => {
			if (!documentId) {
				return { imageUrls: [], isLoading: false, error: null };
			}
			return {
				imageUrls: [
					"https://example.com/page-1.jpg",
					"https://example.com/page-2.jpg",
				],
				isLoading: false,
				error: null,
				pdfUrl: null,
				expiresAt: null,
				refresh: vi.fn(),
			};
		},
	),
}));

describe("DocSvcImage", () => {
	it("renders image when documentId is provided", () => {
		render(
			<DocSvcImage
				organizationId="org-1"
				documentId="doc-1"
				alt="Test image"
			/>,
		);
		const img = screen.getByAltText("Test image");
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
	});

	it("renders fallback when documentId is null", () => {
		render(
			<DocSvcImage
				organizationId="org-1"
				documentId={null}
				alt="Test"
				fallback={<span>No image</span>}
			/>,
		);
		expect(screen.getByText("No image")).toBeInTheDocument();
	});

	it("renders fallback on error", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		render(
			<DocSvcImage
				organizationId="org-1"
				documentId="error-doc"
				alt="Test"
				fallback={<span>Error fallback</span>}
			/>,
		);
		expect(screen.getByText("Error fallback")).toBeInTheDocument();
		consoleSpy.mockRestore();
	});

	it("applies className to image", () => {
		render(
			<DocSvcImage
				organizationId="org-1"
				documentId="doc-1"
				alt="Test"
				className="w-full"
			/>,
		);
		expect(screen.getByAltText("Test")).toHaveClass("w-full");
	});

	it("handles onClick", async () => {
		const onClick = vi.fn();
		render(
			<DocSvcImage
				organizationId="org-1"
				documentId="doc-1"
				alt="Test"
				onClick={onClick}
			/>,
		);
		screen.getByAltText("Test").click();
		expect(onClick).toHaveBeenCalled();
	});
});

describe("DocSvcImageGallery", () => {
	it("renders all images", () => {
		render(<DocSvcImageGallery organizationId="org-1" documentId="doc-1" />);
		const images = screen.getAllByRole("img");
		expect(images).toHaveLength(2);
		expect(images[0]).toHaveAttribute("alt", "Page 1");
		expect(images[1]).toHaveAttribute("alt", "Page 2");
	});

	it("returns null when no documentId", () => {
		const { container } = render(
			<DocSvcImageGallery organizationId="org-1" documentId={null} />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("uses custom altPrefix", () => {
		render(
			<DocSvcImageGallery
				organizationId="org-1"
				documentId="doc-1"
				altPrefix="Imagen"
			/>,
		);
		expect(screen.getByAltText("Imagen 1")).toBeInTheDocument();
	});

	it("handles onImageClick", () => {
		const onClick = vi.fn();
		render(
			<DocSvcImageGallery
				organizationId="org-1"
				documentId="doc-1"
				onImageClick={onClick}
			/>,
		);
		screen.getAllByRole("img")[1].click();
		expect(onClick).toHaveBeenCalledWith(1);
	});
});

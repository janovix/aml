"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { PdfViewerDialog } from "@algenium/blocks";

import { CourseStepper } from "@/components/training/CourseStepper";
import {
	ImageGalleryDialog,
	mergeImageGalleryLabels,
} from "@/components/media/ImageGalleryDialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getAmlCoreBaseUrl } from "@/lib/api/config";
import {
	getTrainingCourseDetail,
	postTrainingModuleProgress,
} from "@/lib/api/training";
import {
	fetchTrainingModuleImageBlob,
	fetchTrainingModulePdfBuffer,
	mapTrainingModuleImageError,
	mapTrainingModulePdfError,
} from "@/lib/training/fetchTrainingModulePdf";
import {
	pickEnrollmentStatusKey,
	pickTrainingModuleKindKey,
	pickTrainingTitle,
} from "@/lib/training/i18n";
import { PDF_JS_WORKER_SRC } from "@/lib/pdf/pdfWorkerSrc";
import { useLanguage } from "@/components/LanguageProvider";
import { useOrgStore } from "@/lib/org-store";
import type { TranslationKeys } from "@/lib/translations";

const QUIZ_STEP_ID = "__training_quiz__";

export type CourseDetailPayload = {
	course: {
		id: string;
		slug: string;
		titleI18n: Record<string, string>;
		descriptionI18n?: Record<string, string>;
	};
	modules: Array<{
		id: string;
		sortOrder: number;
		kind: string;
		titleI18n: Record<string, string>;
		descriptionI18n?: Record<string, string> | null;
		required?: boolean;
		playbackToken?: string;
		playerUrl?: string | null;
		playbackError?: string;
		assetPath?: string;
		imageCount?: number;
		body?: string | null;
		progress?: {
			completedAt: string | null;
			watchedSeconds: number | null;
		} | null;
	}>;
	quiz?: { id: string } | null;
	enrollment: { id: string; status: string };
};

export function CoursePlayer({
	orgSlug,
	courseSlug,
	initialDetail,
}: {
	orgSlug: string;
	courseSlug: string;
	initialDetail: CourseDetailPayload | null;
}) {
	const router = useRouter();
	const { language, t } = useLanguage();
	const lang = language === "en" ? "en" : "es";
	const currentOrg = useOrgStore((s) => s.currentOrg);
	const [detail, setDetail] = useState<CourseDetailPayload | null>(
		initialDetail,
	);
	const [idx, setIdx] = useState(0);
	const [marking, setMarking] = useState(false);
	const initializedFromProgressRef = useRef(false);

	const modules = detail?.modules ?? [];

	const firstUncompletedIdx = useMemo(() => {
		const i = modules.findIndex((m) => !m.progress?.completedAt);
		return i === -1 ? modules.length : i;
	}, [modules]);

	const allRequiredComplete = useMemo(
		() =>
			modules.every(
				(m) => m.required === false || Boolean(m.progress?.completedAt),
			),
		[modules],
	);

	useEffect(() => {
		setDetail(initialDetail);
	}, [initialDetail]);

	useEffect(() => {
		initializedFromProgressRef.current = false;
		setIdx(0);
	}, [courseSlug, currentOrg?.id]);

	useEffect(() => {
		if (!detail?.modules.length || initializedFromProgressRef.current) return;
		initializedFromProgressRef.current = true;
		const raw = detail.modules.findIndex((m) => !m.progress?.completedAt);
		const firstUnc = raw === -1 ? detail.modules.length : raw;
		setIdx(Math.min(firstUnc, Math.max(0, detail.modules.length - 1)));
	}, [detail]);

	const mod = modules[idx];
	const title = useMemo(
		() =>
			detail ? pickTrainingTitle(detail.course.titleI18n, lang) : courseSlug,
		[detail, courseSlug, lang],
	);

	async function refreshDetail() {
		const { json } = await getTrainingCourseDetail(courseSlug);
		setDetail(json as CourseDetailPayload);
	}

	async function markComplete() {
		if (!detail || !mod) return;
		setMarking(true);
		try {
			await postTrainingModuleProgress(detail.enrollment.id, mod.id, 0);
			if (idx < modules.length - 1) {
				setIdx((i) => i + 1);
			} else {
				await refreshDetail();
			}
		} finally {
			setMarking(false);
		}
	}

	function handleStepSelect(id: string) {
		if (id === QUIZ_STEP_ID) {
			if (!detail?.quiz) return;
			const prefix = `/${orgSlug}`;
			router.push(
				`${prefix}/training/${courseSlug}/quiz?enrollment=${detail.enrollment.id}`,
			);
			return;
		}
		const stepIndex = modules.findIndex((m) => m.id === id);
		if (stepIndex === -1) return;
		if (stepIndex > firstUncompletedIdx) return;
		setIdx(stepIndex);
	}

	const prefix = `/${orgSlug}`;

	const moduleStepperSteps = useMemo(() => {
		if (!detail) return [];
		const base = modules.map((m, i) => {
			const completed = Boolean(m.progress?.completedAt);
			const locked = i > firstUncompletedIdx;
			const selected = i === idx;
			let statusHint = "";
			if (locked) statusHint = t("trainingStepLocked");
			else if (completed && selected) {
				statusHint = `${t("trainingStepCompleted")} · ${t("trainingStepCurrent")}`;
			} else if (completed) statusHint = t("trainingStepCompleted");
			else if (selected) statusHint = t("trainingStepCurrent");
			else statusHint = t("trainingStepAvailable");
			return {
				id: m.id,
				label: pickTrainingTitle(m.titleI18n, lang),
				completed,
				selected,
				locked,
				statusHint,
				stepNumber: i + 1,
			};
		});

		if (detail.quiz && allRequiredComplete) {
			base.push({
				id: QUIZ_STEP_ID,
				label: t("trainingStepQuiz"),
				completed: false,
				selected: false,
				locked: false,
				statusHint: t("trainingStepQuiz"),
				stepNumber: modules.length + 1,
			});
		}

		return base;
	}, [detail, modules, firstUncompletedIdx, idx, allRequiredComplete, lang, t]);

	const progressLabel = useMemo(
		() =>
			t("trainingStepProgressLabel")
				.replace("{current}", String(idx + 1))
				.replace("{total}", String(modules.length)),
		[t, idx, modules.length],
	);

	if (!detail) {
		return (
			<p className="text-muted-foreground text-sm">{t("trainingLoading")}</p>
		);
	}

	if (modules.length === 0) {
		return (
			<p className="text-muted-foreground text-sm">
				{t("trainingNoModulesInCourse")}
			</p>
		);
	}

	if (!mod) {
		return (
			<p className="text-muted-foreground text-sm">{t("trainingLoading")}</p>
		);
	}

	const moduleTitle = pickTrainingTitle(mod.titleI18n, lang);

	return (
		<div className="space-y-6">
			<div className="min-h-[4.5rem] space-y-1">
				<h1 className="truncate text-2xl font-semibold tracking-tight">
					{title}
				</h1>
				<p className="text-muted-foreground truncate text-sm">
					{t("trainingStatusLabel")}:{" "}
					{t(pickEnrollmentStatusKey(detail.enrollment.status))} ·{" "}
					{progressLabel}
				</p>
			</div>

			<CourseStepper
				steps={moduleStepperSteps}
				currentId={mod.id}
				onSelect={handleStepSelect}
				progressLabel={progressLabel}
			/>

			<Card>
				<CardHeader className="flex min-h-[3rem] flex-col gap-1 space-y-0 pb-3">
					<CardTitle className="truncate text-base">{moduleTitle}</CardTitle>
					<CardDescription className="truncate">
						{t(pickTrainingModuleKindKey(mod.kind))}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{mod.kind === "VIDEO" && mod.playerUrl && (
						<div className="aspect-video w-full overflow-hidden rounded-md border bg-black">
							<iframe
								title={moduleTitle}
								src={mod.playerUrl}
								className="h-full w-full"
								allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
								allowFullScreen
							/>
						</div>
					)}
					{mod.kind === "VIDEO" && !mod.playerUrl && (
						<p className="text-sm text-destructive">
							{mod.playbackError ?? t("trainingVideoUnavailable")}
						</p>
					)}
					{mod.kind === "PDF" && mod.assetPath && (
						<CoursePlayerPdfThumbnail
							assetUrl={`${getAmlCoreBaseUrl()}${mod.assetPath}`}
							moduleTitle={moduleTitle}
							t={t}
						/>
					)}
					{mod.kind === "IMAGE" && mod.assetPath && (
						<CoursePlayerImageSection
							moduleId={mod.id}
							moduleTitle={moduleTitle}
							assetUrlBase={`${getAmlCoreBaseUrl()}${mod.assetPath}`}
							imageCount={mod.imageCount}
							t={t}
							lang={lang}
						/>
					)}
					{mod.kind === "TEXT" && (
						<div className="text-sm leading-relaxed whitespace-pre-wrap">
							{mod.body ?? ""}
						</div>
					)}

					{mod.kind !== "TEXT" && (
						<p className="text-muted-foreground min-h-[1.5rem] text-sm leading-relaxed">
							{mod.descriptionI18n?.[lang] ??
								mod.descriptionI18n?.es ??
								mod.descriptionI18n?.en ??
								""}
						</p>
					)}

					<div className="flex flex-wrap gap-2">
						{idx > 0 && (
							<Button
								type="button"
								variant="outline"
								onClick={() => setIdx((i) => Math.max(0, i - 1))}
							>
								{t("back")}
							</Button>
						)}
						<Button
							type="button"
							disabled={marking}
							onClick={() => void markComplete()}
						>
							{idx < modules.length - 1 ? t("next") : t("trainingMarkDone")}
						</Button>
					</div>
				</CardContent>
			</Card>

			{detail.quiz && modules.length > 0 && idx === modules.length - 1 && (
				<Button asChild variant="secondary">
					<Link
						href={`${prefix}/training/${courseSlug}/quiz?enrollment=${detail.enrollment.id}`}
					>
						{t("trainingTakeQuiz")}
					</Link>
				</Button>
			)}
		</div>
	);
}

function CoursePlayerImageSection({
	moduleId,
	moduleTitle,
	assetUrlBase,
	imageCount,
	t,
	lang,
}: {
	moduleId: string;
	moduleTitle: string;
	assetUrlBase: string;
	imageCount?: number;
	t: (key: TranslationKeys) => string;
	lang: "es" | "en";
}) {
	const slotCount = Math.max(1, imageCount ?? 1);
	const altBase =
		moduleTitle.trim().length > 0 ? moduleTitle : t("trainingImageAltFallback");
	const imageWord = lang === "en" ? "Image" : "Imagen";

	const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
	const [objectUrls, setObjectUrls] = useState<string[]>([]);
	const [errorKey, setErrorKey] = useState<
		"trainingImageSessionExpired" | "trainingImageLoadFailed" | null
	>(null);
	const [galleryOpen, setGalleryOpen] = useState(false);
	const [galleryIndex, setGalleryIndex] = useState(0);

	const galleryLabels = useMemo(
		() =>
			mergeImageGalleryLabels({
				zoomIn: t("trainingImageGalleryZoomIn"),
				zoomOut: t("trainingImageGalleryZoomOut"),
				resetZoom: t("trainingImageGalleryResetZoom"),
				pinchHint: t("trainingImageGalleryPinchHint"),
				pdfDownload: t("trainingModuleKindPdf"),
				closeAriaLabel: t("trainingGalleryCloseAria"),
				prevImage: t("trainingImageGalleryPrevAria"),
				nextImage: t("trainingImageGalleryNextAria"),
			}),
		[t],
	);

	const galleryImages = useMemo(
		() =>
			objectUrls.map((src, imgIdx) => ({
				src,
				title: t("trainingImageNumberLabel").replace("{i}", String(imgIdx + 1)),
			})),
		[objectUrls, t],
	);

	useEffect(() => {
		const ac = new AbortController();
		setPhase("loading");
		setErrorKey(null);

		void (async () => {
			const collected: string[] = [];
			const n = Math.max(1, imageCount ?? 1);
			try {
				for (let i = 0; i < n; i++) {
					const blob = await fetchTrainingModuleImageBlob(
						`${assetUrlBase}?index=${i}`,
						ac.signal,
					);
					collected.push(URL.createObjectURL(blob));
				}
				if (ac.signal.aborted) {
					for (const u of collected) URL.revokeObjectURL(u);
					return;
				}
				setObjectUrls(collected);
				setPhase("ready");
			} catch (e) {
				for (const u of collected) URL.revokeObjectURL(u);
				if (ac.signal.aborted) return;
				setPhase("error");
				setErrorKey(mapTrainingModuleImageError(e));
			}
		})();

		return () => {
			ac.abort();
			setObjectUrls((prev) => {
				for (const u of prev) URL.revokeObjectURL(u);
				return [];
			});
		};
	}, [assetUrlBase, imageCount]);

	if (phase === "loading") {
		return (
			<div className="-mx-1 flex max-w-full gap-3 overflow-x-auto pb-1">
				{Array.from({ length: slotCount }, (_, i) => (
					<Skeleton
						key={`${moduleId}-sk-${i}`}
						className="aspect-[4/3] w-[160px] shrink-0 rounded-md border"
					/>
				))}
			</div>
		);
	}

	if (phase === "error" && errorKey) {
		return <p className="text-sm text-destructive">{t(errorKey)}</p>;
	}

	return (
		<>
			<div className="-mx-1 flex max-w-full gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
				{objectUrls.map((src, imgIdx) => (
					<button
						key={`${moduleId}-thumb-${imgIdx}`}
						type="button"
						onClick={() => {
							setGalleryIndex(imgIdx);
							setGalleryOpen(true);
						}}
						className="focus-visible:ring-ring shrink-0 snap-start rounded-md border bg-muted/20 p-1 transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:outline-none"
					>
						{/* eslint-disable-next-line @next/next/no-img-element -- blob URL */}
						<img
							src={src}
							alt={`${altBase} — ${imageWord} ${imgIdx + 1}`}
							className="aspect-[4/3] w-[160px] rounded-sm object-contain"
						/>
					</button>
				))}
			</div>
			<ImageGalleryDialog
				open={galleryOpen}
				onOpenChange={setGalleryOpen}
				images={galleryImages}
				initialIndex={galleryIndex}
				labels={galleryLabels}
			/>
		</>
	);
}

function CoursePlayerPdfThumbnail({
	assetUrl,
	moduleTitle,
	t,
}: {
	assetUrl: string;
	moduleTitle: string;
	t: (key: TranslationKeys) => string;
}) {
	const [viewerOpen, setViewerOpen] = useState(false);
	const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
	const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "error">(
		"idle",
	);
	const [errorKey, setErrorKey] = useState<
		"trainingPdfSessionExpired" | "trainingPdfLoadFailed" | null
	>(null);

	useEffect(() => {
		setBuffer(null);
		setPhase("idle");
		setErrorKey(null);
	}, [assetUrl]);

	useEffect(() => {
		if (!viewerOpen || buffer) return;
		const ac = new AbortController();
		setPhase("loading");
		setErrorKey(null);

		void (async () => {
			try {
				const ab = await fetchTrainingModulePdfBuffer(assetUrl, ac.signal);
				if (ac.signal.aborted) return;
				setBuffer(ab);
				setPhase("ready");
			} catch (e) {
				if (ac.signal.aborted) return;
				setPhase("error");
				setErrorKey(mapTrainingModulePdfError(e));
			}
		})();

		return () => ac.abort();
	}, [viewerOpen, assetUrl, buffer]);

	function handleOpenChange(open: boolean) {
		setViewerOpen(open);
		if (!open) {
			setPhase("idle");
			setBuffer(null);
			setErrorKey(null);
		}
	}

	const busyDialogOpen =
		viewerOpen && (phase === "loading" || phase === "error");

	return (
		<>
			<button
				type="button"
				onClick={() => setViewerOpen(true)}
				className="focus-visible:ring-ring flex max-w-[280px] cursor-pointer flex-col overflow-hidden rounded-lg border bg-card text-left shadow-sm transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:outline-none"
			>
				<div className="flex aspect-[4/5] flex-col items-center justify-center gap-3 border-b bg-muted/30 p-4 sm:aspect-[3/4]">
					<FileText
						className="text-muted-foreground h-14 w-14 shrink-0"
						strokeWidth={1.25}
						aria-hidden
					/>
					<div className="space-y-1 text-center">
						<p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
							{t("trainingPdfThumbnailLabel")}
						</p>
						<p className="line-clamp-3 text-sm font-semibold">{moduleTitle}</p>
					</div>
				</div>
				<div className="p-3">
					<span className="bg-primary text-primary-foreground inline-flex h-9 w-full items-center justify-center rounded-md px-4 text-sm font-medium">
						{t("trainingPdfOpenDocument")}
					</span>
				</div>
			</button>

			<Dialog open={busyDialogOpen} onOpenChange={handleOpenChange}>
				<DialogContent className="sm:max-w-md" fullscreenMobile>
					<DialogHeader>
						<DialogTitle className="sr-only">
							{t("trainingPdfThumbnailLabel")}
						</DialogTitle>
						<DialogDescription className="sr-only">
							{phase === "loading"
								? t("trainingPdfDialogLoading")
								: errorKey
									? t(errorKey)
									: t("trainingPdfLoadFailed")}
						</DialogDescription>
					</DialogHeader>
					{phase === "loading" ? (
						<div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-10 text-sm">
							<div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
							{t("trainingPdfDialogLoading")}
						</div>
					) : (
						<p className="text-destructive text-center text-sm">
							{errorKey ? t(errorKey) : t("trainingPdfLoadFailed")}
						</p>
					)}
				</DialogContent>
			</Dialog>

			{buffer && phase === "ready" ? (
				<PdfViewerDialog
					open={viewerOpen}
					onOpenChange={handleOpenChange}
					src={buffer}
					workerSrc={PDF_JS_WORKER_SRC}
					title={moduleTitle}
					labels={{
						loading: t("trainingPdfLoading"),
						close: t("close"),
						dialogTitle: moduleTitle,
					}}
				/>
			) : null}
		</>
	);
}

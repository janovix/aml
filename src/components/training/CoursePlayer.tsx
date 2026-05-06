"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PdfViewer, PdfViewerDialog } from "@algenium/blocks";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getAmlCoreBaseUrl } from "@/lib/api/config";
import {
	getTrainingCourseDetail,
	postTrainingModuleProgress,
} from "@/lib/api/training";
import {
	fetchTrainingModulePdfBuffer,
	mapTrainingModulePdfError,
} from "@/lib/training/fetchTrainingModulePdf";
import {
	pickTrainingTitle,
	pickEnrollmentStatusKey,
} from "@/lib/training/i18n";
import { PDF_JS_WORKER_SRC } from "@/lib/pdf/pdfWorkerSrc";
import { useLanguage } from "@/components/LanguageProvider";
import type { TranslationKeys } from "@/lib/translations";

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
		/** Present for IMAGE modules with one or more assets */
		imageCount?: number;
		body?: string | null;
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
	const { language, t } = useLanguage();
	const lang = language === "en" ? "en" : "es";
	const [detail, setDetail] = useState<CourseDetailPayload | null>(
		initialDetail,
	);
	const [idx, setIdx] = useState(0);
	const [marking, setMarking] = useState(false);

	const modules = detail?.modules ?? [];
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

	const prefix = `/${orgSlug}`;

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
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
				<p className="text-muted-foreground text-sm">
					{t("trainingStatusLabel")}:{" "}
					{t(pickEnrollmentStatusKey(detail.enrollment.status))} · {idx + 1}/
					{modules.length}
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">{moduleTitle}</CardTitle>
					<CardDescription>{mod.kind}</CardDescription>
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
						<CoursePlayerPdfSection
							assetUrl={`${getAmlCoreBaseUrl()}${mod.assetPath}`}
							moduleTitle={moduleTitle}
							t={t}
						/>
					)}
					{mod.kind === "IMAGE" && mod.assetPath && (
						<div className="flex flex-wrap gap-3">
							{Array.from(
								{ length: Math.max(1, mod.imageCount ?? 1) },
								(_, imgIdx) => (
									// eslint-disable-next-line @next/next/no-img-element -- binary asset from aml-core
									<img
										key={`${mod.id}-${imgIdx}`}
										src={`${getAmlCoreBaseUrl()}${mod.assetPath}?index=${imgIdx}`}
										alt=""
										className="max-h-[280px] w-auto rounded-md border object-contain"
									/>
								),
							)}
						</div>
					)}
					{mod.kind === "TEXT" && (
						<div className="text-sm whitespace-pre-wrap leading-relaxed">
							{mod.body ?? ""}
						</div>
					)}

					{mod.kind !== "TEXT" && mod.descriptionI18n && (
						<p className="text-sm text-muted-foreground leading-relaxed">
							{mod.descriptionI18n[lang] ??
								mod.descriptionI18n.es ??
								mod.descriptionI18n.en ??
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

function CoursePlayerPdfSection({
	assetUrl,
	moduleTitle,
	t,
}: {
	assetUrl: string;
	moduleTitle: string;
	t: (key: TranslationKeys) => string;
}) {
	const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
	const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
	const [errorKey, setErrorKey] = useState<
		"trainingPdfSessionExpired" | "trainingPdfLoadFailed" | null
	>(null);
	const [fullscreenOpen, setFullscreenOpen] = useState(false);

	useEffect(() => {
		const ac = new AbortController();
		setPhase("loading");
		setBuffer(null);
		setErrorKey(null);

		void (async () => {
			try {
				const ab = await fetchTrainingModulePdfBuffer(assetUrl, ac.signal);
				setBuffer(ab);
				setPhase("ready");
			} catch (e) {
				if (ac.signal.aborted) return;
				setPhase("error");
				setErrorKey(mapTrainingModulePdfError(e));
			}
		})();

		return () => ac.abort();
	}, [assetUrl]);

	if (phase === "loading") {
		return (
			<div className="flex min-h-[240px] items-center justify-center rounded-md border text-muted-foreground text-sm">
				{t("trainingPdfLoading")}
			</div>
		);
	}
	if (phase === "error" && errorKey) {
		return <p className="text-sm text-destructive">{t(errorKey)}</p>;
	}
	if (!buffer) return null;

	return (
		<>
			<div className="flex flex-col gap-2">
				<PdfViewer
					src={buffer}
					workerSrc={PDF_JS_WORKER_SRC}
					className="min-h-[480px]"
					labels={{ loading: t("trainingPdfLoading") }}
				/>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-fit"
					onClick={() => setFullscreenOpen(true)}
				>
					{t("trainingOpenPdfFullscreen")}
				</Button>
			</div>
			<PdfViewerDialog
				open={fullscreenOpen}
				onOpenChange={setFullscreenOpen}
				src={buffer}
				workerSrc={PDF_JS_WORKER_SRC}
				title={moduleTitle}
				labels={{
					loading: t("trainingPdfLoading"),
					close: t("close"),
				}}
			/>
		</>
	);
}

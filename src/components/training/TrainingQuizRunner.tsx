"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { startTrainingQuiz, submitTrainingQuiz } from "@/lib/api/training";
import { pickTrainingTitle } from "@/lib/training/i18n";
import { useLanguage } from "@/components/LanguageProvider";

type Question = {
	id: string;
	type: string;
	promptI18n: Record<string, string>;
	options: Array<{ id: string; textI18n: Record<string, string> }>;
};

export function TrainingQuizRunner({
	orgSlug,
	courseSlug,
	enrollmentId,
}: {
	orgSlug: string;
	courseSlug: string;
	enrollmentId: string;
}) {
	const { language, t } = useLanguage();
	const lang = language === "en" ? "en" : "es";
	const prefix = `/${orgSlug}`;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [attemptId, setAttemptId] = useState<string | null>(null);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<{
		passed: boolean;
		score: number;
		passingScore?: number;
		validUntil?: string;
	} | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				const res = await startTrainingQuiz(enrollmentId);
				if (cancelled) return;
				const json = res.json as {
					attemptId: string;
					questions: Question[];
				};
				setAttemptId(json.attemptId);
				setQuestions(json.questions);
				setError(null);
			} catch (e) {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : "Error");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [enrollmentId]);

	async function submit() {
		if (!attemptId) return;
		setSubmitting(true);
		try {
			const res = await submitTrainingQuiz(enrollmentId, attemptId, answers);
			const body = res.json as {
				passed: boolean;
				score: number;
				passingScore?: number;
				validUntil?: string;
			};
			setResult({
				passed: body.passed,
				score: body.score,
				passingScore: body.passingScore,
				validUntil: body.validUntil,
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Submit failed");
		} finally {
			setSubmitting(false);
		}
	}

	if (loading) {
		return <p className="text-muted-foreground">{t("trainingLoading")}</p>;
	}

	if (error && !attemptId) {
		return (
			<div className="space-y-4">
				<p className="text-destructive text-sm">{error}</p>
				<Button variant="outline" asChild>
					<Link href={`${prefix}/training/${courseSlug}`}>{t("back")}</Link>
				</Button>
			</div>
		);
	}

	if (result) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>
						{result.passed ? t("trainingQuizPassed") : t("trainingQuizFailed")}
					</CardTitle>
					<CardDescription>
						{t("trainingStatusLabel")}: {result.score}%
						{result.passingScore != null
							? ` (${t("trainingPassingLabel")}: ${result.passingScore}%)`
							: ""}
						{result.validUntil && (
							<span className="block pt-1">
								{t("trainingValidUntil")}:{" "}
								{new Date(result.validUntil).toLocaleDateString()}
							</span>
						)}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild>
						<Link href={`${prefix}/training`}>{t("trainingOpen")}</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{questions.map((q, i) => (
				<Card key={q.id}>
					<CardHeader>
						<CardTitle className="text-base">
							{i + 1}. {pickTrainingTitle(q.promptI18n, lang)}
						</CardTitle>
						<CardDescription>{q.type}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{q.type === "SINGLE_CHOICE" &&
							q.options.map((o) => (
								<label
									key={o.id}
									className="flex cursor-pointer items-start gap-2 text-sm"
								>
									<input
										type="radio"
										name={`q-${q.id}`}
										checked={answers[q.id] === o.id}
										onChange={() =>
											setAnswers((prev) => ({ ...prev, [q.id]: o.id }))
										}
									/>
									<span>{pickTrainingTitle(o.textI18n, lang)}</span>
								</label>
							))}
						{q.type === "MULTIPLE_CHOICE" &&
							q.options.map((o) => {
								const selected = Array.isArray(answers[q.id])
									? (answers[q.id] as string[])
									: [];
								const checked = selected.includes(o.id);
								return (
									<label
										key={o.id}
										className="flex cursor-pointer items-start gap-2 text-sm"
									>
										<input
											type="checkbox"
											checked={checked}
											onChange={() => {
												setAnswers((prev) => {
													const cur = Array.isArray(prev[q.id])
														? [...(prev[q.id] as string[])]
														: [];
													if (checked) {
														return {
															...prev,
															[q.id]: cur.filter((x) => x !== o.id),
														};
													}
													return { ...prev, [q.id]: [...cur, o.id] };
												});
											}}
										/>
										<span>{pickTrainingTitle(o.textI18n, lang)}</span>
									</label>
								);
							})}
					</CardContent>
				</Card>
			))}

			{error && (
				<p className="text-destructive text-sm" role="alert">
					{error}
				</p>
			)}

			<div className="flex gap-2">
				<Button
					type="button"
					disabled={submitting}
					onClick={() => void submit()}
				>
					{submitting ? "…" : t("trainingQuizSubmit")}
				</Button>
				<Button variant="outline" asChild>
					<Link href={`${prefix}/training/${courseSlug}`}>{t("back")}</Link>
				</Button>
			</div>
		</div>
	);
}

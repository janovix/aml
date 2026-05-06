"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	CoursePlayer,
	type CourseDetailPayload,
} from "@/components/training/CoursePlayer";
import { getTrainingCourseDetail } from "@/lib/api/training";
import { useLanguage } from "@/components/LanguageProvider";

export default function TrainingCoursePage() {
	const { t } = useLanguage();
	const params = useParams();
	const orgSlug = params.orgSlug as string;
	const courseSlug = params.courseSlug as string;
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [detail, setDetail] = useState<CourseDetailPayload | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				const res = await getTrainingCourseDetail(courseSlug);
				if (!cancelled) {
					setDetail(res.json as CourseDetailPayload);
					setError(null);
				}
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
	}, [courseSlug]);

	const prefix = `/${orgSlug}`;

	return (
		<div className="container max-w-4xl py-8 space-y-6">
			<Button variant="ghost" asChild>
				<Link href={`${prefix}/training`}>{t("back")}</Link>
			</Button>

			{loading && <p>{t("trainingLoading")}</p>}
			{error && (
				<p className="text-destructive text-sm" role="alert">
					{error}
				</p>
			)}

			{detail != null && (
				<CoursePlayer
					orgSlug={orgSlug}
					courseSlug={courseSlug}
					initialDetail={detail}
				/>
			)}
		</div>
	);
}

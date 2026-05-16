/**
 * AML Training API client (`aml-svc` `/api/v1/training/*`).
 */

import { getAmlCoreBaseUrl } from "@/lib/api/config";
import { fetchJson } from "@/lib/api/http";

function base(): string {
	return `${getAmlCoreBaseUrl()}/api/v1/training`;
}

export async function listTrainingCourses() {
	return fetchJson<{
		data: Array<{
			id: string;
			slug: string;
			titleI18n: Record<string, string>;
			enrollment: unknown;
		}>;
	}>(`${base()}/courses`);
}

export async function listMyTrainingEnrollments() {
	return fetchJson<{
		data: Array<{
			id: string;
			status: string;
			course: { slug: string; titleI18n: unknown };
			validUntil: string | null;
		}>;
	}>(`${base()}/enrollments/me`);
}

export async function listMyCertifications() {
	return fetchJson<{
		data: Array<{
			id: string;
			certificateNumber: string;
			score: number;
			issuedAt: string;
			expiresAt: string;
			enrollment: { course: { slug: string; titleI18n: unknown } };
		}>;
	}>(`${base()}/certifications/me`);
}

export async function getTrainingCourseDetail(slug: string) {
	return fetchJson<unknown>(`${base()}/courses/${encodeURIComponent(slug)}`);
}

export async function postTrainingModuleProgress(
	enrollmentId: string,
	moduleId: string,
	watchedSeconds?: number,
) {
	return fetchJson<{ ok: boolean }>(
		`${base()}/enrollments/${encodeURIComponent(enrollmentId)}/progress`,
		{
			method: "POST",
			body: JSON.stringify({ moduleId, watchedSeconds }),
		},
	);
}

export async function startTrainingQuiz(enrollmentId: string) {
	return fetchJson<{
		attemptId: string;
		startedAt: string;
		questions: Array<{
			id: string;
			sortOrder: number;
			type: string;
			promptI18n: Record<string, string>;
			options: Array<{
				id: string;
				sortOrder: number;
				textI18n: Record<string, string>;
			}>;
		}>;
	}>(`${base()}/enrollments/${encodeURIComponent(enrollmentId)}/quiz/start`, {
		method: "POST",
	});
}

export async function submitTrainingQuiz(
	enrollmentId: string,
	attemptId: string,
	answers: Record<string, string | string[]>,
) {
	return fetchJson<unknown>(
		`${base()}/enrollments/${encodeURIComponent(enrollmentId)}/quiz/submit`,
		{
			method: "POST",
			body: JSON.stringify({ attemptId, answers }),
		},
	);
}

export async function getOrgTrainingComplianceSummary(organizationId: string) {
	return fetchJson<unknown>(
		`${base()}/org/${encodeURIComponent(organizationId)}/compliance-summary`,
	);
}

export async function listOrgTrainingEnrollments(
	organizationId: string,
	filters?: { courseId?: string; status?: string },
) {
	const params = new URLSearchParams();
	if (filters?.courseId) params.set("courseId", filters.courseId);
	if (filters?.status) params.set("status", filters.status);
	const qs = params.toString();
	return fetchJson<{ data: unknown[] }>(
		`${base()}/org/${encodeURIComponent(organizationId)}/enrollments${qs ? `?${qs}` : ""}`,
	);
}

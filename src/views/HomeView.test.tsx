import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeView } from "./HomeView";
import type { Task } from "@/lib/api/tasks";
import { SWRConfig } from "swr";

describe("HomeView", () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		const jsonResponse = (body: unknown, status = 200) =>
			new Response(JSON.stringify(body), {
				status,
				headers: { "content-type": "application/json" },
			});

		fetchMock = vi.fn(async () => {
			return jsonResponse({ success: true, result: [] });
		});

		vi.stubGlobal("fetch", fetchMock);
	});

	it("renders with initial tasks", () => {
		const mockTasks: Task[] = [
			{
				id: 1,
				name: "Test Task",
				slug: "test-task",
				description: "Test description",
				completed: false,
				due_date: new Date().toISOString(),
			},
		];

		render(
			<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
				<HomeView initialTasks={mockTasks} />
			</SWRConfig>,
		);

		expect(screen.getByText("Tasks")).toBeInTheDocument();
		expect(screen.getByText("Test Task")).toBeInTheDocument();
	});

	it("renders with empty tasks", () => {
		render(
			<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
				<HomeView initialTasks={[]} />
			</SWRConfig>,
		);

		const tasksHeaders = screen.getAllByText("Tasks");
		expect(tasksHeaders.length).toBeGreaterThan(0);
		expect(screen.getByText("No tasks yet.")).toBeInTheDocument();
	});
});

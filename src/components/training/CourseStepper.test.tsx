import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CourseStepper } from "./CourseStepper";
import { renderWithProviders } from "@/lib/testHelpers";

describe("CourseStepper", () => {
	it("calls onSelect for unlocked steps", async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();

		renderWithProviders(
			<CourseStepper
				currentId="b"
				onSelect={onSelect}
				progressLabel="Paso 2 de 2"
				steps={[
					{
						id: "a",
						label: "One",
						completed: true,
						selected: false,
						locked: false,
						statusHint: "hint-a",
						stepNumber: 1,
					},
					{
						id: "b",
						label: "Two",
						completed: false,
						selected: true,
						locked: false,
						statusHint: "hint-b",
						stepNumber: 2,
					},
				]}
			/>,
		);

		await user.click(screen.getByTitle("hint-a"));
		expect(onSelect).toHaveBeenCalledWith("a");
	});

	it("does not call onSelect for locked steps", async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();

		renderWithProviders(
			<CourseStepper
				currentId="a"
				onSelect={onSelect}
				progressLabel="Paso 1 de 2"
				steps={[
					{
						id: "a",
						label: "One",
						completed: false,
						selected: true,
						locked: false,
						statusHint: "available",
						stepNumber: 1,
					},
					{
						id: "b",
						label: "Two",
						completed: false,
						selected: false,
						locked: true,
						statusHint: "locked-title",
						stepNumber: 2,
					},
				]}
			/>,
		);

		const locked = screen.getByTitle("locked-title");
		expect(locked).toBeDisabled();
		await user.click(locked);
		expect(onSelect).not.toHaveBeenCalled();
	});
});

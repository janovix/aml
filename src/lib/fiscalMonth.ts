/**
 * Fiscal month utilities for Mexican tax reporting
 * Fiscal months end on the 17th of each month, with new cycles starting on the 18th
 */

/**
 * Get the fiscal month for a given date
 * Fiscal month is determined by: if day <= 17, it belongs to current month's fiscal period
 * If day > 17, it belongs to next month's fiscal period
 * @param date - The date to get the fiscal month for
 * @returns Fiscal month in YYYY-MM format
 */
export function getFiscalMonth(date: Date): string {
	const year = date.getFullYear();
	const month = date.getMonth(); // 0-indexed
	const day = date.getDate();

	// If day is 17 or earlier, it belongs to current month's fiscal period
	// If day is 18 or later, it belongs to next month's fiscal period
	if (day <= 17) {
		// Current month's fiscal period
		const monthStr = String(month + 1).padStart(2, "0");
		return `${year}-${monthStr}`;
	} else {
		// Next month's fiscal period
		const nextMonth = month + 1;
		if (nextMonth > 11) {
			// December -> January of next year
			return `${year + 1}-01`;
		}
		const monthStr = String(nextMonth + 1).padStart(2, "0");
		return `${year}-${monthStr}`;
	}
}

/**
 * Get the start date of a fiscal month
 * @param fiscalMonth - Fiscal month in YYYY-MM format
 * @returns Start date of the fiscal month (18th of previous month)
 */
export function getFiscalMonthStartDate(fiscalMonth: string): Date {
	const [year, month] = fiscalMonth.split("-").map(Number);
	// Fiscal month starts on the 18th of the previous month
	// For example, fiscal month "2024-02" (February) starts on Jan 18, 2024
	const prevMonth = month - 2; // month is 1-indexed (1-12), so subtract 2 to get previous month (0-indexed)
	if (prevMonth < 0) {
		// January -> December of previous year
		return new Date(year - 1, 11, 18);
	}
	return new Date(year, prevMonth, 18);
}

/**
 * Get the end date of a fiscal month
 * @param fiscalMonth - Fiscal month in YYYY-MM format
 * @returns End date of the fiscal month (17th of current month)
 */
export function getFiscalMonthEndDate(fiscalMonth: string): Date {
	const [year, month] = fiscalMonth.split("-").map(Number);
	return new Date(year, month - 1, 17);
}

/**
 * Get display name for a fiscal month
 * @param fiscalMonth - Fiscal month in YYYY-MM format
 * @returns Display name like "Enero 2024" (Jan 18, 2023 - Feb 17, 2024)
 */
export function getFiscalMonthDisplayName(fiscalMonth: string): string {
	const [year, month] = fiscalMonth.split("-").map(Number);
	const monthNames = [
		"Enero",
		"Febrero",
		"Marzo",
		"Abril",
		"Mayo",
		"Junio",
		"Julio",
		"Agosto",
		"Septiembre",
		"Octubre",
		"Noviembre",
		"Diciembre",
	];

	const monthName = monthNames[month - 1];
	const startDate = getFiscalMonthStartDate(fiscalMonth);
	const endDate = getFiscalMonthEndDate(fiscalMonth);

	const startDay = startDate.getDate();
	const startMonthName = monthNames[startDate.getMonth()];
	const endDay = endDate.getDate();
	const endMonthName = monthNames[endDate.getMonth()];
	const endYear = endDate.getFullYear();

	return `${monthName} ${year} (${startDay} ${startMonthName} - ${endDay} ${endMonthName} ${endYear})`;
}

/**
 * Group alerts by fiscal month
 * @param alerts - Array of alerts
 * @returns Array of fiscal month groups with alerts
 */
export function groupAlertsByFiscalMonth<T extends { fiscalMonth: string }>(
	alerts: T[],
): Array<{
	fiscalMonth: string;
	displayName: string;
	startDate: Date;
	endDate: Date;
	alerts: T[];
}> {
	const groups = new Map<
		string,
		{
			fiscalMonth: string;
			displayName: string;
			startDate: Date;
			endDate: Date;
			alerts: T[];
		}
	>();

	for (const alert of alerts) {
		const fiscalMonth = alert.fiscalMonth;
		if (!groups.has(fiscalMonth)) {
			groups.set(fiscalMonth, {
				fiscalMonth,
				displayName: getFiscalMonthDisplayName(fiscalMonth),
				startDate: getFiscalMonthStartDate(fiscalMonth),
				endDate: getFiscalMonthEndDate(fiscalMonth),
				alerts: [],
			});
		}
		groups.get(fiscalMonth)?.alerts.push(alert);
	}

	// Sort groups by fiscal month (most recent first)
	return Array.from(groups.values()).sort((a, b) => {
		if (a.fiscalMonth > b.fiscalMonth) return -1;
		if (a.fiscalMonth < b.fiscalMonth) return 1;
		return 0;
	});
}

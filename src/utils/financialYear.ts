/**
 * Indian Financial Year & Statutory Date Management Utility
 * In India, Financial Years run from 1 April to 31 March.
 * All reporting dates, statutory calendars, and returns dynamically key off this logic.
 */

export interface FinancialYearInfo {
  fyString: string; // e.g. "2024-25"
  assessmentYear: string; // e.g. "2025-26"
  startDate: string; // YYYY-MM-DD (e.g. "2024-04-01")
  endDate: string; // YYYY-MM-DD (e.g. "2025-03-31")
  reportingDateDisplay: string; // e.g. "31 March 2025"
}

export function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 is January, 3 is April

  if (month >= 3) {
    // April (3) to December (11)
    const nextYearShort = String((year + 1) % 100).padStart(2, "0");
    return `${year}-${nextYearShort}`;
  } else {
    // January (0) to March (2)
    const currentYearShort = String(year % 100).padStart(2, "0");
    return `${year - 1}-${currentYearShort}`;
  }
}

export function getFinancialYearDetails(fyString: string): FinancialYearInfo {
  // Parse "2024-25" or "2025-26"
  const match = fyString.match(/^(\d{4})-(\d{2})$/);
  let startYear = 2024;
  if (match) {
    startYear = parseInt(match[1], 10);
  }
  const endYear = startYear + 1;
  const ayStartYear = endYear;
  const ayEndYearShort = String((ayStartYear + 1) % 100).padStart(2, "0");

  return {
    fyString,
    assessmentYear: `${ayStartYear}-${ayEndYearShort}`,
    startDate: `${startYear}-04-01`,
    endDate: `${endYear}-03-31`,
    reportingDateDisplay: `31 March ${endYear}`,
  };
}

export function getSupportedFinancialYears(count = 4): string[] {
  const current = getCurrentFinancialYear();
  const currentStartYear = parseInt(current.split("-")[0], 10);
  const list: string[] = [];

  // 2 past years, current year, 1 future year
  for (let offset = -2; offset <= 1; offset++) {
    const sYear = currentStartYear + offset;
    const eYearShort = String((sYear + 1) % 100).padStart(2, "0");
    list.push(`${sYear}-${eYearShort}`);
  }
  return list;
}

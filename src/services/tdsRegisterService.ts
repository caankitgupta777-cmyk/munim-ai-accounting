/**
 * Persistent Cumulative TDS Register Service
 * Compliant with Income-tax Act, 1961 & Income-tax Act, 2025 Transition
 * Tracks annual aggregate payments per payee PAN, detects statutory threshold crossings,
 * enforces Section 206AA (missing PAN 20%) & Section 206AB (non-filers), and persists entries.
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, ensureFirebaseAuth } from "../lib/firebase";
import { DecimalMath } from "../utils/decimalMath";
import { calculateTDS } from "./tdsEngine";

export interface TdsRegisterEntry {
  id: string;
  companyId: string;
  financialYear: string;
  transactionDate: string; // YYYY-MM-DD
  deductorId: string;
  deducteeName: string;
  deducteePan: string;
  section: string;
  sectionDisplay: string;
  threshold: number;
  previousPayments: number;
  currentPayment: number;
  cumulativeAmount: number;
  thresholdCrossed: boolean;
  applicableRate: number;
  tdsDeducted: number;
  challanCode: string;
  dueDate: string;
  voucherId?: string;
  createdAt: string;
}

export interface CalculateCumulativeTdsInput {
  sectionCode: string;
  payeePan?: string;
  payeeType?: string;
  currentBillAmount: number;
  previousAggregatePayments: number;
  isPanAvailable?: boolean;
}

export function calculateCumulativeTDS(params: CalculateCumulativeTdsInput): {
  tdsAmount: number;
  applicableRate: number;
  thresholdCrossed: boolean;
  cumulativeTotal: number;
} {
  const panAvailable = params.isPanAvailable !== false && Boolean(params.payeePan && params.payeePan.length === 10);
  const cumulativeTotal = DecimalMath.add(params.previousAggregatePayments, params.currentBillAmount);

  const calc = calculateTDS({
    section: params.sectionCode,
    baseAmount: params.currentBillAmount,
    annualAggregateBeforePayment: params.previousAggregatePayments,
    panAvailable,
    payeeType: params.payeeType === "company" ? "Company" : (params.payeeType as any),
  });

  return {
    tdsAmount: calc.tdsAmount,
    applicableRate: calc.rate,
    thresholdCrossed: calc.thresholdExceeded,
    cumulativeTotal,
  };
}
export interface CalculateTdsInput {
  companyId: string;
  financialYear: string;
  transactionDate: string;
  deducteeName: string;
  deducteePan?: string;
  section: string;
  currentPayment: number;
  voucherId?: string;
  payerType?: "Individual" | "HUF" | "Company" | "Firm" | "LLP";
  payeeType?: "Individual" | "HUF" | "Company" | "Firm" | "LLP";
  hasLowerDeductionCert197?: boolean;
  lowerDeductionRate?: number;
  isSpecifiedPerson206AB?: boolean;
  isPayerSubjectToAudit?: boolean;
}

/**
 * Fetch all previous payments made to a specific PAN under a section in the FY
 */
export async function getPayeeCumulativePayment(
  companyId: string,
  financialYear: string,
  deducteePan: string,
  section: string
): Promise<number> {
  const normPan = (deducteePan || "").toUpperCase().trim();
  if (!normPan) return 0;

  try {
    const user = await ensureFirebaseAuth();
    if (user?.uid && companyId) {
      const regRef = collection(db, "companies", companyId, "tds_register");
      const q = query(
        regRef,
        where("financialYear", "==", financialYear),
        where("deducteePan", "==", normPan),
        where("section", "==", section)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        let total = 0;
        snap.forEach((d) => {
          const entry = d.data() as TdsRegisterEntry;
          total = DecimalMath.add(total, entry.currentPayment || 0);
        });
        return total;
      }
    }
  } catch (err) {
    console.warn("Could not query cloud TDS register, checking local cache:", err);
  }

  // Local cache check
  const cacheKey = `munim_tds_${companyId}_${financialYear}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const list: TdsRegisterEntry[] = JSON.parse(raw);
      return list
        .filter((e) => e.deducteePan === normPan && e.section === section)
        .reduce((sum, curr) => DecimalMath.add(sum, curr.currentPayment), 0);
    }
  } catch (e) {}

  return 0;
}

/**
 * Process a transaction, determine cumulative threshold crossing, compute exact TDS,
 * and persist to the company's TDS register.
 */
export async function processAndRecordTds(input: CalculateTdsInput): Promise<TdsRegisterEntry> {
  const normPan = (input.deducteePan || "").toUpperCase().trim();
  const panAvailable = Boolean(normPan && normPan.length === 10);

  // 1. Fetch previous payments made in this FY
  const previousPayments = await getPayeeCumulativePayment(
    input.companyId,
    input.financialYear,
    normPan,
    input.section
  );

  const cumulativeAmount = DecimalMath.add(previousPayments, input.currentPayment);

  // 2. Perform statutory TDS evaluation
  const calc = calculateTDS({
    section: input.section,
    baseAmount: input.currentPayment,
    annualAggregateBeforePayment: previousPayments,
    panAvailable,
    payerType: input.payerType,
    payeeType: input.payeeType,
    hasLowerDeductionCert197: input.hasLowerDeductionCert197,
    lowerDeductionRate: input.lowerDeductionRate,
    isNonFiler206AB: input.isSpecifiedPerson206AB,
    isPayerSubjectToAudit: input.isPayerSubjectToAudit,
    taxYear: input.financialYear,
  });

  const id = `tds_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record: TdsRegisterEntry = {
    id,
    companyId: input.companyId,
    financialYear: input.financialYear,
    transactionDate: input.transactionDate || new Date().toISOString().slice(0, 10),
    deductorId: input.companyId,
    deducteeName: input.deducteeName || "Payee",
    deducteePan: normPan || "PANNOTAVBL",
    section: input.section,
    sectionDisplay: calc.sectionDisplay,
    threshold: calc.threshold,
    previousPayments,
    currentPayment: input.currentPayment,
    cumulativeAmount,
    thresholdCrossed: calc.thresholdExceeded,
    applicableRate: calc.rate,
    tdsDeducted: calc.tdsAmount,
    challanCode: calc.challanCode,
    dueDate: calc.dueDate,
    voucherId: input.voucherId,
    createdAt: new Date().toISOString(),
  };

  // 3. Persist to Firestore
  try {
    const user = await ensureFirebaseAuth();
    if (user?.uid && input.companyId) {
      const docRef = doc(db, "companies", input.companyId, "tds_register", id);
      await setDoc(docRef, record);
    }
  } catch (err) {
    console.warn("Failed to persist TDS record to Firestore:", err);
  }

  // 4. Update local cache
  const cacheKey = `munim_tds_${input.companyId}_${input.financialYear}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    const existing = raw ? JSON.parse(raw) : [];
    localStorage.setItem(cacheKey, JSON.stringify([record, ...existing]));
  } catch (e) {}

  return record;
}

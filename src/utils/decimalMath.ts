/**
 * Decimal & Integer-Paise Precision Utility
 * Prevents IEEE 754 floating point drift in Indian accounting, GST & TDS calculations.
 * 1 Rupee = 100 Paise. All core arithmetic operates on integer paise.
 */

export class DecimalMath {
  /**
   * Convert Rupees to integer Paise (e.g. 100.45 -> 10045)
   */
  static toPaise(rupees: number): number {
    if (isNaN(rupees) || !isFinite(rupees)) return 0;
    return Math.round((rupees + Number.EPSILON) * 100);
  }

  /**
   * Convert integer Paise back to Rupees rounded to 2 decimal places (e.g. 10045 -> 100.45)
   */
  static toRupees(paise: number): number {
    if (isNaN(paise) || !isFinite(paise)) return 0;
    return Math.round(paise) / 100;
  }

  /**
   * Safe addition of multiple Rupee amounts via integer paise
   */
  static add(...amounts: number[]): number {
    const totalPaise = amounts.reduce((sum, curr) => sum + DecimalMath.toPaise(curr), 0);
    return DecimalMath.toRupees(totalPaise);
  }

  /**
   * Safe subtraction (a - b) in integer paise
   */
  static subtract(a: number, b: number): number {
    const diffPaise = DecimalMath.toPaise(a) - DecimalMath.toPaise(b);
    return DecimalMath.toRupees(diffPaise);
  }

  /**
   * Safe percentage calculation with exact rounding (e.g. 18% of ₹10,000.40)
   */
  static calculatePercentage(baseRupees: number, ratePercent: number): number {
    if (baseRupees <= 0 || ratePercent <= 0) return 0;
    const basePaise = DecimalMath.toPaise(baseRupees);
    // basePaise * ratePercent / 100
    const taxPaise = Math.round((basePaise * ratePercent) / 100);
    return DecimalMath.toRupees(taxPaise);
  }

  /**
   * Split total GST evenly into CGST and SGST without losing odd half-paise
   * Example: ₹100.01 GST splits into ₹50.01 CGST and ₹50.00 SGST (sum = 100.01)
   */
  static splitIntraStateGst(totalGstRupees: number): { cgst: number; sgst: number } {
    const totalPaise = DecimalMath.toPaise(totalGstRupees);
    const halfPaise = Math.floor(totalPaise / 2);
    const remainderPaise = totalPaise % 2;

    const cgstPaise = halfPaise + remainderPaise; // CGST takes the odd paise
    const sgstPaise = halfPaise;

    return {
      cgst: DecimalMath.toRupees(cgstPaise),
      sgst: DecimalMath.toRupees(sgstPaise),
    };
  }

  /**
   * Section 170 of CGST Act: Mandatory Rounding to Nearest Rupee
   * Any fraction of a rupee >= 50 paise rounds UP, < 50 paise rounds DOWN.
   */
  static roundSection170(amountRupees: number): {
    roundedAmount: number;
    roundingDifference: number;
  } {
    const paise = DecimalMath.toPaise(amountRupees);
    const wholeRupees = Math.round(paise / 100);
    const roundedPaise = wholeRupees * 100;
    const diffPaise = roundedPaise - paise;

    return {
      roundedAmount: wholeRupees,
      roundingDifference: DecimalMath.toRupees(diffPaise),
    };
  }

  /**
   * Exact comparison of two Rupee amounts with optional tolerance in paise
   */
  static areEqual(a: number, b: number, tolerancePaise = 0): boolean {
    const diffPaise = Math.abs(DecimalMath.toPaise(a) - DecimalMath.toPaise(b));
    return diffPaise <= tolerancePaise;
  }
}

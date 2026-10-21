import { formatCurrencyPreserve } from './format';

describe('formatCurrencyPreserve', () => {
  describe('basic amounts without decimals', () => {
    it('formats whole rupees with Indian grouping', () => {
      expect(formatCurrencyPreserve(1250)).toBe('₹1,250');
      expect(formatCurrencyPreserve(100000)).toBe('₹1,00,000');
      expect(formatCurrencyPreserve(1234567)).toBe('₹12,34,567');
      expect(formatCurrencyPreserve(123456789)).toBe('₹12,34,56,789');
    });

    it('handles zero', () => {
      expect(formatCurrencyPreserve(0)).toBe('₹0');
    });
  });

  describe('exact decimal preservation', () => {
    it('preserves trailing zeros when passed as string', () => {
      expect(formatCurrencyPreserve('1250.00')).toBe('₹1,250.00');
      expect(formatCurrencyPreserve('1250.50')).toBe('₹1,250.50');
      expect(formatCurrencyPreserve('1250.004')).toBe('₹1,250.004');
    });

    it('preserves excess decimals beyond 2 places', () => {
      expect(formatCurrencyPreserve('1250.004')).toBe('₹1,250.004');
      expect(formatCurrencyPreserve('1250.123456')).toBe('₹1,250.123456');
    });

    it('preserves single decimal places', () => {
      expect(formatCurrencyPreserve('1250.4')).toBe('₹1,250.4');
      expect(formatCurrencyPreserve('1250.0')).toBe('₹1,250.0');
    });

    it('does NOT reconstruct lost trailing zeros from JSON number parsing', () => {
      // JSON parses "1250.00" as 1250 (number), losing trailing zeros
      expect(formatCurrencyPreserve(1250.00)).toBe('₹1,250');
      // But passes through the exact decimal when it exists
      expect(formatCurrencyPreserve(1250.004)).toBe('₹1,250.004');
    });
  });

  describe('edge cases and invalid input', () => {
    it('returns em dash for null, undefined, or empty', () => {
      expect(formatCurrencyPreserve(null)).toBe('—');
      expect(formatCurrencyPreserve(undefined)).toBe('—');
      expect(formatCurrencyPreserve('')).toBe('—');
    });

    it('returns em dash for NaN', () => {
      expect(formatCurrencyPreserve(NaN)).toBe('—');
      expect(formatCurrencyPreserve('NaN')).toBe('—');
    });

    it('handles negative amounts', () => {
      expect(formatCurrencyPreserve(-1250)).toBe('₹-1,250');
      expect(formatCurrencyPreserve('-1250.50')).toBe('₹-1,250.50');
    });

    it('strips whitespace', () => {
      expect(formatCurrencyPreserve('  1250.50  ')).toBe('₹1,250.50');
    });
  });

  describe('Indian grouping for large amounts', () => {
    it('groups correctly: 1,00,000 (1 lakh)', () => {
      expect(formatCurrencyPreserve(100000)).toBe('₹1,00,000');
    });

    it('groups correctly: 10,00,000 (10 lakh)', () => {
      expect(formatCurrencyPreserve(1000000)).toBe('₹10,00,000');
    });

    it('groups correctly: 1,00,00,000 (1 crore)', () => {
      expect(formatCurrencyPreserve(10000000)).toBe('₹1,00,00,000');
    });

    it('preserves grouping with decimals', () => {
      expect(formatCurrencyPreserve('1234567.89')).toBe('₹12,34,567.89');
    });
  });
});

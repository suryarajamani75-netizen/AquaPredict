import { describe, it, expect } from 'vitest';
import { parseWaterQualityCsv } from '../utils/csv';

describe('Water Quality CSV Parser & Validator', () => {
  it('rejects empty CSV text', () => {
    const result = parseWaterQualityCsv('');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('empty or missing');
  });

  it('rejects CSV with missing required columns', () => {
    const invalidHeaderCsv = `ph,Hardness,Solids\n7.0,200,15000`;
    const result = parseWaterQualityCsv(invalidHeaderCsv);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Missing required column(s)');
  });

  it('successfully parses valid CSV with all 9 parameters', () => {
    const validCsv = `ph,Hardness,Solids,Chloramines,Sulfate,Conductivity,Organic_carbon,Trihalomethanes,Turbidity
7.08,204.89,20791.32,7.30,368.52,564.31,10.38,86.99,2.96
6.50,180.00,15000.00,6.00,300.00,450.00,8.50,70.00,3.10`;

    const result = parseWaterQualityCsv(validCsv);
    expect(result.success).toBe(true);
    expect(result.samples.length).toBe(2);
    expect(result.samples[0].ph).toBe(7.08);
    expect(result.samples[0].Hardness).toBe(204.89);
    expect(result.samples[1].Solids).toBe(15000.0);
  });

  it('correctly handles nullable fields like ph and Sulfate', () => {
    const csvWithNulls = `ph,Hardness,Solids,Chloramines,Sulfate,Conductivity,Organic_carbon,Trihalomethanes,Turbidity
,204.89,20791.32,7.30,,564.31,10.38,,2.96`;

    const result = parseWaterQualityCsv(csvWithNulls);
    expect(result.success).toBe(true);
    expect(result.samples[0].ph).toBeNull();
    expect(result.samples[0].Sulfate).toBeNull();
    expect(result.samples[0].Trihalomethanes).toBeNull();
    expect(result.samples[0].Hardness).toBe(204.89);
  });

  it('flags warning and excludes Potability column if present', () => {
    const csvWithTarget = `ph,Hardness,Solids,Chloramines,Sulfate,Conductivity,Organic_carbon,Trihalomethanes,Turbidity,Potability
7.08,204.89,20791.32,7.30,368.52,564.31,10.38,86.99,2.96,1`;

    const result = parseWaterQualityCsv(csvWithTarget);
    expect(result.success).toBe(true);
    expect(result.warnings.some((w) => w.includes('Potability'))).toBe(true);
    expect((result.samples[0] as unknown as Record<string, unknown>).Potability).toBeUndefined();
  });

  it('enforces maximum 100 records limit', () => {
    const header = 'ph,Hardness,Solids,Chloramines,Sulfate,Conductivity,Organic_carbon,Trihalomethanes,Turbidity';
    const row = '7.0,200,15000,7,300,500,10,80,3';
    const rows = new Array(105).fill(row);
    const csvData = [header, ...rows].join('\n');

    const result = parseWaterQualityCsv(csvData);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('maximum of 100 samples');
  });

  it('reports row validation failure for out-of-bounds parameters', () => {
    const outOfBoundsCsv = `ph,Hardness,Solids,Chloramines,Sulfate,Conductivity,Organic_carbon,Trihalomethanes,Turbidity
19.5,200,15000,7,300,500,10,80,3`;

    const result = parseWaterQualityCsv(outOfBoundsCsv);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('outside acceptable range'))).toBe(true);
  });
});

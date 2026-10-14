import { WaterSampleInput } from '../types';
import { WATER_PARAMETERS } from './constants';

export interface CsvParseResult {
  success: boolean;
  samples: WaterSampleInput[];
  errors: string[];
  warnings: string[];
  totalRows: number;
}

export function parseWaterQualityCsv(csvText: string): CsvParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      success: false,
      samples: [],
      errors: ['The CSV file is empty or missing a header row.'],
      warnings: [],
      totalRows: 0,
    };
  }

  // Parse header
  const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const normalizedHeaders = rawHeaders.map((h) => h.toLowerCase().replace(/[\s_-]+/g, ''));

  // Required features matching canonical backend schema
  const requiredFeatureMap: Record<keyof WaterSampleInput, string> = {
    ph: 'ph',
    Hardness: 'hardness',
    Solids: 'solids',
    Chloramines: 'chloramines',
    Sulfate: 'sulfate',
    Conductivity: 'conductivity',
    Organic_carbon: 'organiccarbon',
    Trihalomethanes: 'trihalomethanes',
    Turbidity: 'turbidity',
  };

  const headerIndices: Partial<Record<keyof WaterSampleInput, number>> = {};
  const missingColumns: string[] = [];

  (Object.keys(requiredFeatureMap) as Array<keyof WaterSampleInput>).forEach((key) => {
    const targetNorm = requiredFeatureMap[key];
    const idx = normalizedHeaders.findIndex((h) => h === targetNorm);
    if (idx === -1) {
      missingColumns.push(key);
    } else {
      headerIndices[key] = idx;
    }
  });

  if (missingColumns.length > 0) {
    return {
      success: false,
      samples: [],
      errors: [
        `Missing required column(s): ${missingColumns.join(', ')}. ` +
        `Expected all 9 parameters: ph, Hardness, Solids, Chloramines, Sulfate, Conductivity, Organic_carbon, Trihalomethanes, Turbidity.`,
      ],
      warnings: [],
      totalRows: lines.length - 1,
    };
  }

  const warnings: string[] = [];
  // Notice if Potability was in header
  if (normalizedHeaders.includes('potability')) {
    warnings.push('Column "Potability" detected in CSV and automatically excluded to comply with backend prediction schema.');
  }

  const dataRows = lines.slice(1);
  if (dataRows.length > 100) {
    return {
      success: false,
      samples: [],
      errors: [
        `The file contains ${dataRows.length} sample rows. The backend batch assessment endpoint accepts a maximum of 100 samples per request. ` +
        `Please reduce the file to 100 rows or fewer.`,
      ],
      warnings,
      totalRows: dataRows.length,
    };
  }

  const samples: WaterSampleInput[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, rowIdx) => {
    const rowNum = rowIdx + 2; // 1-indexed including header
    const cells = row.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

    const sampleObj: Partial<WaterSampleInput> = {};
    let rowHasError = false;

    for (const param of WATER_PARAMETERS) {
      const colIdx = headerIndices[param.key]!;
      const rawVal = cells[colIdx];

      if (rawVal === undefined || rawVal === '' || rawVal.toLowerCase() === 'null' || rawVal.toLowerCase() === 'nan') {
        if (param.nullable) {
          (sampleObj as Record<string, unknown>)[param.key] = null;
        } else {
          errors.push(`Row ${rowNum}: Required field "${param.key}" is missing or empty.`);
          rowHasError = true;
        }
      } else {
        const num = Number(rawVal);
        if (isNaN(num) || !isFinite(num)) {
          errors.push(`Row ${rowNum}: Field "${param.key}" has non-numeric value "${rawVal}".`);
          rowHasError = true;
        } else if (num < param.min || num > param.max) {
          errors.push(
            `Row ${rowNum}: Field "${param.key}" value ${num} is outside acceptable range [${param.min}, ${param.max}].`
          );
          rowHasError = true;
        } else {
          (sampleObj as Record<string, unknown>)[param.key] = num;
        }
      }
    }

    if (!rowHasError) {
      samples.push(sampleObj as WaterSampleInput);
    }
  });

  if (errors.length > 0) {
    return {
      success: false,
      samples: [],
      errors: [
        `Batch validation failed with ${errors.length} error(s). Because the backend enforces atomic validation, all records must be valid.`,
        ...errors.slice(0, 10), // show up to first 10 errors
        ...(errors.length > 10 ? [`... and ${errors.length - 10} more error(s)`] : []),
      ],
      warnings,
      totalRows: dataRows.length,
    };
  }

  return {
    success: true,
    samples,
    errors: [],
    warnings,
    totalRows: dataRows.length,
  };
}

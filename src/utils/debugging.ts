import { z } from "zod";

/**
 * Validates an array of objects against a Zod schema
 * @param objects - The array of objects to validate
 * @param schema - The Zod schema to validate against
 * @throws {Error} If validation fails
 */
export function checkObjectsAgainstSchema<T>(
  objects: unknown[],
  schema: z.ZodType<T>,
): void {
  for (const object of objects) {
    try {
      schema.parse(object);
    } catch (error) {
      console.error("Schema validation failed:", error);
      throw error;
    }
  }
}

interface PrintDistinctPropertyValuesOptions {
  omit?: string[];
}

/**
 * Prints distinct values for each property in an array of objects
 * Useful for debugging API responses
 * @param objects - The array of objects to analyze
 * @param options - Options for printing
 */
export function printDistinctPropertyValues<T extends Record<string, unknown>>(
  objects: T[],
  options: PrintDistinctPropertyValuesOptions = {},
): void {
  const { omit = [] } = options;
  const propertyValues: Record<string, Set<unknown>> = {};

  // Collect all distinct property values
  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      if (omit.includes(key)) continue;

      if (!propertyValues[key]) {
        propertyValues[key] = new Set();
      }

      const value = obj[key];
      if (typeof value === "object" && value !== null) {
        propertyValues[key].add(JSON.stringify(value));
      } else {
        propertyValues[key].add(value);
      }
    }
  }

  // Print distinct values for each property
  for (const [key, values] of Object.entries(propertyValues)) {
    console.log(`${key}: ${Array.from(values).join(", ")}`);
  }
}

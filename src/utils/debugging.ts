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

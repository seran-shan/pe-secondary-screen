/**
 * Utility functions for sponsor name processing and matching
 */

/**
 * Normalizes a sponsor name for fuzzy matching by:
 * - Converting to lowercase
 * - Removing common punctuation and spaces
 * - Removing common business suffixes
 * - Trimming whitespace
 */
export function normalizeSponsorName(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      // Remove common punctuation and normalize spaces
      .replace(/[&\-\.,\s]+/g, " ")
      .replace(/\s+/g, " ")
      // Remove common business entity suffixes
      .replace(
        /\b(capital|partners?|ventures?|investments?|management|advisors?|fund|funds|lp|llc|inc|ltd|corporation|corp|company|co|group|holdings?|associates?|asset|assets)\b/g,
        "",
      )
      // Remove Roman numerals (for funds like "Fund II", "Fund III")
      .replace(/\b(i{1,3}|iv|v|vi{1,3}|ix|x)\b/g, "")
      // Clean up extra spaces and trim
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Calculates a simple similarity score between two strings
 * Returns a value between 0 (no similarity) and 1 (identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Exact match
  if (s1 === s2) return 1;

  // Calculate Jaccard similarity using character bigrams
  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);

  const intersection = bigrams1.filter((bigram) => bigrams2.includes(bigram));
  const union = [...new Set([...bigrams1, ...bigrams2])];

  return intersection.length / union.length;
}

/**
 * Gets character bigrams from a string
 */
function getBigrams(str: string): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.push(str.slice(i, i + 2));
  }
  return bigrams;
}

/**
 * Checks if two sponsor names are potentially duplicates
 * Uses multiple strategies for robust matching
 */
export function isPotentialDuplicate(
  name1: string,
  name2: string,
  threshold = 0.8,
): boolean {
  // Exact match (case insensitive)
  if (name1.toLowerCase() === name2.toLowerCase()) {
    return true;
  }

  // Normalized name match
  const normalized1 = normalizeSponsorName(name1);
  const normalized2 = normalizeSponsorName(name2);

  if (normalized1 === normalized2 && normalized1.length > 2) {
    return true;
  }

  // Similarity check
  const similarity = calculateSimilarity(name1, name2);
  if (similarity >= threshold) {
    return true;
  }

  // Check if one name contains the other (for cases like "Acme Capital" vs "Acme Capital Partners")
  const shorter = name1.length < name2.length ? name1 : name2;
  const longer = name1.length >= name2.length ? name1 : name2;

  if (
    longer.toLowerCase().includes(shorter.toLowerCase()) &&
    shorter.length > 3
  ) {
    return true;
  }

  return false;
}

/**
 * Finds similar sponsor names from a list
 */
export function findSimilarNames(
  targetName: string,
  existingNames: string[],
  threshold = 0.7,
): Array<{ name: string; similarity: number }> {
  return existingNames
    .map((name) => ({
      name,
      similarity: calculateSimilarity(targetName, name),
    }))
    .filter(({ similarity }) => similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Validates a sponsor name format
 */
export function validateSponsorName(name: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push("Sponsor name is required");
  }

  if (name.length < 2) {
    errors.push("Sponsor name must be at least 2 characters");
  }

  if (name.length > 100) {
    errors.push("Sponsor name must be less than 100 characters");
  }

  const invalidChars = name.match(/[^\p{L}\p{N}\s&\-\.,()]/gu);
  if (invalidChars) {
    errors.push(`Invalid characters found: ${invalidChars.join(", ")}`);
  }

  // Check for suspicious patterns
  if (/^\d+$/.test(name.trim())) {
    errors.push("Sponsor name cannot be only numbers");
  }

  if (name.trim().split(/\s+/).length === 1 && name.length < 3) {
    errors.push("Single word sponsor names should be at least 3 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

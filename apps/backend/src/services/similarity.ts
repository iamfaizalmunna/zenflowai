/**
 * Dice coefficient on character bigrams — same family as NaturalNode/natural (MIT).
 * Used for near-duplicate spam scoring without pulling the full NLP package into every test.
 */
export function diceCoefficient(left: string, right: string): number {
  const a = normalize(left);
  const b = normalize(right);
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const aGrams = bigrams(a);
  const bGrams = bigrams(b);
  let overlap = 0;
  const bCopy = [...bGrams];
  aGrams.forEach((gram) => {
    const i = bCopy.indexOf(gram);
    if (i === -1) return;
    overlap += 1;
    bCopy.splice(i, 1);
  });
  return (2 * overlap) / (aGrams.length + bGrams.length);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function bigrams(value: string): string[] {
  const grams: string[] = [];
  for (let i = 0; i < value.length - 1; i += 1) {
    grams.push(value.slice(i, i + 2));
  }
  return grams;
}

export function isNearDuplicate(left: string, right: string, threshold = 0.8): boolean {
  return diceCoefficient(left, right) >= threshold;
}

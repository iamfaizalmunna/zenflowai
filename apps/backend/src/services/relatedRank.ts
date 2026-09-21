const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'have', 'your', 'you', 'are']);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export function articleRelevanceScore(
  ticketText: string,
  article: { title: string; body: string; categoryId?: number | null },
  ticketCategoryId?: number | null
): number {
  const hay = new Set(tokenize(ticketText));
  const needle = tokenize(`${article.title} ${article.body.slice(0, 800)}`);
  if (hay.size === 0 || needle.length === 0) {
    return ticketCategoryId && article.categoryId === ticketCategoryId ? 1 : 0;
  }
  const hits = needle.filter((w) => hay.has(w)).length;
  const categoryBonus = ticketCategoryId && article.categoryId === ticketCategoryId ? 3 : 0;
  return hits + categoryBonus;
}

export function rankRelatedArticles<T extends { title: string; body: string; categoryId?: number | null }>(
  ticketText: string,
  articles: T[],
  ticketCategoryId?: number | null,
  limit = 5
): T[] {
  return [...articles]
    .map((article) => ({ article, score: articleRelevanceScore(ticketText, article, ticketCategoryId) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.article);
}

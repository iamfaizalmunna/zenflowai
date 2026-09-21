export interface RoutingRuleMatch {
  id: number;
  type: string;
  keyword: string | null;
  categoryId: number | null;
  priority: string | null;
}

export function matchRoutingRule<T extends RoutingRuleMatch>(
  rules: T[],
  input: {
    title: string;
    description: string;
    categoryId?: number | null;
    priority: string;
  }
): T | null {
  const haystack = `${input.title} ${input.description}`.toLowerCase();
  const matched = rules.find((rule) => {
    if (rule.type === 'KEYWORD' && rule.keyword) {
      return haystack.includes(rule.keyword.toLowerCase());
    }
    if (rule.type === 'CATEGORY' && input.categoryId && rule.categoryId === input.categoryId) {
      return true;
    }
    if (rule.type === 'PRIORITY' && rule.priority === input.priority) {
      return true;
    }
    return false;
  });
  return matched ?? rules.find((rule) => rule.type === 'FALLBACK') ?? null;
}

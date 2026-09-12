import { prisma } from "@/lib/prisma";

/**
 * Ridge Oasis search: fuzzy, synonym- and tag-aware relevance ranking over
 * published resources. Not a full-text index (Phase 1) — good enough for a
 * few hundred resources; swap for SQLite FTS5 or a hosted search engine once
 * the corpus grows past a few thousand.
 */

const STOPWORDS = new Set(["a", "an", "the", "how", "do", "i", "to", "on", "for", "of"]);

function stem(word: string): string {
  const w = word.toLowerCase();
  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";
  if (w.endsWith("es") && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) return w.slice(0, -1);
  if (w.endsWith("ing") && w.length > 5) return w.slice(0, -3);
  if (w.endsWith("ed") && w.length > 4) return w.slice(0, -2);
  return w;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

async function expandWithSynonyms(tokens: string[]): Promise<Set<string>> {
  const expanded = new Set(tokens);
  const synonyms = await prisma.synonym.findMany();
  for (const token of tokens) {
    for (const syn of synonyms) {
      const a = stem(syn.term);
      const b = stem(syn.synonym);
      if (a === token) expanded.add(b);
      if (b === token) expanded.add(a);
    }
  }
  return expanded;
}

export interface SearchResultItem {
  id: string;
  title: string;
  description: string | null;
  categoryName: string;
  resourceType: string;
  score: number;
  matchedOn: string[];
}

export async function searchResources(query: string): Promise<SearchResultItem[]> {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];
  const expandedTokens = await expandWithSynonyms(queryTokens);

  const resources = await prisma.resource.findMany({
    where: { status: "PUBLISHED" },
    include: { category: true, tags: { include: { tag: true } } },
  });

  const results: SearchResultItem[] = [];

  for (const resource of resources) {
    const titleTokens = new Set(tokenize(resource.title));
    const descTokens = new Set(tokenize(resource.description ?? ""));
    const tagTokens = new Set(resource.tags.flatMap((rt) => tokenize(rt.tag.name)));
    const contentTokens = new Set(tokenize(resource.content ?? ""));

    let score = 0;
    const matchedOn = new Set<string>();

    for (const token of expandedTokens) {
      if (titleTokens.has(token)) {
        score += 5;
        matchedOn.add(token);
      } else if (
        token.length >= 3 &&
        [...titleTokens].some((t) => t.length >= 3 && (t.includes(token) || token.includes(t)))
      ) {
        score += 3;
        matchedOn.add(token);
      }
      if (tagTokens.has(token)) {
        score += 3;
        matchedOn.add(token);
      }
      if (descTokens.has(token)) {
        score += 2;
        matchedOn.add(token);
      }
      if (contentTokens.has(token)) {
        score += 1;
        matchedOn.add(token);
      }
    }

    if (score > 0) {
      results.push({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        categoryName: resource.category.name,
        resourceType: resource.resourceType,
        score,
        matchedOn: [...matchedOn],
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

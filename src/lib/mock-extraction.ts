import type { MemoryCategory, MemoryLink, MemoryNode } from "@/lib/memories";

export type ExtractionResult = {
  memories: MemoryNode[];
  relationships: MemoryLink[];
};

function titleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function memoryId(text: string) {
  return `memory-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

/** Temporary local stand-in for the FastAPI extraction endpoint. */
export async function extractMemoriesMock(message: string, existing: MemoryNode[]): Promise<ExtractionResult> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const candidates: Array<{ text: string; category: MemoryCategory; relationship: string }> = [];
  const standing = message.match(/\b(?:i am|i'm|im)\s+(?:a|an)\s+(freshman|first[- ]year|sophomore|junior|senior)\b/i);
  if (standing) {
    const text = standing[1].toLowerCase().includes("first") ? "First-year" : titleCase(standing[1]);
    candidates.push({ text, category: "Education", relationship: "class standing" });
  }

  const studiesAt = message.match(/\bstudying\s+(.+?)\s+at\s+([A-Z][\w&.' -]*?)(?:[.!?,]|$)/i);
  if (studiesAt) {
    const field = titleCase(studiesAt[1]);
    const schoolName = titleCase(studiesAt[2]);
    const school = /\bbrown\b/i.test(schoolName) && !/university/i.test(schoolName)
      ? `${schoolName} University`
      : schoolName;
    candidates.push({ text: field, category: "Education", relationship: "studies" });
    candidates.push({ text: school, category: "Education", relationship: "attends" });
  }

  const careerGoal = message.match(/\b(?:want|hope|plan|aim)\s+to\s+become\s+(?:a|an)\s+(.+?)(?:[.!?,]|$)/i);
  if (careerGoal) {
    candidates.push({ text: titleCase(careerGoal[1]), category: "Goals", relationship: "career goal" });
  }

  const liveIn = message.match(/\bi\s+live\s+in\s+(.+?)(?:[.!?,]|$)/i);
  if (liveIn) {
    candidates.push({ text: `Lives in ${titleCase(liveIn[1])}`, category: "Profile", relationship: "lives in" });
  }

  const existingTexts = new Set(existing.map((memory) => memory.text.toLowerCase()));
  const seen = new Set<string>();
  const memories = candidates
    .filter((candidate) => {
      const normalized = candidate.text.toLowerCase();
      if (existingTexts.has(normalized) || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .map(({ text, category }) => ({
      id: memoryId(text),
      text,
      category,
      source: message.trim(),
    }));

  const relationshipByText = new Map(candidates.map((candidate) => [candidate.text.toLowerCase(), candidate.relationship]));
  return {
    memories,
    relationships: memories.map((memory) => ({
      source: "user",
      target: memory.id,
      relationship: relationshipByText.get(memory.text.toLowerCase()) ?? "related to",
    })),
  };
}

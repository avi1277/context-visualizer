export type MemoryCategory = "Profile" | "Education" | "Goals";

export type MemoryNode = {
  id: string;
  text: string;
  category: MemoryCategory;
  source: string;
};

export type MemoryLink = {
  source: string;
  target: string;
  relationship: string;
};

export const sampleMemories: MemoryNode[] = [
  {
    id: "user",
    text: "You",
    category: "Profile",
    source: "The person chatting with the assistant.",
  },
  {
    id: "brown",
    text: "Brown University",
    category: "Education",
    source: "I'm a sophomore studying Computer Engineering at Brown.",
  },
  {
    id: "computer-engineering",
    text: "Computer Engineering",
    category: "Education",
    source: "I'm a sophomore studying Computer Engineering at Brown.",
  },
  {
    id: "sophomore",
    text: "Sophomore",
    category: "Education",
    source: "I'm a sophomore studying Computer Engineering at Brown.",
  },
  {
    id: "product-management",
    text: "Product Management",
    category: "Goals",
    source: "I want to become a Product Manager.",
  },
];

export const sampleRelationships: MemoryLink[] = [
  { source: "user", target: "brown", relationship: "attends" },
  { source: "user", target: "computer-engineering", relationship: "studies" },
  { source: "user", target: "sophomore", relationship: "is a" },
  { source: "user", target: "product-management", relationship: "career goal" },
];

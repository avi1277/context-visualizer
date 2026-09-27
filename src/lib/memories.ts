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

export const userNode: MemoryNode = {
  id: "user",
  text: "You",
  category: "Profile",
  source: "The person chatting with the assistant.",
};

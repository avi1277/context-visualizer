import type { ContextSnapshot, MessageResponse } from "@/lib/context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (data?.detail) return String(data.detail);
  } catch {}
  return `${fallback} (${res.status})`;
}

export async function getContext(): Promise<ContextSnapshot> {
  const res = await fetch(`${API_BASE}/context`);
  if (!res.ok) {
    const msg = await parseErrorMessage(res, "Failed to load context");
    throw new Error(msg);
  }
  return res.json();
}

export async function sendMessage(message: string): Promise<MessageResponse> {
  const res = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res, "Message failed");
    throw new Error(msg);
  }
  return res.json();
}

export async function deleteMemoryApi(
  memoryId: string,
): Promise<{ context: ContextSnapshot }> {
  const res = await fetch(`${API_BASE}/memories/${memoryId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res, "Delete failed");
    throw new Error(msg);
  }
  return res.json();
}

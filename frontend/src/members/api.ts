import type { AddMemberResponse } from "@ttapp/shared";

// The backend answers errors as { error } or, for bad input, { error, problems: [...] }.
// This picks the most specific message to show.
export async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as {
      error?: string;
      problems?: { message: string }[];
    };
    return body.problems?.[0]?.message ?? body.error ?? "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

export type AddMemberResult =
  | { ok: true; email: string; restored: boolean }
  | { ok: false; message: string };

// POST /api/members. The backend trims and lowercases the email, and checks it.
export async function addMember(email: string): Promise<AddMemberResult> {
  try {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return { ok: false, message: await readError(res) };
    const body = (await res.json()) as AddMemberResponse;
    return { ok: true, email: body.email, restored: body.restored };
  } catch {
    return { ok: false, message: "Can't reach the server." };
  }
}

export type RemoveMemberResult = { ok: true } | { ok: false; message: string };

// DELETE /api/members/:id. The backend signs them out and keeps their history.
export async function removeMember(id: string): Promise<RemoveMemberResult> {
  try {
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (res.ok) return { ok: true };
    return { ok: false, message: await readError(res) };
  } catch {
    return { ok: false, message: "Can't reach the server." };
  }
}

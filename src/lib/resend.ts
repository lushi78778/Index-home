import "server-only"

const RESEND_AUDIENCES_ENDPOINT = "https://api.resend.com/audiences"

export type AddAudienceContactInput = {
  email: string
  audienceId: string
  apiKey: string
}

export async function addAudienceContact({
  email,
  audienceId,
  apiKey,
}: AddAudienceContactInput): Promise<{ ok: true } | { ok: false; detail: string }> {
  const res = await fetch(`${RESEND_AUDIENCES_ENDPOINT}/${audienceId}/contacts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })
  if (res.status === 409) return { ok: true }
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    return { ok: false, detail }
  }
  return { ok: true }
}

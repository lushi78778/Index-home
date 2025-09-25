// Handle Chrome DevTools probing path to avoid 500 in dev
export function GET() {
  // Return 404 with an empty JSON body so tools don't fail the request noisily
  return new Response('{}', {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  })
}

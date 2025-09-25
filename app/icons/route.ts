export const runtime = 'edge'

export async function GET() {
  const body = {
    error: 'Please request a specific icon size route',
    options: ['/icons/icon-192.png', '/icons/icon-512.png'],
  }
  return new Response(JSON.stringify(body), {
    status: 404,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

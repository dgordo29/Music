// SunoAPI requires a callBackUrl on every task. The app polls for results instead,
// so this endpoint simply acknowledges the webhook and discards the payload.
export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Suno Studio callback endpoint', { status: 200 });
  }
  try { await req.text(); } catch { /* ignore */ }
  return Response.json({ status: 'received' });
};

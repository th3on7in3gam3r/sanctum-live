/**
 * Website "Request a pastoral booking" form → PLCC Canaan's Pastor's Office.
 * The browser talks to this site only; this server forwards to Canaan, passing the
 * visitor's address so Canaan can slow down floods.
 */
const origin = () => (process.env.PLCC_API_ORIGIN || 'https://plcc-opal.vercel.app').replace(/\/+$/, '');
const target = () => `${origin()}/api/vault?resource=pastors-office-website`;
const noStore = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const r = await fetch(target(), { cache: 'no-store', signal: AbortSignal.timeout(6000) });
    const data = (await r.json().catch(() => null)) as { offices?: unknown } | null;
    const offices = Array.isArray(data?.offices)
      ? data.offices
          .filter((o): o is { id: string; pastorName: string } => Boolean(o && typeof o.id === 'string' && typeof o.pastorName === 'string'))
          .map((o) => ({ id: o.id, pastorName: o.pastorName }))
      : [];
    return Response.json({ ok: true, offices }, { headers: noStore });
  } catch {
    return Response.json({ ok: true, offices: [] }, { headers: noStore });
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 6000) return Response.json({ ok: false, error: 'Request is too large.' }, { status: 413, headers: noStore });
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('bad');
    body = parsed as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: 'Invalid request.' }, { status: 400, headers: noStore });
  }
  const pick = (k: string, max: number) => (typeof body[k] === 'string' ? (body[k] as string).slice(0, max) : undefined);
  const forward = {
    fullName: pick('fullName', 120),
    service: pick('service', 20),
    phone: pick('phone', 40),
    email: pick('email', 254),
    preferredStart: pick('preferredStart', 40),
    timeZone: pick('timeZone', 80),
    officeId: pick('officeId', 40),
    message: pick('message', 1000),
    website: pick('website', 200),
  };
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || '';
  try {
    const r = await fetch(target(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(ip ? { 'x-plcc-visitor-ip': ip } : {}) },
      body: JSON.stringify(forward),
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    const data = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (r.ok && data?.ok) return Response.json({ ok: true }, { headers: noStore });
    const status = [400, 413, 429].includes(r.status) ? r.status : 503;
    return Response.json({ ok: false, error: typeof data?.error === 'string' ? data.error : null }, { status, headers: noStore });
  } catch {
    return Response.json({ ok: false, error: null }, { status: 503, headers: noStore });
  }
}

import { getJordanLive, getLive } from '@/lib/api';

export async function GET() {
  const [jordanLive, sanctum] = await Promise.all([getJordanLive(), getLive()]);
  return Response.json({
    live: jordanLive || Boolean(sanctum?.rooms.some((room) => room.status === 'LIVE')),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

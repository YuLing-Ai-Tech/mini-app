import { NextResponse } from 'next/server';
import { loadDeck } from '@/lib/ppt/storage';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  const code = (await context.params).code.toUpperCase();
  if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(code)) {
    return NextResponse.json({ error: '分享码格式不正确' }, { status: 404 });
  }
  try {
    const deck = await loadDeck(code);
    if (deck.status === 'missing') return NextResponse.json({ error: '未找到课件' }, { status: 404 });
    if (deck.status === 'expired') return NextResponse.json({ error: '课件已过期' }, { status: 410 });
    return new NextResponse(Buffer.from(deck.html), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:;",
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: '读取课件失败' }, { status: 502 });
  }
}

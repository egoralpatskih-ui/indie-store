import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const filename = request.nextUrl.searchParams.get('filename') || 'game.zip';

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // 🔥 ПРОВЕРЕННЫЙ СПОСОБ: fetch без лишних заголовков
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText);
      return NextResponse.json({ error: `Failed to fetch: ${response.status}` }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Download error:', error.message);
    return NextResponse.json({ error: `Download failed: ${error.message}` }, { status: 500 });
  }
}
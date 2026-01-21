import { NextResponse } from 'next/server';
import { getAllFifoData } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

// GET /api/fifo/list?page=1&pageSize=15 - Lista todos os QRCodes com paginação
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '15', 10);

    try {
        const result = await getAllFifoData(page, pageSize);
        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600',
            },
        });
    } catch (error) {
        console.error('Error listing FIFO data:', error);
        return NextResponse.json({ error: 'Erro ao listar dados' }, { status: 500 });
    }
}

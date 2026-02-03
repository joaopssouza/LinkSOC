import { NextResponse } from 'next/server';
import { getPrintHistory } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

// GET /api/fifo/history - Retorna histórico de impressões
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

        const result = await getPrintHistory(page, pageSize);

        return NextResponse.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error fetching print history:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar histórico' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { getReprintLabels, clearReprintQueue } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

// GET /api/fifo/reprint - Busca etiquetas na fila de reimpressão
export async function GET() {
    try {
        const result = await getReprintLabels();

        return NextResponse.json({
            success: true,
            found: result.found,
            notFound: result.notFound,
            total: result.total
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Error fetching reprint queue:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar fila de reimpressão' },
            { status: 500 }
        );
    }
}

// POST /api/fifo/reprint - Limpa itens da fila após impressão
// Body: { ids?: string[] } - Se vazio, limpa tudo
export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const ids = body.ids as string[] | undefined;

        const result = await clearReprintQueue(ids);

        return NextResponse.json({
            success: result.success,
            cleared: result.cleared
        });
    } catch (error) {
        console.error('Error clearing reprint queue:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao limpar fila de reimpressão' },
            { status: 500 }
        );
    }
}

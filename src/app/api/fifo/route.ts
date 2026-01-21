import { NextResponse } from 'next/server';
import { getFifoByScanId, getFifoByMultipleIds } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

// GET /api/fifo?id=XXX - Busca uma etiqueta por ID_UM ou ID_DOIS
// GET /api/fifo?ids=XXX,YYY,ZZZ - Busca múltiplas etiquetas (para impressão em lote)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    try {
        // Busca múltipla (lote)
        if (ids) {
            const idList = ids.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
            const { found, notFound } = await getFifoByMultipleIds(idList);
            return NextResponse.json({
                found: found.length > 0,
                count: found.length,
                notFoundCount: notFound.length,
                data: found,
                notFoundIds: notFound
            });
        }

        // Busca única
        if (id) {
            const data = await getFifoByScanId(id);
            if (data) {
                return NextResponse.json({ found: true, data });
            } else {
                return NextResponse.json({ found: false, message: 'ID não encontrado' });
            }
        }

        return NextResponse.json({ error: 'Parâmetro id ou ids é obrigatório' }, { status: 400 });
    } catch (error) {
        console.error('Error fetching FIFO data:', error);
        return NextResponse.json({ found: false, error: 'Erro interno do servidor' }, { status: 500 });
    }
}

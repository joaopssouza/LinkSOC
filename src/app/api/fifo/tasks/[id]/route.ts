import { NextResponse } from 'next/server';
import { getTaskLabels } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

// GET /api/fifo/tasks/[id] - Busca etiquetas de uma tarefa
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID da tarefa não informado' },
                { status: 400 }
            );
        }

        const result = await getTaskLabels(id);

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
        console.error('Error fetching task labels:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar etiquetas da tarefa' },
            { status: 500 }
        );
    }
}

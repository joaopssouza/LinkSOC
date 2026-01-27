import { NextResponse } from 'next/server';
import { createBatchQRCodes, GenerateMode } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

// POST /api/fifo/create - Gera etiquetas em massa
// Body: { quantity: number, mode?: 'sequential' | 'random' }
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const quantity = parseInt(body.quantity, 10);
        const mode: GenerateMode = body.mode === 'random' ? 'random' : 'sequential';

        if (isNaN(quantity) || quantity < 1 || quantity > 100) {
            return NextResponse.json(
                { error: 'Quantidade deve ser entre 1 e 100' },
                { status: 400 }
            );
        }

        const newLabels = await createBatchQRCodes(quantity, mode);

        return NextResponse.json({
            success: true,
            count: newLabels.length,
            mode,
            data: newLabels
        });
    } catch (error) {
        console.error('Error creating FIFO labels:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao criar etiquetas' },
            { status: 500 }
        );
    }
}

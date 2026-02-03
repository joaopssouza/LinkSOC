import { NextResponse } from 'next/server';
import { markAsPrinted } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

// POST /api/fifo/print - Marca etiquetas como impressas
export async function POST(request: Request) {
    try {
        const { qrcodes } = await request.json();

        if (!qrcodes || !Array.isArray(qrcodes) || qrcodes.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Lista de QRCodes não informada' },
                { status: 400 }
            );
        }

        const result = await markAsPrinted(qrcodes);

        return NextResponse.json({
            success: true,
            marked: result.marked
        });
    } catch (error) {
        console.error('Error marking as printed:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao marcar como impresso' },
            { status: 500 }
        );
    }
}

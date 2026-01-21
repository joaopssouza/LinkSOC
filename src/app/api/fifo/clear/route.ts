import { NextResponse } from 'next/server';
import { clearIdFromQRCode } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

// POST /api/fifo/clear - Limpa ID_UM e ID_DOIS de um QRCode
// Body: { qrcode: string }
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { qrcode } = body;

        if (!qrcode) {
            return NextResponse.json(
                { error: 'QRCode é obrigatório' },
                { status: 400 }
            );
        }

        const result = await clearIdFromQRCode(qrcode);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'IDs removidos com sucesso'
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.error || 'Erro ao limpar IDs' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error clearing IDs:', error);
        return NextResponse.json(
            { success: false, error: 'Erro de conexão com o servidor' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { linkIdToQRCode } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

// POST /api/fifo/link - Vincula IDs a um QRCode existente
// Body: { qrcode: string, id_um?: string, id_dois?: string }
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { qrcode, id_um, id_dois } = body;

        if (!qrcode) {
            return NextResponse.json(
                { error: 'QRCode é obrigatório' },
                { status: 400 }
            );
        }

        if (!id_um && !id_dois) {
            return NextResponse.json(
                { error: 'Pelo menos um ID (ID_UM ou ID_DOIS) deve ser informado' },
                { status: 400 }
            );
        }

        const result = await linkIdToQRCode(qrcode, id_um, id_dois);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'IDs vinculados com sucesso'
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.error || 'Erro ao vincular' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error linking IDs:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao vincular IDs' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { doc, loadSheet } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

// POST /api/fifo/update - Atualiza ID_UM e ID_DOIS de uma gaiola
export async function POST(request: Request) {
    try {
        const { qrcode, id_um, id_dois } = await request.json();

        if (!qrcode) {
            return NextResponse.json(
                { success: false, error: 'QRCode não informado' },
                { status: 400 }
            );
        }

        await loadSheet();
        const sheet = doc.sheetsByTitle['ID_GAIOLA'] || doc.sheetsByTitle['FIFO'] || doc.sheetsByIndex[1];
        const rows = await sheet.getRows();

        // Encontrar a linha com o QRCode
        const row = rows.find((r: any) =>
            (r.get('QRCode') || r.get(sheet.headerValues[0]) || '').toUpperCase() === qrcode.toUpperCase()
        );

        if (!row) {
            return NextResponse.json(
                { success: false, error: 'QRCode não encontrado' },
                { status: 404 }
            );
        }

        // Atualizar os valores
        row.set('ID_UM', id_um || '');
        row.set('ID_DOIS', id_dois || '');
        await row.save();

        return NextResponse.json({
            success: true,
            data: {
                qrcode: row.get('QRCode') || row.get(sheet.headerValues[0]) || '',
                id_um: row.get('ID_UM') || '',
                id_dois: row.get('ID_DOIS') || '',
                serie: row.get('Serie') || row.get('SERIE') || ''
            }
        });
    } catch (error) {
        console.error('Error updating label:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar etiqueta' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { fetchRegrasFromSheet } from '@/lib/googleSheets';

// Força a renderização dinâmica para sempre buscar dados novos
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const regras = await fetchRegrasFromSheet();
        return NextResponse.json(regras);
    } catch (err) {
        console.error('Error fetching rules:', err);
        return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }
}

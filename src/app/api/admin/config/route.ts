import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppConfig, updateAppConfigEntries } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

const isAuthorized = async () => {
    const cookieStore = await cookies();
    return cookieStore.get('admin_auth')?.value === 'true';
};

export async function GET() {
    if (!await isAuthorized()) {
        return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const config = await getAppConfig();
    return NextResponse.json(config, {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
    });
}

export async function POST(request: Request) {
    if (!await isAuthorized()) {
        return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const entries = body.entries as Record<string, boolean | string> | undefined;

        if (!entries || typeof entries !== 'object') {
            return NextResponse.json({ error: 'Payload invalido' }, { status: 400 });
        }

        const updated = await updateAppConfigEntries(entries);
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Erro ao atualizar config do app:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

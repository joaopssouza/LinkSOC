import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateFifoPassword } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

const isAuthorized = async () => {
    const cookieStore = await cookies();
    return cookieStore.get('admin_auth')?.value === 'true';
};

export async function POST(request: Request) {
    if (!await isAuthorized()) {
        return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const { password } = body;

        if (typeof password !== 'string' || password.trim() === '') {
            return NextResponse.json({ error: 'Senha invalida ou vazia' }, { status: 400 });
        }

        const success = await updateFifoPassword(password.trim());

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Falha ao atualizar a senha' }, { status: 500 });
        }
    } catch (error) {
        console.error('Erro na API /api/admin/fifo-password:', error);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}

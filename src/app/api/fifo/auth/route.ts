import { NextResponse } from 'next/server';
import { validateFifoPassword } from '@/lib/googleSheets';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { password } = body;

        if (!password || typeof password !== 'string') {
            return NextResponse.json({ valid: false, error: 'Senha não informada' }, { status: 400 });
        }

        const isValid = await validateFifoPassword(password);

        return NextResponse.json({ valid: isValid });
    } catch (error) {
        console.error('Erro na autenticação FIFO:', error);
        return NextResponse.json({ valid: false, error: 'Erro interno' }, { status: 500 });
    }
}

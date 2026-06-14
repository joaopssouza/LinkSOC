import { NextResponse } from 'next/server';
import { validateAdminPassword } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { password } = body;

        if (!password || typeof password !== 'string') {
            return NextResponse.json({ valid: false, error: 'Senha não informada' }, { status: 400 });
        }

        const isValid = await validateAdminPassword(password);

        if (!isValid) {
            return NextResponse.json({ valid: false, error: 'Senha incorreta' }, { status: 401 });
        }

        const response = NextResponse.json({ valid: true });
        response.cookies.set('admin_auth', 'true', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 8,
            path: '/'
        });

        return response;
    } catch (error) {
        console.error('Erro na autenticação ADMIN:', error);
        return NextResponse.json({ valid: false, error: 'Erro interno' }, { status: 500 });
    }
}

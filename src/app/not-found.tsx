'use client';

import Link from 'next/link';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-900 dark:to-neutral-800 flex flex-col items-center justify-center p-8">
            {/* Logo/Ícone */}
            <div className="mb-8">
                <div className="w-24 h-24 bg-shopee-primary/10 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-12 h-12 text-shopee-primary" />
                </div>
            </div>

            {/* Código de Erro */}
            <h1 className="text-8xl font-bold text-shopee-primary mb-4">404</h1>

            {/* Mensagem */}
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Página não encontrada
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
                A página que você está procurando não existe ou foi movida.
            </p>

            {/* Botão Voltar */}
            <Link
                href="/"
                className="flex items-center gap-2 bg-shopee-primary hover:bg-shopee-dark text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg cursor-pointer"
            >
                <Home className="w-5 h-5" />
                Voltar para o Início
            </Link>
        </div>
    );
}

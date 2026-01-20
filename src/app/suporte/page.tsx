'use client';

import { ArrowLeft, Mail, MessageCircle, User } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-8 font-sans flex items-center justify-center">

            <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-neutral-700">
                <div className="bg-shopee-primary p-8 text-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center mb-4">
                        <User className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">Suporte & Contato</h1>
                    <p className="text-white/80 text-sm">Central de Ajuda LinkSOC</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl group transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700/80">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Desenvolvedor</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">João Paulo Santos Souza</p>
                            </div>
                        </div>

                        <div className="flex items-center p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl group transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700/80">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mr-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">SeaTalk</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-200 select-all">joao.paulosouza@shopee.com</p>
                            </div>
                        </div>

                        <div className="flex items-center p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl group transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700/80">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-200 select-all">joaop0737@gmail.com</p>
                            </div>
                        </div>
                    </div>

                    <Link href="/" className="block w-full text-center py-4 rounded-xl border-2 border-transparent hover:border-gray-200 dark:hover:border-neutral-600 text-gray-500 font-bold hover:text-shopee-primary transition-colors">
                        <span className="flex items-center justify-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para o Início
                        </span>
                    </Link>
                </div>
            </div>

        </div>
    );
}

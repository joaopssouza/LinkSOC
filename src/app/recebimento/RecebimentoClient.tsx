'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Inbox } from 'lucide-react';
import Link from 'next/link';
import { LabelWrapper } from '@/components/LabelAssets';

type TipoRecebimento = 'FM' | 'LH';
type TamanhoEtiqueta = '150x100' | '100x75';

export default function RecebimentoClient() {
    const [tipo, setTipo] = useState<TipoRecebimento>('FM');
    const [tamanho, setTamanho] = useState<TamanhoEtiqueta>('150x100');
    const [dateTime, setDateTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setDateTime(now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR').substring(0, 5));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 p-8 print:p-0 print:bg-white text-gray-900 dark:text-gray-100">
            {/* Navigation - Hidden on Print */}
            <div className="max-w-4xl mx-auto mb-8 relative flex items-center justify-center print:hidden">
                <Link href="/" className="absolute left-0 flex items-center text-gray-600 dark:text-gray-400 hover:text-shopee-primary transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Voltar
                </Link>
                <h1 className="text-2xl font-bold">Recebimento</h1>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8 print:block print:w-full">
                {/* Controls - Hidden on Print */}
                <div className="space-y-6 print:hidden">
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700">
                        <div className="flex items-center mb-6">
                            <Inbox className="w-5 h-5 mr-2 text-shopee-primary" />
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Configuração</h2>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-500 mb-3">Tipo de Recebimento</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['FM', 'LH'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTipo(t as TipoRecebimento)}
                                        className={`py-3 rounded-lg font-bold border-2 transition-all ${tipo === t ? 'bg-shopee-primary text-white border-shopee-primary shadow-md' : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-600 hover:border-shopee-primary hover:text-shopee-primary'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-500 mb-3">Tamanho da Etiqueta (Deitada)</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['150x100', '100x75'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTamanho(t as TamanhoEtiqueta)}
                                        className={`py-3 rounded-lg font-bold border-2 transition-all ${tamanho === t ? 'bg-shopee-primary text-white border-shopee-primary shadow-md' : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-600 hover:border-shopee-primary hover:text-shopee-primary'}`}
                                    >
                                        {t === '150x100' ? '150x100 (10x15)' : '100x75 (7x10)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handlePrint}
                            className="w-full bg-shopee-primary hover:bg-shopee-dark text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
                        >
                            <Printer className="w-5 h-5" />
                            IMPRIMIR
                        </button>
                    </div>
                </div>

                {/* Preview Area / Print Layout */}
                <div className="flex justify-center items-start print:block print:absolute print:top-0 print:left-0 print:m-0">
                    <LabelWrapper size={tamanho}>
                        <div className="flex flex-col items-center justify-center w-full h-full pt-4">
                            <h2 className={`${tamanho === '150x100' ? 'text-[5rem] mb-6' : 'text-[3.4rem] mb-3'} font-bold uppercase tracking-tighter leading-none scale-y-110 text-black`}>RECEBIMENTO</h2>

                            <div className={`flex items-center justify-between w-full ${tamanho === '150x100' ? 'px-4 mt-2' : 'px-3 mt-1'}`}>
                                <span className={`${tamanho === '150x100' ? 'text-[9rem]' : 'text-[6rem]'} font-bold leading-none scale-y-110 tracking-tighter text-black`}>{tipo}</span>
                                <div className={`border-black text-center rounded-xl bg-white flex flex-col items-center justify-center ${tamanho === '150x100' ? 'border-[5px] py-2 px-3 min-w-[270px]' : 'border-[4px] py-1.5 px-2.5 min-w-[155px]'}`}>
                                    <span className={`${tamanho === '150x100' ? 'text-[3.2rem]' : 'text-[1.8rem]'} font-bold block leading-none text-black tracking-tighter`}>{dateTime.split(' ')[0]}</span>
                                    <span className={`${tamanho === '150x100' ? 'text-[4.5rem] mt-1' : 'text-[2.6rem] mt-0.5'} font-bold block leading-none text-black tracking-tighter`}>{dateTime.split(' ')[1]}</span>
                                </div>
                            </div>
                        </div>
                    </LabelWrapper>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Search, Printer, Loader2, QrCode } from 'lucide-react';
import Link from 'next/link';
import { LabelWrapper } from '@/components/LabelAssets';

export default function FifoPage() {
    const [searchId, setSearchId] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<{ sequencial: string; id: string } | null>(null);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchId) return;

        setLoading(true);
        setError('');
        setData(null);

        try {
            const res = await fetch(`/api/fifo?id=${searchId}`);
            const json = await res.json();

            if (json.found) {
                setData(json.data);
            } else {
                setError('ID não encontrado na base de dados.');
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 p-8 print:p-0 print:bg-white text-gray-900 dark:text-gray-100">
            <div className="max-w-4xl mx-auto mb-8 relative flex items-center justify-center print:hidden">
                <Link href="/" className="absolute left-0 flex items-center text-gray-600 dark:text-gray-400 hover:text-shopee-primary transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Voltar
                </Link>
                <h1 className="text-2xl font-bold">Etiquetas FIFO</h1>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 print:block print:w-full">

                {/* Search Panel - Hidden on Print */}
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm print:hidden border border-gray-200 dark:border-neutral-700 h-fit">
                    <h2 className="text-lg font-semibold mb-6 text-shopee-primary">Buscar ID</h2>

                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                placeholder="Digite o ID Único..."
                                className="flex-1 p-3 border border-gray-300 rounded-lg dark:bg-neutral-900 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-shopee-primary"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-shopee-primary hover:bg-shopee-dark text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 border border-red-100 dark:bg-red-900/20 dark:border-red-900/50">
                            {error}
                        </div>
                    )}

                    {data && (
                        <button
                            onClick={handlePrint}
                            className="w-full bg-shopee-primary hover:bg-shopee-dark text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg hover:shadow-xl mt-4 cursor-pointer"
                        >
                            <Printer className="w-5 h-5" />
                            IMPRIMIR ETIQUETA
                        </button>
                    )}
                </div>

                {/* Preview Area */}
                <div className="flex justify-center items-start print:block print:absolute print:top-0 print:left-0 print:m-0">
                    {data ? (
                        <LabelWrapper orientation="portrait">
                            <div className="flex flex-col items-center justify-between w-full h-full py-8 px-6 text-center relative z-20">

                                {/* Top Section: Title */}
                                <div className="flex-1 flex items-end justify-center pb-6">
                                    <h1 className="text-6xl font-bold uppercase tracking-tighter leading-none font-open-sans">
                                        STAGE IN
                                    </h1>
                                </div>

                                {/* Middle Section: Code + QR */}
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <h2 className="text-5xl font-bold tracking-tight mb-6 uppercase text-black font-open-sans">{data.sequencial || 'CG----'}</h2>

                                    <div className="p-0 bg-white">
                                        <QRCodeSVG
                                            value={data.sequencial || 'CG----'}
                                            size={240}
                                            level="H"
                                        />
                                    </div>
                                </div>

                                {/* Bottom Section: ID */}
                                <div className="flex-1 flex items-start justify-center pt-0">
                                    <p className="text-2xl font-bold font-open-sans">ID: {data.id}</p>
                                </div>

                            </div>
                        </LabelWrapper>
                    ) : (
                        <div className="w-[378px] h-[567px] bg-gray-100 dark:bg-neutral-800 border-2 border-dashed border-gray-300 dark:border-neutral-600 flex flex-col items-center justify-center text-gray-400 print:hidden rounded-xl">
                            <QrCode className="w-16 h-16 mb-4 opacity-50" />
                            <p>Digite um ID para visualizar</p>
                        </div>
                    )}
                </div>

            </div>

            <style jsx global>{`
        @media print {
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          body {
            background: white;
          }
        }
      `}</style>
        </div>
    );
}

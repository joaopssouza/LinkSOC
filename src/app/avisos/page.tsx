'use client';

import { useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
// Using standard img for print reliability instead of next/image
// import Image from 'next/image';

// Mapeamento das imagens prontas disponíveis na pasta assets
const AVAILABLE_LABELS = [
    {
        id: 'fragil',
        title: 'FRÁGIL / VIDRO',
        src: '/assets/etiquetas/cuidado_fragil.png'
    },
    {
        id: 'liquido',
        title: 'LÍQUIDO (DESCARTE)',
        src: '/assets/etiquetas/descarte_liquido.png'
    },
    {
        id: 'porcelana',
        title: 'PORCELANA (DESCARTE)',
        src: '/assets/etiquetas/descarte_porcelana.png'
    },
    {
        id: 'alimento',
        title: 'ALIMENTO (DESCARTE)',
        src: '/assets/etiquetas/descarte_alimento.png'
    },
    {
        id: 'creme',
        title: 'CREME / LOÇÃO (DESCARTE)',
        src: '/assets/etiquetas/descarte_creme.png'
    },
    {
        id: 'quimico',
        title: 'QUÍMICO (DESCARTE)',
        src: '/assets/etiquetas/descarte_quimico.png'
    },
    {
        id: 'solido',
        title: 'SÓLIDO (DESCARTE)',
        src: '/assets/etiquetas/descarte_solido.png'
    },
    {
        id: 'metal',
        title: 'METAL (DESCARTE)',
        src: '/assets/etiquetas/descarte_metal.png'
    },
    {
        id: 'tinta',
        title: 'TINTA (DESCARTE)',
        src: '/assets/etiquetas/descarte_tinta.png'
    },
    {
        id: 'tinta_doacao',
        title: 'TINTA (DOAÇÃO)',
        src: '/assets/etiquetas/doacao_tinta.png'
    },
    {
        id: 'racao',
        title: 'RAÇÃO (DOAÇÃO)',
        src: '/assets/etiquetas/doacao_racao.png'
    },
];

export default function AvisosPage() {
    const [selectedId, setSelectedId] = useState(AVAILABLE_LABELS[0].id);

    const selectedLabel = AVAILABLE_LABELS.find(l => l.id === selectedId) || AVAILABLE_LABELS[0];

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 p-8 text-gray-900 dark:text-gray-100">

            {/* Header Navigation */}
            <div className="max-w-6xl mx-auto mb-8 relative flex items-center justify-center print:hidden">
                <Link href="/" className="absolute left-0 flex items-center text-gray-600 dark:text-gray-400 hover:text-shopee-primary transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Voltar
                </Link>
                <h1 className="text-2xl font-bold">Etiquetas de Aviso</h1>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">

                {/* Controls */}
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 h-fit print:hidden">
                    <h2 className="text-lg font-semibold mb-6 text-shopee-primary">Configuração</h2>

                    <div className="mb-6">
                        <label htmlFor="label-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Selecione o Modelo
                        </label>
                        <select
                            id="label-select"
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-shopee-primary focus:border-shopee-primary outline-none transition-all cursor-pointer text-base"
                        >
                            {AVAILABLE_LABELS.map((label) => (
                                <option key={label.id} value={label.id}>
                                    {label.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="w-full bg-shopee-primary hover:bg-shopee-dark text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg hover:shadow-xl cursor-pointer"
                    >
                        <Printer className="w-5 h-5" />
                        IMPRIMIR
                    </button>

                    <div className="mt-8 p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg text-sm text-gray-500 text-center">
                        <p>Certifique-se que o papel está carregado na impressora.</p>
                        <p className="mt-2 text-xs">O sistema ajustará automaticamente para 100x150mm.</p>
                    </div>
                </div>

                {/* Preview Area (Visible on Screen) */}
                <div className="flex justify-center items-start lg:items-center bg-gray-200 dark:bg-neutral-900 rounded-xl min-h-[600px] print:hidden">
                    <div className="relative bg-white shadow-2xl transition-all mt-8 lg:mt-0"
                        style={{
                            width: '378px', // approx 100mm @ 96dpi
                            height: '567px', // approx 150mm @ 96dpi
                        }}
                    >
                        <img
                            src={selectedLabel.src}
                            alt={selectedLabel.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

            </div>

            {/* Hidden Print Container (Visible ONLY on Print) */}
            <div id="print-container" className="hidden">
                <img
                    src={selectedLabel.src}
                    alt={selectedLabel.title}
                    id="print-image"
                />
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: 100mm 150mm;
                        margin: 0;
                    }
                    /* Oculta tudo por padrão */
                    body * {
                        visibility: hidden;
                    }
                    /* Mostra apenas o container de impressão e seus filhos */
                    #print-container, #print-container * {
                        visibility: visible;
                    }
                    /* Posiciona o container de impressão ocupando toda a página */
                    #print-container {
                        position: fixed;
                        display: block !important;
                        top: 0;
                        left: 0;
                        width: 100mm;
                        height: 150mm;
                        margin: 0;
                        padding: 0;
                        z-index: 9999;
                        overflow: hidden;
                        background: white;
                    }
                    /* Ajusta a imagem para cobrir a área */
                    #print-image {
                        width: 100%;
                        height: 100%;
                        object-fit: fill; /* Garante que preencha tudo */
                        display: block;
                    }
                }
            `}</style>
        </div>
    );
}

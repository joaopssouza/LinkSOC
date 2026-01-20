'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Printer, PackageOpen, Clock, Truck } from 'lucide-react';
import Link from 'next/link';
import { LabelWrapper } from '@/components/LabelAssets';

type LabelType = 'NURSE' | 'PACKING' | 'TICKET';
type Turno = 'T1' | 'T2' | 'T3';

export default function OperationalLabelsPage() {
    const [activeTab, setActiveTab] = useState<LabelType>('NURSE');

    // Nurse State
    const [nurseType, setNurseType] = useState<'EHA' | 'RTS'>('EHA');
    const [turno, setTurno] = useState<Turno>('T1');

    // Packing State
    const [packingType, setPackingType] = useState<'SOC' | 'HUB'>('SOC');

    // Common State
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
                <h1 className="text-2xl font-bold">Etiquetas Operacionais</h1>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8 print:block print:w-full">
                {/* Controls - Hidden on Print */}
                <div className="space-y-6 print:hidden">
                    {/* Tab Selection */}
                    <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 grid grid-cols-1 gap-2">
                        <button
                            onClick={() => setActiveTab('NURSE')}
                            className={`flex items-center p-3 rounded-lg font-bold text-left transition-all ${activeTab === 'NURSE' ? 'bg-orange-50 text-shopee-primary ring-1 ring-shopee-primary dark:bg-neutral-700' : 'hover:bg-gray-50 dark:hover:bg-neutral-700'}`}
                        >
                            <PackageOpen className="w-5 h-5 mr-3" />
                            NURSE (Gaiolas)
                        </button>
                        <button
                            onClick={() => setActiveTab('PACKING')}
                            className={`flex items-center p-3 rounded-lg font-bold text-left transition-all ${activeTab === 'PACKING' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-600 dark:bg-neutral-700 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-neutral-700'}`}
                        >
                            <Truck className="w-5 h-5 mr-3" />
                            PACKING
                        </button>
                        <button
                            onClick={() => setActiveTab('TICKET')}
                            className={`flex items-center p-3 rounded-lg font-bold text-left transition-all ${activeTab === 'TICKET' ? 'bg-purple-50 text-purple-600 ring-1 ring-purple-600 dark:bg-neutral-700 dark:text-purple-400' : 'hover:bg-gray-50 dark:hover:bg-neutral-700'}`}
                        >
                            <Clock className="w-5 h-5 mr-3" />
                            AGUARDANDO TICKET
                        </button>
                    </div>

                    {/* Config Panel */}
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700">
                        <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-200">Configuração</h2>

                        {/* Specific Controls based on Tab */}
                        {activeTab === 'NURSE' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-500 mb-2">Tipo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['EHA', 'RTS'].map(t => (
                                        <button key={t} onClick={() => setNurseType(t as any)} className={`p-2 rounded font-bold border transition-colors ${nurseType === t ? 'bg-shopee-primary text-white border-shopee-primary' : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-600'}`}>{t}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'PACKING' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-500 mb-2">Destino</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['SOC', 'HUB'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setPackingType(t as any)}
                                            className={`p-2 rounded font-bold border transition-colors ${packingType === t
                                                ? (t === 'SOC' ? 'bg-green-500 border-green-300 hover:bg-green-700' : 'bg-blue-900 text-white border-blue-900 hover:bg-blue-950')
                                                : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-600'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Common Turno Selection */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-500 mb-2">Turno Operacional</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['T1', 'T2', 'T3'].map(t => (
                                    <button key={t} onClick={() => setTurno(t as any)} className={`py-2 rounded font-bold border transition-colors ${turno === t ? 'bg-shopee-primary text-white border-gray-800' : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-600'}`}>{t}</button>
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

                    <LabelWrapper orientation="landscape">

                        {activeTab === 'NURSE' && (
                            <div className="flex flex-col items-center justify-center mt-5 w-full h-full pt-0">
                                <h2 className="text-6xl font-bold mb-0 uppercase tracking-tighter leading-none scale-y-110">CONTROLE FIFO</h2>
                                <h2 className="text-5xl font-bold mb-4 uppercase tracking-tight scale-y-110">NURSE</h2>

                                <div className="flex items-center justify-center gap-15 w-full mt-0">
                                    <span className="text-[7rem] font-bold leading-none">{turno}</span>
                                    <span className="text-[7rem] font-bold leading-none">{nurseType}</span>
                                </div>
                                <p className="text-4xl font-bold mt-6">{dateTime}</p>
                            </div>
                        )}

                        {activeTab === 'PACKING' && (
                            <div className="flex flex-col items-center justify-center mt-5 w-full h-full pt-0">
                                <h2 className="text-6xl font-bold mb-0 uppercase tracking-tighter leading-none scale-y-110">CONTROLE FIFO</h2>
                                <h2 className="text-5xl font-bold mb-4 uppercase tracking-tight scale-y-110">PACKING</h2>

                                <div className="flex items-center justify-center gap-12 w-full mt-0">
                                    <span className="text-[7rem] font-bold leading-none">{turno}</span>
                                    <span className="text-[7rem] font-bold leading-none">{packingType}</span>
                                </div>
                                <p className="text-4xl font-bold mt-6">{dateTime}</p>
                            </div>
                        )}

                        {activeTab === 'TICKET' && (
                            <div className="flex flex-col items-center justify-center w-full h-full pt-0">
                                <h2 className="text-6xl font-bold mb-0 uppercase tracking-tighter leading-none scale-y-110">AGUARDANDO</h2>
                                <h2 className="text-6xl font-bold mb-4 uppercase tracking-tighter leading-none scale-y-110">VIRAR TICKET</h2>

                                <div className="flex items-center gap-8 mt-0">
                                    <span className="text-[7rem] font-bold leading-none">{turno}</span>
                                    <div className="border-4 border-black p-2 text-center">
                                        <span className="text-5xl font-bold block">{dateTime.split(' ')[0]}</span>
                                        <span className="text-6xl font-bold block">{dateTime.split(' ')[1]}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                    </LabelWrapper>
                </div>
            </div>


        </div >
    );
}

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import Link from 'next/link';

type Regra = {
    Status: string;
    Fluxo: string;
    Significado: string;
    Cor: string;
};

export default function RegrasPage() {
    const [regras, setRegras] = useState<Regra[]>([]);
    const [filtered, setFiltered] = useState<Regra[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRegras();
    }, []);

    useEffect(() => {
        if (!search) {
            setFiltered(regras);
        } else {
            const lower = search.toLowerCase();
            setFiltered(regras.filter(r =>
                r.Status.toLowerCase().includes(lower) ||
                r.Significado.toLowerCase().includes(lower) ||
                r.Fluxo.toLowerCase().includes(lower)
            ));
        }
    }, [search, regras]);

    const fetchRegras = async () => {
        setLoading(true);
        const CACHE_NAME = 'linksoc-api-cache-v1';
        const API_URL = '/api/regras';

        try {
            // Tenta buscar da rede (Online)
            const res = await fetch(API_URL);

            if (res.ok) {
                // Se sucesso, clona e salva no Cache API para uso offline
                try {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(API_URL, res.clone());
                    console.log('Dados salvos no cache offline.');
                } catch (err) {
                    console.warn('Erro ao salvar no cache:', err);
                }

                const json = await res.json();
                if (Array.isArray(json)) {
                    setRegras(json);
                    setFiltered(json);
                }
            } else {
                throw new Error('Erro na resposta da API');
            }
        } catch (e) {
            console.warn('Modo Offline detectado ou falha na rede. Tentando buscar do cache...', e);
            // Fallback: Tenta buscar do cache offline
            try {
                const cache = await caches.open(CACHE_NAME);
                const cachedRes = await cache.match(API_URL);

                if (cachedRes) {
                    const json = await cachedRes.json();
                    if (Array.isArray(json)) {
                        setRegras(json);
                        setFiltered(json);
                        console.log('Dados carregados do cache offline com sucesso.');
                    }
                } else {
                    console.error('Nenhum dado encontrado no cache.');
                }
            } catch (cacheErr) {
                console.error('Erro ao ler do cache:', cacheErr);
            }
        } finally {
            setLoading(false);
        }
    };



    const getColorClasses = (cor: string, fluxo: string) => {
        // Lógica automática baseada no Fluxo
        let statusColor = cor?.toLowerCase();

        if (!statusColor || statusColor === 'cinza') {
            const f = fluxo?.toLowerCase() || '';
            if (f.includes('offline') || f.includes('bloqueado')) statusColor = 'vermelho';
            else if (f.includes('online') || f.includes('liberado')) statusColor = 'verde';
            else if (f.includes('quarentena') || f.includes('atenção')) statusColor = 'amarelo';
        }

        switch (statusColor) {
            case 'verde': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            case 'vermelho': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            case 'amarelo': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
            default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:border-neutral-700';
        }
    };

    const getIcon = (cor: string, fluxo: string) => {
        let statusColor = cor?.toLowerCase();

        if (!statusColor || statusColor === 'cinza') {
            const f = fluxo?.toLowerCase() || '';
            if (f.includes('offline')) statusColor = 'vermelho';
            else if (f.includes('online')) statusColor = 'verde';
            else if (f.includes('quarentena')) statusColor = 'amarelo';
        }

        switch (statusColor) {
            case 'verde': return <CheckCircle className="w-6 h-6" />;
            case 'vermelho': return <XCircle className="w-6 h-6" />;
            case 'amarelo': return <AlertTriangle className="w-6 h-6" />;
            default: return <Info className="w-6 h-6" />;
        }
    };

    const getTooltipText = (fluxo: string) => {
        const lower = fluxo?.toLowerCase() || '';
        if (lower.includes('online')) return 'Seguir para esteira.';
        if (lower.includes('offline')) return 'Seguir para salvados.';
        if (lower.includes('quarentena')) return 'Separar o produto.';
        return 'Consulte o líder.';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-8 font-sans">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center">
                    <Link href="/" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-shopee-primary transition-colors mr-6">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Voltar
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Regras de Fluxo</h1>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Pesquisar status, fluxo ou significado..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-neutral-700 dark:bg-neutral-800 focus:ring-2 focus:ring-shopee-primary outline-none transition-all shadow-sm"
                        />
                    </div>

                </div>
            </div>

            {/* Results Table */}
            <div className="max-w-6xl mx-auto bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-neutral-900/50 border-b border-gray-200 dark:border-neutral-700">
                                <th className="p-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider w-1/4">Status</th>
                                <th className="p-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider w-1/4">Fluxo</th>
                                <th className="p-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Significado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500">Carregando regras...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500">
                                        {regras.length === 0 ? 'Nenhuma regra carregada. Clique em Sincronizar.' : 'Nenhum resultado encontrado.'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors group">
                                        <td className="p-4 align-top">
                                            <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100">
                                                {r.Status}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="relative group inline-block">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border cursor-help ${getColorClasses(r.Cor, r.Fluxo).replace('bg-', 'bg-opacity-20 ')}`}>
                                                    {getIcon(r.Cor, r.Fluxo)}
                                                    {r.Fluxo}
                                                </span>
                                                {/* Custom Tooltip */}
                                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform group-hover:-translate-y-1">
                                                    {getTooltipText(r.Fluxo)}
                                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {r.Significado}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

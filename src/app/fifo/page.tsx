'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Search, Printer, Loader2, Plus, Link2, Package, RefreshCw, ChevronLeft, ChevronRight, Trash2, Lock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { LabelWrapper } from '@/components/LabelAssets';

type FifoData = {
    qrcode: string;
    id_um: string;
    id_dois: string;
    serie: string;
};

type TabType = 'buscar' | 'gerar' | 'lote' | 'vincular';

export default function FifoPage() {
    // === AUTENTICAÇÃO ===
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    const [activeTab, setActiveTab] = useState<TabType>('buscar');

    // === TABELA ESPELHO ===
    const [tableData, setTableData] = useState<FifoData[]>([]);
    const [tablePage, setTablePage] = useState(1);
    const [tableTotalPages, setTableTotalPages] = useState(1);
    const [tableStats, setTableStats] = useState({ total: 0, unlinked: 0, unique: 0, duplicates: 0 });
    const [loadingTable, setLoadingTable] = useState(false);
    const [exceeded, setExceeded] = useState(false);
    const [selectedFromTable, setSelectedFromTable] = useState<FifoData | null>(null);

    // === BARRA DE PROGRESSO ===
    const [generateProgress, setGenerateProgress] = useState(0);

    // === BUSCAR ===
    const [searchId, setSearchId] = useState('');
    const [searchResult, setSearchResult] = useState<FifoData | null>(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    // === GERAR EM MASSA ===
    const [generateQty, setGenerateQty] = useState(1);
    const [generating, setGenerating] = useState(false);
    const [generatedLabels, setGeneratedLabels] = useState<FifoData[]>([]);

    // === IMPRESSÃO EM LOTE ===
    const [batchIds, setBatchIds] = useState('');
    const [batchResults, setBatchResults] = useState<FifoData[]>([]);
    const [batchNotFound, setBatchNotFound] = useState<string[]>([]);
    const [loadingBatch, setLoadingBatch] = useState(false);
    const batchInputRef = useRef<HTMLTextAreaElement>(null);

    // ... (omitting intermediate code if not changing, but replace_file_content needs contiguous block. 
    // Actually better to just update the handleBatchSearch and the UI section)

    // Let's target the handleBatchSearch function first? No, I need to add the state.
    // I entered "EndLine: 338" in the previous turn's intention but realized I should do it in chunks or one big block.
    // The previous view_file showed lines 303-345.
    // I need to add state near line 35. 
    // I'll make a larger replacement covering state + handlers + UI. Wait, that's risky.
    // I'll update the state definition first.


    // === VINCULAR ===
    const [linkQrcode, setLinkQrcode] = useState('');
    const [linkIdUm, setLinkIdUm] = useState('');
    const [linkIdDois, setLinkIdDois] = useState('');
    const [linking, setLinking] = useState(false);
    const [linkMessage, setLinkMessage] = useState('');

    // Tabelas Vincular
    const [unlinkedData, setUnlinkedData] = useState<FifoData[]>([]);
    const [linkedData, setLinkedData] = useState<FifoData[]>([]);
    const [loadingLinkTable, setLoadingLinkTable] = useState(false);

    // Carregar dados de vinculação
    const loadLinkData = async () => {
        setLoadingLinkTable(true);
        try {
            // Usa pageSize alto para trazer tudo, na API real filtraria melhor
            const res = await fetch(`/api/fifo/list?page=1&pageSize=5000&t=${Date.now()}`);
            const json = await res.json();
            const all: FifoData[] = json.data || [];

            setUnlinkedData(all.filter(d => !d.id_um && !d.id_dois));
            setLinkedData(all.filter(d => d.id_um || d.id_dois));
        } catch {
            console.error('Erro ao carregar dados de vinculação');
        } finally {
            setLoadingLinkTable(false);
        }
    };

    // Atualiza tabela ao mudar aba e configura auto-refresh de 30 min
    useEffect(() => {
        if (activeTab === 'vincular') {
            loadLinkData();
        }

        // Auto-refresh a cada 30 minutos (1800000 ms)
        const intervalId = setInterval(() => {
            loadTableData(tablePage);
            if (activeTab === 'vincular') {
                loadLinkData();
            }
        }, 30 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [activeTab, tablePage]);

    // Limpar ID
    const handleClearId = async (qrcode: string) => {
        if (!confirm(`Deseja limpar os IDs da gaiola ${qrcode}?`)) return;

        try {
            const res = await fetch('/api/fifo/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrcode })
            });
            const json = await res.json();
            if (json.success) {
                loadLinkData(); // Recarrega tabelas
                loadTableData(tablePage); // Atualiza espelho também
            } else {
                alert(`Erro: ${json.error}`);
            }
        } catch {
            alert('Erro de conexão.');
        }
    };


    // === CARREGAR TABELA ===
    const loadTableData = async (page: number = 1) => {
        setLoadingTable(true);
        try {
            const res = await fetch(`/api/fifo/list?page=${page}&pageSize=15&t=${Date.now()}`);
            const json = await res.json();
            setTableData(json.data || []);
            setTableTotalPages(json.totalPages || 1);
            setTableStats(json.stats || { total: 0, unlinked: 0, unique: 0, duplicates: 0 });
            setTablePage(page);
            setExceeded(json.exceeded || false);
        } catch {
            console.error('Erro ao carregar tabela');
        } finally {
            setLoadingTable(false);
        }
    };

    // Verificar autenticação no sessionStorage ao carregar
    useEffect(() => {
        const storedAuth = sessionStorage.getItem('fifo_auth');
        if (storedAuth === 'true') {
            setIsAuthenticated(true);
        }
        setCheckingAuth(false);
    }, []);

    // Carregar dados apenas se autenticado
    useEffect(() => {
        if (isAuthenticated) {
            loadTableData(1);
        }
    }, [isAuthenticated]);

    // Autenticar
    const handleAuth = async () => {
        if (!authPassword.trim()) return;
        setAuthLoading(true);
        setAuthError('');

        try {
            const res = await fetch('/api/fifo/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: authPassword })
            });
            const json = await res.json();
            if (json.valid) {
                setIsAuthenticated(true);
                sessionStorage.setItem('fifo_auth', 'true');
            } else {
                setAuthError('Senha incorreta.');
            }
        } catch {
            setAuthError('Erro de conexão.');
        } finally {
            setAuthLoading(false);
        }
    };

    // === BUSCAR ETIQUETA ===
    const handleSearch = async () => {
        if (!searchId.trim()) return;
        setSearching(true);
        setSearchError('');
        setSearchResult(null);

        try {
            const res = await fetch(`/api/fifo?id=${encodeURIComponent(searchId.trim())}`);
            const json = await res.json();
            if (json.found) {
                setSearchResult(json.data);
            } else {
                setSearchError('ID não encontrado na planilha.');
            }
        } catch {
            setSearchError('Erro ao buscar. Verifique a conexão.');
        } finally {
            setSearching(false);
        }
    };

    // === GERAR EM MASSA ===
    const handleGenerate = async () => {
        if (generateQty < 1 || generateQty > 100) return;
        setGenerating(true);
        setGeneratedLabels([]);
        setGenerateProgress(0);

        // Simular progresso enquanto aguarda a API
        const progressInterval = setInterval(() => {
            setGenerateProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 15;
            });
        }, 200);

        try {
            const res = await fetch('/api/fifo/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: generateQty })
            });
            const json = await res.json();
            clearInterval(progressInterval);
            setGenerateProgress(100);

            if (json.success) {
                setGeneratedLabels(json.data);
                loadTableData(1);
            }
        } catch {
            clearInterval(progressInterval);
            alert('Erro ao gerar etiquetas.');
        } finally {
            setTimeout(() => {
                setGenerating(false);
                setGenerateProgress(0);
            }, 500);
        }
    };

    // === IMPRESSÃO EM LOTE ===
    const handleBatchKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = batchInputRef.current?.value || '';
            setBatchIds(value + '\n');
            setTimeout(() => {
                if (batchInputRef.current) {
                    batchInputRef.current.focus();
                    batchInputRef.current.selectionStart = batchInputRef.current.value.length;
                }
            }, 0);
        }
    };

    const handleBatchSearch = async () => {
        const ids = batchIds.split('\n').map(s => s.trim()).filter(Boolean);
        if (ids.length === 0) return;
        setLoadingBatch(true);
        setBatchResults([]);
        setBatchNotFound([]);

        try {
            const res = await fetch(`/api/fifo?ids=${encodeURIComponent(ids.join(','))}`);
            const json = await res.json();
            if (json.data) {
                setBatchResults(json.data);
            }
            if (json.notFoundIds) {
                setBatchNotFound(json.notFoundIds);
            }
        } catch {
            alert('Erro ao buscar etiquetas.');
        } finally {
            setLoadingBatch(false);
        }
    };

    // === VINCULAR ===
    const handleLink = async () => {
        if (!linkQrcode.trim()) return;
        if (!linkIdUm.trim() && !linkIdDois.trim()) {
            setLinkMessage('Informe pelo menos um ID.');
            return;
        }
        setLinking(true);
        setLinkMessage('');

        try {
            const res = await fetch('/api/fifo/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qrcode: linkQrcode.trim(),
                    id_um: linkIdUm.trim() || undefined,
                    id_dois: linkIdDois.trim() || undefined
                })
            });
            const json = await res.json();
            if (json.success) {
                setLinkMessage('✅ Vinculado com sucesso!');
                setLinkQrcode('');
                setLinkIdUm('');
                setLinkIdDois('');
                loadTableData(tablePage);
            } else {
                setLinkMessage(`❌ ${json.error || 'Erro ao vincular.'}`);
            }
        } catch {
            setLinkMessage('❌ Erro de conexão.');
        } finally {
            setLinking(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Gerar números de página para exibição
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (tableTotalPages <= maxVisible + 2) {
            for (let i = 1; i <= tableTotalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (tablePage > 3) pages.push('...');

            const start = Math.max(2, tablePage - 1);
            const end = Math.min(tableTotalPages - 1, tablePage + 1);

            for (let i = start; i <= end; i++) pages.push(i);

            if (tablePage < tableTotalPages - 2) pages.push('...');
            pages.push(tableTotalPages);
        }
        return pages;
    };

    // Data e hora de impressão
    const printDateTime = new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    // Loading inicial
    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-shopee-primary" />
            </div>
        );
    }

    // Modal de Autenticação
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center p-8">
                <div className="bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-md">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-shopee-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-8 h-8 text-shopee-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Acesso Restrito</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Etiquetas FIFO</p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                            placeholder="Digite a senha"
                            className="w-full p-4 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-shopee-primary outline-none text-center text-lg tracking-widest"
                            autoFocus
                        />
                        {authError && (
                            <p className="text-red-500 text-sm text-center">{authError}</p>
                        )}
                        <button
                            onClick={handleAuth}
                            disabled={authLoading}
                            className="w-full bg-shopee-primary hover:bg-shopee-dark text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                            Entrar
                        </button>
                    </div>

                    <div className="mt-6 text-center">
                        <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-shopee-primary text-sm">
                            ← Voltar para o Início
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 p-8 print:p-0 print:bg-white text-gray-900 dark:text-gray-100">
            {/* Navigation */}
            <div className="max-w-7xl mx-auto mb-6 relative flex items-center justify-center print:hidden">
                <Link href="/" className="absolute left-0 flex items-center text-gray-600 dark:text-gray-400 hover:text-shopee-primary transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Voltar
                </Link>
                <h1 className="text-2xl font-bold">Etiquetas FIFO</h1>
            </div>

            {/* Alerta de Limite Excedido */}
            {exceeded && (
                <div className="max-w-7xl mx-auto mb-4 print:hidden">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-red-700 dark:text-red-400">Limite de QRCodes Excedido!</h3>
                            <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                                A planilha possui mais de 5.000 registros. Considere gerar e imprimir os QRCodes não vinculados.
                            </p>
                            {unlinkedData.length > 0 && (
                                <button
                                    onClick={() => {
                                        setActiveTab('vincular');
                                        setBatchResults(unlinkedData);
                                    }}
                                    className="mt-2 text-sm font-medium text-red-700 dark:text-red-400 underline hover:no-underline cursor-pointer"
                                >
                                    Ver {unlinkedData.length} não vinculados →
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 print:block">
                {/* Coluna Esquerda: Módulos + Tabela */}
                <div className="space-y-4 print:hidden">
                    {/* Tabs */}
                    <div className="bg-white dark:bg-neutral-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 grid grid-cols-2 gap-2">
                        <button onClick={() => setActiveTab('buscar')} className={`flex items-center justify-center p-3 rounded-lg font-bold transition-all ${activeTab === 'buscar' ? 'bg-shopee-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
                            <Search className="w-4 h-4 mr-2" /> Buscar
                        </button>
                        <button onClick={() => setActiveTab('gerar')} className={`flex items-center justify-center p-3 rounded-lg font-bold transition-all ${activeTab === 'gerar' ? 'bg-shopee-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
                            <Plus className="w-4 h-4 mr-2" /> Gerar
                        </button>
                        <button onClick={() => setActiveTab('lote')} className={`flex items-center justify-center p-3 rounded-lg font-bold transition-all ${activeTab === 'lote' ? 'bg-shopee-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
                            <Package className="w-4 h-4 mr-2" /> Lote
                        </button>
                        <button onClick={() => setActiveTab('vincular')} className={`flex items-center justify-center p-3 rounded-lg font-bold transition-all ${activeTab === 'vincular' ? 'bg-shopee-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
                            <Link2 className="w-4 h-4 mr-2" /> Vincular
                        </button>
                    </div>

                    {/* Tab Content - Expandido 10% */}
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 min-h-[280px]">

                        {/* === BUSCAR === */}
                        {activeTab === 'buscar' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-shopee-primary">Buscar Etiqueta</h2>
                                <p className="text-sm text-gray-500">Bipe ou digite o ID (ID_UM ou ID_DOIS)</p>
                                <input
                                    type="text"
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Ex: ABC123"
                                    className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-shopee-primary outline-none"
                                    autoFocus
                                />
                                <button onClick={handleSearch} disabled={searching} className="w-full bg-shopee-primary hover:bg-shopee-dark text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer">
                                    {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                    Buscar
                                </button>
                                {searchError && <p className="text-red-500 text-sm text-center">{searchError}</p>}
                                {searchResult && (
                                    <button onClick={handlePrint} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                                        <Printer className="w-5 h-5" /> IMPRIMIR
                                    </button>
                                )}
                            </div>
                        )}

                        {/* === GERAR EM MASSA === */}
                        {activeTab === 'gerar' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-shopee-primary">Gerar Etiquetas em Massa</h2>
                                <p className="text-sm text-gray-500">Cria novas etiquetas sem IDs vinculados</p>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={generateQty}
                                        onChange={(e) => setGenerateQty(parseInt(e.target.value) || 1)}
                                        className="flex-1 p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-shopee-primary outline-none"
                                    />
                                    <button onClick={handleGenerate} disabled={generating} className="px-6 bg-shopee-primary hover:bg-shopee-dark text-white rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer">
                                        {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                        Gerar
                                    </button>
                                </div>
                                {/* Barra de Progresso */}
                                {generating && (
                                    <div className="mt-2">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Gerando etiquetas...</span>
                                            <span>{Math.round(generateProgress)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-shopee-primary h-2 rounded-full transition-all duration-200"
                                                style={{ width: `${generateProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                                {generatedLabels.length > 0 && (
                                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="font-bold text-green-700 dark:text-green-400 mb-1 text-sm">✅ {generatedLabels.length} etiquetas criadas</p>
                                        <div className="max-h-24 overflow-y-auto text-xs space-y-0.5">
                                            {generatedLabels.map((l) => (
                                                <div key={l.qrcode} className="font-mono">{l.qrcode}</div>
                                            ))}
                                        </div>
                                        <button onClick={handlePrint} className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                                            <Printer className="w-4 h-4" /> IMPRIMIR ETIQUETAS
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === IMPRESSÃO EM LOTE === */}
                        {activeTab === 'lote' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-shopee-primary">Impressão em Lote</h2>
                                <p className="text-sm text-gray-500">Bipe vários IDs (um por linha)</p>
                                <textarea
                                    ref={batchInputRef}
                                    value={batchIds}
                                    onChange={(e) => setBatchIds(e.target.value)}
                                    onKeyDown={handleBatchKeyDown}
                                    placeholder="Bipe os IDs aqui..."
                                    rows={4}
                                    className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-shopee-primary outline-none font-mono text-sm"
                                />
                                <button onClick={handleBatchSearch} disabled={loadingBatch} className="w-full bg-shopee-primary hover:bg-shopee-dark text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer">
                                    {loadingBatch ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                    Buscar Etiquetas
                                </button>
                                {(batchResults.length > 0 || batchNotFound.length > 0) && (
                                    <>
                                        <div className="flex flex-col gap-2">
                                            {batchResults.length > 0 && (
                                                <p className="text-sm font-bold text-blue-600">
                                                    ✅ {batchResults.length} etiqueta(s) encontrada(s)
                                                </p>
                                            )}
                                            {batchNotFound.length > 0 && (
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                                                        ❌ {batchNotFound.length} não encontrado(s):
                                                    </p>
                                                    <div className="text-xs text-red-500 dark:text-red-300 font-mono mt-1 break-all">
                                                        {batchNotFound.join(', ')}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {batchResults.length > 0 && (
                                            <button onClick={handlePrint} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                                                <Printer className="w-5 h-5" /> IMPRIMIR LOTE
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* === VINCULAR === */}
                        {activeTab === 'vincular' && (
                            <div className="space-y-3">
                                <h2 className="text-lg font-semibold text-shopee-primary">Vincular IDs ao QRCode</h2>
                                <input
                                    type="text"
                                    value={linkQrcode}
                                    onChange={(e) => setLinkQrcode(e.target.value.toUpperCase())}
                                    placeholder="QRCode (ex: CG0001)"
                                    className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-shopee-primary outline-none font-mono"
                                />
                                <input
                                    type="text"
                                    value={linkIdUm}
                                    onChange={(e) => setLinkIdUm(e.target.value)}
                                    placeholder="ID_UM (opcional)"
                                    className="w-full p-2.5 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-shopee-primary outline-none text-sm"
                                />
                                <input
                                    type="text"
                                    value={linkIdDois}
                                    onChange={(e) => setLinkIdDois(e.target.value)}
                                    placeholder="ID_DOIS (opcional)"
                                    className="w-full p-2.5 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-shopee-primary outline-none text-sm"
                                />
                                <button onClick={handleLink} disabled={linking} className="w-full bg-shopee-primary hover:bg-shopee-dark text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer">
                                    {linking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
                                    Vincular
                                </button>
                                {linkMessage && (
                                    <p className="text-center text-sm">
                                        {linkMessage.split(/(\*\*.*?\*\*)/).map((part, i) =>
                                            part.startsWith('**') && part.endsWith('**')
                                                ? <strong key={i} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>
                                                : part
                                        )}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tabela Espelho - Abaixo dos módulos, compacta */}
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden">
                        {/* Header da Tabela */}
                        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Espelho</span>
                                <button onClick={() => loadTableData(tablePage)} disabled={loadingTable} className="p-1 text-gray-400 hover:text-shopee-primary transition-colors cursor-pointer group">
                                    <RefreshCw className={`w-3.5 h-3.5 ${loadingTable ? 'animate-spin' : ''} group-hover:scale-110 transition-transform`} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-medium">
                                    Real: {tableStats.unique}
                                </span>
                                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-medium">
                                    S/Vínc: {tableStats.unlinked}
                                </span>
                                {tableStats.duplicates > 0 && (
                                    <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-medium">
                                        Dup: {tableStats.duplicates}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Tabela Compacta */}
                        <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-100 dark:bg-neutral-700 sticky top-0">
                                    <tr>
                                        <th className="px-2 py-1.5 text-left font-semibold">QRCode</th>
                                        <th className="px-2 py-1.5 text-left font-semibold">ID_UM</th>
                                        <th className="px-2 py-1.5 text-left font-semibold">ID_DOIS</th>
                                        <th className="px-2 py-1.5 text-left font-semibold">Série</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.map((row, idx) => (
                                        <tr
                                            key={row.qrcode + idx}
                                            onClick={() => setSelectedFromTable(row)}
                                            className={`border-t border-gray-100 dark:border-neutral-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors ${!row.id_um && !row.id_dois ? 'bg-amber-50 dark:bg-amber-900/10' : ''} ${selectedFromTable?.qrcode === row.qrcode ? 'ring-2 ring-shopee-primary' : ''}`}
                                        >
                                            <td className="px-2 py-1 font-mono font-bold">{row.qrcode}</td>
                                            <td className="px-2 py-1 truncate max-w-[80px]">{row.id_um || <span className="text-gray-400">-</span>}</td>
                                            <td className="px-2 py-1 truncate max-w-[80px]">{row.id_dois || <span className="text-gray-400">-</span>}</td>
                                            <td className="px-2 py-1 font-mono">{row.serie}</td>
                                        </tr>
                                    ))}
                                    {tableData.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-2 py-4 text-center text-gray-400">
                                                {loadingTable ? 'Carregando...' : 'Nenhum registro'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginação Compacta */}
                        {tableTotalPages > 1 && (
                            <div className="flex items-center justify-center gap-0.5 px-2 py-1.5 border-t border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                                <button
                                    onClick={() => loadTableData(tablePage - 1)}
                                    disabled={tablePage === 1 || loadingTable}
                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>

                                {getPageNumbers().map((page, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => typeof page === 'number' && loadTableData(page)}
                                        disabled={page === '...' || loadingTable}
                                        className={`min-w-[24px] h-6 px-1 rounded text-xs font-medium transition-colors
                                            ${page === tablePage
                                                ? 'bg-shopee-primary text-white'
                                                : page === '...'
                                                    ? 'cursor-default'
                                                    : 'hover:bg-gray-200 dark:hover:bg-neutral-600'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => loadTableData(tablePage + 1)}
                                    disabled={tablePage === tableTotalPages || loadingTable}
                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Area / Tabelas de Vinculação */}
                <div className="flex flex-col items-center gap-4 print:block">

                    {/* === TABELAS DE VINCULAÇÃO (Apenas na aba Vincular) === */}
                    {activeTab === 'vincular' && (
                        <div className="space-y-6 w-full">
                            {/* Header com Refresh */}
                            <div className="flex justify-between items-center bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200">Gerenciamento de Gaiolas</h3>
                                <button onClick={loadLinkData} disabled={loadingLinkTable} className="flex items-center gap-2 text-sm text-shopee-primary font-medium hover:underline cursor-pointer group">
                                    <RefreshCw className={`w-4 h-4 ${loadingLinkTable ? 'animate-spin' : ''} group-hover:scale-110 transition-transform`} />
                                    Atualizar Tabelas
                                </button>
                            </div>

                            {/* Tabela 1: Gaiolas SEM VÍNCULO */}
                            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden">
                                <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-amber-700 dark:text-amber-400">⚠️ Gaiolas SEM Vínculo</span>
                                        <span className="text-xs bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-full">{unlinkedData.length}</span>
                                    </div>
                                    {unlinkedData.length > 0 && (
                                        <button
                                            onClick={() => {
                                                setBatchResults(unlinkedData);
                                                setActiveTab('lote');
                                            }}
                                            className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                        >
                                            <Printer className="w-3 h-3" /> Imprimir Todos
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-neutral-700 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left">QRCode</th>
                                                <th className="px-4 py-2 text-left">Série</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {unlinkedData.map((row, idx) => (
                                                <tr key={`${row.qrcode}-${idx}`} className="border-t border-gray-100 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer" onClick={() => setLinkQrcode(row.qrcode)}>
                                                    <td className="px-4 py-2 font-mono font-bold text-gray-700 dark:text-gray-300">{row.qrcode}</td>
                                                    <td className="px-4 py-2 font-mono text-gray-500">{row.serie}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Tabela 2: Gaiolas COM VÍNCULO */}
                            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden">
                                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-neutral-700 flex justify-between">
                                    <span className="font-bold text-blue-700 dark:text-blue-400">✅ Gaiolas COM Vínculo</span>
                                    <span className="text-xs bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100 px-2 py-0.5 rounded-full">{linkedData.length}</span>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-neutral-700 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left">QRCode</th>
                                                <th className="px-4 py-2 text-left">ID_UM</th>
                                                <th className="px-4 py-2 text-left">ID_DOIS</th>
                                                <th className="px-4 py-2 text-center">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {linkedData.map((row, idx) => (
                                                <tr key={`${row.qrcode}-${idx}`} className="border-t border-gray-100 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700">
                                                    <td className="px-4 py-2 font-mono font-bold text-gray-700 dark:text-gray-300">{row.qrcode}</td>
                                                    <td className="px-4 py-2 truncate max-w-[100px]">{row.id_um}</td>
                                                    <td className="px-4 py-2 truncate max-w-[100px]">{row.id_dois}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button
                                                            onClick={() => handleClearId(row.qrcode)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                            title="Limpar IDs"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Single Label Preview - Apenas se NÃO estiver em 'vincular' */}
                    {/* Preview da Tabela Espelho */}
                    {selectedFromTable && !searchResult && activeTab !== 'lote' && activeTab !== 'gerar' && (
                        <div className="print:hidden">
                            <div className="text-center text-sm text-gray-500 mb-2">Clique para visualizar</div>
                            <LabelWrapper orientation="portrait">
                                <div className="flex flex-col items-center justify-center w-full h-full">
                                    <h1 className="text-4xl font-bold font-open-sans tracking-tight mb-6">STAGE IN</h1>
                                    <QRCodeSVG value={selectedFromTable.qrcode} size={200} level="H" />
                                    <h2 className="text-2xl font-bold font-open-sans mt-4 text-black">
                                        {selectedFromTable.qrcode}
                                    </h2>
                                    <p className="text-xl font-bold font-open-sans mt-2 text-black">
                                        SÉRIE: {selectedFromTable.serie}
                                    </p>
                                </div>
                            </LabelWrapper>
                        </div>
                    )}

                    {activeTab === 'buscar' && searchResult && (
                        <LabelWrapper orientation="portrait">
                            <div className="flex flex-col items-center justify-center w-full h-full">
                                <h1 className="text-4xl font-bold font-open-sans tracking-tight mb-6">STAGE IN</h1>
                                <QRCodeSVG value={searchResult.qrcode} size={200} level="H" />
                                <h2 className="text-2xl font-bold font-open-sans mt-4 text-black">
                                    {searchResult.qrcode}
                                </h2>
                                <p className="text-xl font-bold font-open-sans mt-2 text-black">
                                    SÉRIE: {searchResult.serie}
                                </p>
                                <p className="text-xs text-gray-400 mt-4 print:block hidden">
                                    Impresso em: {printDateTime}
                                </p>
                            </div>
                        </LabelWrapper>
                    )}

                    {/* Batch Print Preview */}
                    {activeTab === 'lote' && batchResults.length > 0 && (
                        <div className="space-y-4 print:space-y-0">
                            {batchResults.map((label, idx) => (
                                <div key={label.qrcode} className={idx < batchResults.length - 1 ? 'print:break-after-page' : ''}>
                                    <LabelWrapper orientation="portrait">
                                        <div className="flex flex-col items-center justify-center w-full h-full">
                                            <h1 className="text-4xl font-bold font-open-sans tracking-tight mb-6">STAGE IN</h1>
                                            <QRCodeSVG value={label.qrcode} size={200} level="H" />
                                            <h2 className="text-2xl font-bold font-open-sans mt-4 text-black">
                                                {label.qrcode}
                                            </h2>
                                            <p className="text-xl font-bold font-open-sans mt-2 text-black">
                                                SÉRIE: {label.serie}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-4 print:block hidden">
                                                Impresso em: {printDateTime}
                                            </p>
                                        </div>
                                    </LabelWrapper>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Generated Labels Preview */}
                    {activeTab === 'gerar' && generatedLabels.length > 0 && (
                        <div className="space-y-4 print:space-y-0">
                            {generatedLabels.map((label, idx) => (
                                <div key={label.qrcode} className={idx < generatedLabels.length - 1 ? 'print:break-after-page' : ''}>
                                    <LabelWrapper orientation="portrait">
                                        <div className="flex flex-col items-center justify-center w-full h-full">
                                            <h1 className="text-4xl font-bold font-open-sans tracking-tight mb-6">STAGE IN</h1>
                                            <QRCodeSVG value={label.qrcode} size={200} level="H" />
                                            <h2 className="text-2xl font-bold font-open-sans mt-4 text-black">
                                                {label.qrcode}
                                            </h2>
                                            <p className="text-xl font-bold font-open-sans mt-2 text-black">
                                                SÉRIE: {label.serie}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-4 print:block hidden">
                                                Impresso em: {printDateTime}
                                            </p>
                                        </div>
                                    </LabelWrapper>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!selectedFromTable && ((activeTab === 'buscar' && !searchResult) || (activeTab === 'lote' && batchResults.length === 0) || (activeTab === 'gerar' && generatedLabels.length === 0)) && (
                        <div className="print:hidden flex items-center justify-center h-96 text-gray-400">
                            <p>Clique em uma linha da tabela ou faça uma busca</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

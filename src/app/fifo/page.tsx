'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Search, Printer, Loader2, Plus, Link2, Package, RefreshCw, ChevronLeft, ChevronRight, Trash2, Lock, AlertTriangle, RotateCcw, X, Edit2, History, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { LabelWrapper } from '@/components/LabelAssets';

type FifoData = {
    qrcode: string;
    id_um: string;
    id_dois: string;
    serie: string;
    impresso?: string;
};

type TabType = 'buscar' | 'gerar' | 'lote' | 'vincular' | 'reimprimir' | 'historico';

// Componente de Etiqueta FIFO reutilizável (Layout CG_PADRAO)
const FifoLabel = ({ data, printDateTime }: { data: FifoData; printDateTime: string }) => (
    <LabelWrapper orientation="portrait" bgType="qrcode">
        <div className="flex flex-col items-center justify-between w-full h-full py-0">
            {/* Header: Data/Hora (logo SPX já está no background) */}
            <div className="w-full flex justify-start px-0">
                <span className="text-sm font-bold text-black font-open-sans">{printDateTime}</span>
            </div>

            {/* Título STAGE IN */}
            <h1 className="text-5xl font-black font-open-sans tracking-tight text-black">STAGE IN</h1>

            {/* Código da Gaiola */}
            <h2 className="text-5xl font-bold font-open-sans text-black">{data.qrcode}</h2>

            {/* QRCode */}
            <QRCodeSVG value={data.qrcode} size={280} level="H" />

            {/* Série */}
            <p className="text-xl font-bold font-open-sans text-black">SÉRIE: {data.serie}</p>
        </div>
    </LabelWrapper>
);

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
    const [selectedLabels, setSelectedLabels] = useState<Map<string, FifoData>>(new Map());
    const [selectAll, setSelectAll] = useState(false);

    // === BARRA DE PROGRESSO ===
    const [generateProgress, setGenerateProgress] = useState(0);

    // === BUSCAR ===
    const [searchId, setSearchId] = useState('');
    const [searchResult, setSearchResult] = useState<FifoData | null>(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    // === GERAR EM MASSA ===
    const [generateQty, setGenerateQty] = useState(1);
    const [generateMode, setGenerateMode] = useState<'sequential' | 'random'>('sequential');
    const [generating, setGenerating] = useState(false);
    const [generatedLabels, setGeneratedLabels] = useState<FifoData[]>([]);

    // === IMPRESSÃO EM LOTE ===
    const [batchIds, setBatchIds] = useState('');
    const [batchResults, setBatchResults] = useState<FifoData[]>([]);
    const [batchNotFound, setBatchNotFound] = useState<string[]>([]);
    const [loadingBatch, setLoadingBatch] = useState(false);
    const batchInputRef = useRef<HTMLTextAreaElement>(null);

    // === REIMPRIMIR (AppSheet) ===
    const [reprintLabels, setReprintLabels] = useState<FifoData[]>([]);
    const [reprintNotFound, setReprintNotFound] = useState<string[]>([]);
    const [reprintTotal, setReprintTotal] = useState(0);
    const [loadingReprint, setLoadingReprint] = useState(false);
    const [clearingReprint, setClearingReprint] = useState(false);

    // === TAREFAS (Nova Fila) ===
    type Tarefa = {
        tarefa_id: string;
        data_criacao: string;
        status: string;
        responsavel: string;
    };
    const [tasks, setTasks] = useState<Tarefa[]>([]);
    const [selectedTask, setSelectedTask] = useState<Tarefa | null>(null);
    const [taskLabels, setTaskLabels] = useState<FifoData[]>([]);
    const [taskNotFound, setTaskNotFound] = useState<string[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [loadingTaskLabels, setLoadingTaskLabels] = useState(false);

    // === EDIÇÃO DE VÍNCULOS ===
    const [editingLabel, setEditingLabel] = useState<FifoData | null>(null);
    const [editIdUm, setEditIdUm] = useState('');
    const [editIdDois, setEditIdDois] = useState('');
    const [saving, setSaving] = useState(false);

    // === VINCULAR ===
    const [linkQrcode, setLinkQrcode] = useState('');
    const [linkIdUm, setLinkIdUm] = useState('');
    const [linkIdDois, setLinkIdDois] = useState('');
    const [linking, setLinking] = useState(false);
    const [linkMessage, setLinkMessage] = useState('');

    // === HISTÓRICO ===
    const [historyData, setHistoryData] = useState<FifoData[]>([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // === MODAL IMPRESSÃO TOTAL ===
    const [showPrintAllModal, setShowPrintAllModal] = useState(false);
    const [loadingPrintAll, setLoadingPrintAll] = useState(false);

    // Tabelas Vincular
    const [unlinkedData, setUnlinkedData] = useState<FifoData[]>([]);
    const [linkedData, setLinkedData] = useState<FifoData[]>([]);
    const [loadingLinkTable, setLoadingLinkTable] = useState(false);

    // Paginação das tabelas de vinculados
    const [unlinkedPage, setUnlinkedPage] = useState(1);
    const [linkedPage, setLinkedPage] = useState(1);
    const LINK_PAGE_SIZE = 15;

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
                body: JSON.stringify({ quantity: generateQty, mode: generateMode })
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

    // === REIMPRIMIR (AppSheet) ===
    const loadReprint = async () => {
        setLoadingReprint(true);
        setReprintLabels([]);
        setReprintNotFound([]);

        try {
            const res = await fetch(`/api/fifo/reprint?t=${Date.now()}`);
            const json = await res.json();
            if (json.success) {
                setReprintLabels(json.found || []);
                setReprintNotFound(json.notFound || []);
                setReprintTotal(json.total || 0);
            }
        } catch {
            alert('Erro ao carregar fila de reimpressão.');
        } finally {
            setLoadingReprint(false);
        }
    };

    const clearReprint = async () => {
        if (!confirm('Deseja limpar a fila de reimpressão após imprimir?')) return;
        setClearingReprint(true);

        try {
            const res = await fetch('/api/fifo/reprint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const json = await res.json();
            if (json.success) {
                setReprintLabels([]);
                setReprintNotFound([]);
                setReprintTotal(0);
            }
        } catch {
            alert('Erro ao limpar fila.');
        } finally {
            setClearingReprint(false);
        }
    };

    // === TAREFAS ===
    const loadTasks = async () => {
        setLoadingTasks(true);
        setTasks([]);
        setSelectedTask(null);
        setTaskLabels([]);
        setTaskNotFound([]);

        try {
            const res = await fetch(`/api/fifo/tasks?t=${Date.now()}`);
            const json = await res.json();
            if (json.success) {
                setTasks(json.data || []);
            }
        } catch {
            alert('Erro ao carregar tarefas.');
        } finally {
            setLoadingTasks(false);
        }
    };

    const loadTaskLabels = async (tarefa: Tarefa) => {
        setSelectedTask(tarefa);
        setLoadingTaskLabels(true);
        setTaskLabels([]);
        setTaskNotFound([]);

        try {
            const res = await fetch(`/api/fifo/tasks/${tarefa.tarefa_id}?t=${Date.now()}`);
            const json = await res.json();
            if (json.success) {
                setTaskLabels(json.found || []);
                setTaskNotFound(json.notFound || []);
            }
        } catch {
            alert('Erro ao carregar etiquetas da tarefa.');
        } finally {
            setLoadingTaskLabels(false);
        }
    };

    const handlePrint = async () => {
        // Coletar todos os QRCodes que serão impressos
        const qrcodes: string[] = [];

        // Do espelho selecionados
        if (selectedLabels.size > 0) {
            selectedLabels.forEach((_, qr) => qrcodes.push(qr));
        }
        // Da busca
        else if (searchResult) {
            qrcodes.push(searchResult.qrcode);
        }
        // Do item selecionado na tabela
        else if (selectedFromTable) {
            qrcodes.push(selectedFromTable.qrcode);
        }
        // Do lote
        else if (activeTab === 'lote' && batchResults.length > 0) {
            batchResults.forEach(r => qrcodes.push(r.qrcode));
        }
        // Das geradas
        else if (activeTab === 'gerar' && generatedLabels.length > 0) {
            generatedLabels.forEach(r => qrcodes.push(r.qrcode));
        }
        // Das tarefas
        else if (activeTab === 'reimprimir' && taskLabels.length > 0) {
            taskLabels.forEach(r => qrcodes.push(r.qrcode));
        }

        // Registrar no histórico antes de imprimir
        if (qrcodes.length > 0) {
            try {
                await fetch('/api/fifo/print', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ qrcodes })
                });
            } catch {
                console.error('Erro ao registrar impressão no histórico');
            }
        }

        window.print();
    };

    // === IMPRESSÃO TOTAL ===
    const handlePrintAll = async () => {
        setLoadingPrintAll(true);
        try {
            // Carregar TODAS as etiquetas (com e sem vínculos)
            const res = await fetch(`/api/fifo/list?page=1&pageSize=${tableStats.total}&t=${Date.now()}`);
            const json = await res.json();
            if (json.data && json.data.length > 0) {
                const allMap = new Map<string, FifoData>();
                json.data.forEach((d: FifoData) => allMap.set(d.qrcode, d));
                setSelectedLabels(allMap);
                setShowPrintAllModal(false);

                // Aguardar renderização e imprimir
                setTimeout(() => {
                    handlePrint();
                }, 500);
            }
        } catch {
            alert('Erro ao carregar etiquetas para impressão.');
        } finally {
            setLoadingPrintAll(false);
        }
    };

    // === SELEÇÃO MÚLTIPLA ===
    const toggleSelection = (row: FifoData) => {
        setSelectedLabels(prev => {
            const newMap = new Map(prev);
            if (newMap.has(row.qrcode)) {
                newMap.delete(row.qrcode);
            } else {
                newMap.set(row.qrcode, row);
            }
            return newMap;
        });
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            // Desmarcar apenas os da página atual
            setSelectedLabels(prev => {
                const newMap = new Map(prev);
                tableData.forEach(d => newMap.delete(d.qrcode));
                return newMap;
            });
        } else {
            // Adicionar todos da página atual
            setSelectedLabels(prev => {
                const newMap = new Map(prev);
                tableData.forEach(d => newMap.set(d.qrcode, d));
                return newMap;
            });
        }
        setSelectAll(!selectAll);
    };

    const getSelectedLabelsData = (): FifoData[] => {
        return Array.from(selectedLabels.values());
    };

    // === EDIÇÃO DE VÍNCULOS ===
    const openEditModal = (label: FifoData) => {
        setEditingLabel(label);
        setEditIdUm(label.id_um || '');
        setEditIdDois(label.id_dois || '');
    };

    const handleSaveEdit = async () => {
        if (!editingLabel) return;
        setSaving(true);

        try {
            const res = await fetch('/api/fifo/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qrcode: editingLabel.qrcode,
                    id_um: editIdUm,
                    id_dois: editIdDois
                })
            });
            const json = await res.json();
            if (json.success) {
                setEditingLabel(null);
                loadTableData(tablePage); // Recarregar tabela
            } else {
                alert(`Erro: ${json.error}`);
            }
        } catch {
            alert('Erro de conexão.');
        } finally {
            setSaving(false);
        }
    };

    // === HISTÓRICO ===
    const loadHistory = async (page: number = 1) => {
        setLoadingHistory(true);
        try {
            const res = await fetch(`/api/fifo/history?page=${page}&pageSize=50&t=${Date.now()}`);
            const json = await res.json();
            if (json.success) {
                setHistoryData(json.data || []);
                setHistoryPage(json.page);
                setHistoryTotalPages(json.totalPages);
                setHistoryTotal(json.total);
            }
        } catch {
            alert('Erro ao carregar histórico.');
        } finally {
            setLoadingHistory(false);
        }
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
                <button
                    onClick={() => {
                        sessionStorage.removeItem('fifo_auth');
                        setIsAuthenticated(false);
                        setAuthPassword('');
                    }}
                    className="absolute right-0 flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors text-sm cursor-pointer"
                    title="Sair"
                >
                    <Lock className="w-4 h-4" />
                    Sair
                </button>
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
                    <div className="bg-white dark:bg-neutral-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 grid grid-cols-6 gap-1">
                        <button onClick={() => setActiveTab('buscar')} className={`flex items-center justify-center p-3 rounded-lg font-bold transition-all text-sm ${activeTab === 'buscar' ? 'bg-shopee-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
                            <Search className="w-4 h-4 mr-1" /> Buscar
                        </button>
                        <button onClick={() => setActiveTab('gerar')} className={`flex items-center justify-center p-3 rounded-lg font-bold transition-all text-sm ${activeTab === 'gerar' ? 'bg-shopee-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
                            <Plus className="w-4 h-4 mr-1" /> Gerar
                        </button>
                        <button onClick={() => setActiveTab('lote')} className={`flex items-center justify-center p-3 rounded-lg font-bold transition-all text-sm ${activeTab === 'lote' ? 'bg-shopee-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
                            <Package className="w-4 h-4 mr-1" /> Lote
                        </button>
                        <button onClick={() => setActiveTab('vincular')} className={`flex items-center justify-center p-3 rounded-lg font-bold transition-all text-sm ${activeTab === 'vincular' ? 'bg-shopee-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
                            <Link2 className="w-4 h-4 mr-1" /> Vincular
                        </button>
                        <button onClick={() => { setActiveTab('reimprimir'); loadTasks(); }} className={`flex items-center justify-center p-3 rounded-lg font-bold transition-all text-sm ${activeTab === 'reimprimir' ? 'bg-shopee-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
                            <RotateCcw className="w-4 h-4 mr-1" /> Fila
                        </button>
                        <button onClick={() => { setActiveTab('historico'); loadHistory(); }} className={`flex items-center justify-center p-3 rounded-lg font-bold transition-all text-sm ${activeTab === 'historico' ? 'bg-shopee-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}`}>
                            <History className="w-4 h-4 mr-1" /> Histórico
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
                                    <div className="flex gap-2">
                                        <button onClick={handlePrint} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                                            <Printer className="w-5 h-5" /> IMPRIMIR
                                        </button>
                                        <button onClick={() => { setSearchResult(null); setSearchId(''); }} className="px-4 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer" title="Limpar visualização">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === GERAR EM MASSA === */}
                        {activeTab === 'gerar' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-shopee-primary">Gerar Etiquetas em Massa</h2>
                                <p className="text-sm text-gray-500">Cria novas etiquetas sem IDs vinculados</p>

                                {/* Seletor de Modo */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setGenerateMode('sequential')}
                                        className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors cursor-pointer ${generateMode === 'sequential'
                                            ? 'bg-shopee-primary text-white'
                                            : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                                            }`}
                                    >
                                        📋 Sequencial
                                    </button>
                                    <button
                                        onClick={() => setGenerateMode('random')}
                                        className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors cursor-pointer ${generateMode === 'random'
                                            ? 'bg-shopee-primary text-white'
                                            : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                                            }`}
                                    >
                                        🎲 Aleatório
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {generateMode === 'sequential'
                                        ? 'Preenche os CG disponíveis de CG1 a CG5000 em ordem'
                                        : 'Gera CG aleatórios únicos entre 1 e 5000'}
                                </p>

                                <div className="flex flex-col gap-1">
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min={1}
                                            value={generateQty}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setGenerateQty(isNaN(val) ? 0 : val);
                                            }}
                                            className={`flex-1 p-3 border rounded-lg bg-white dark:bg-neutral-900 focus:ring-2 outline-none ${generateQty > 100
                                                ? 'border-red-500 text-red-600 focus:ring-red-500 dark:border-red-500 dark:text-red-400'
                                                : 'border-gray-300 dark:border-neutral-600 focus:ring-shopee-primary'}`}
                                        />
                                        <button
                                            onClick={handleGenerate}
                                            disabled={generating || generateQty > 100 || generateQty < 1}
                                            className="px-6 bg-shopee-primary hover:bg-shopee-dark text-white rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                            Gerar
                                        </button>
                                    </div>
                                    {generateQty > 100 && (
                                        <p className="text-xs text-red-500 font-bold ml-1">
                                            ⚠️ Limite máximo de 100 etiquetas por vez.
                                        </p>
                                    )}
                                </div>
                                {/* Barra de Progresso */}
                                {generating && (
                                    <div className="mt-2">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Gerando etiquetas ({generateMode === 'sequential' ? 'sequencial' : 'aleatório'})...</span>
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

                        {/* === REIMPRIMIR (Tarefas Concluídas) === */}
                        {activeTab === 'reimprimir' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-shopee-primary">Tarefas Concluídas</h2>
                                    <button onClick={loadTasks} disabled={loadingTasks} className="p-1 text-gray-400 hover:text-shopee-primary transition-colors cursor-pointer group">
                                        <RefreshCw className={`w-4 h-4 ${loadingTasks ? 'animate-spin' : ''} group-hover:scale-110 transition-transform`} />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500">Selecione uma tarefa para ver as etiquetas</p>

                                <a
                                    href="https://www.appsheet.com/newshortcut/4428a6e7-9e1e-474b-9022-6614729f7a3d"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full p-3 my-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-sm border border-blue-800 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 group"
                                >
                                    <div className="p-2 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                                        <ExternalLink className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex flex-col items-start leading-tight">
                                        <span className="font-bold text-sm">Abrir App de Gestão de Gaiolas</span>
                                        <span className="text-[11px] opacity-90 font-medium">Vincular ID_UM e DOIS (AppSheet)</span>
                                    </div>
                                </a>

                                {loadingTasks ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-shopee-primary" />
                                    </div>
                                ) : tasks.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <RotateCcw className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p>Nenhuma tarefa concluída</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Lista de Tarefas */}
                                        <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-neutral-700 rounded-lg">
                                            {tasks.map((tarefa) => (
                                                <button
                                                    key={tarefa.tarefa_id}
                                                    onClick={() => loadTaskLabels(tarefa)}
                                                    className={`w-full text-left p-3 border-b border-gray-100 dark:border-neutral-700 last:border-0 transition-colors cursor-pointer ${selectedTask?.tarefa_id === tarefa.tarefa_id
                                                        ? 'bg-shopee-primary/10 border-l-4 border-l-shopee-primary'
                                                        : 'hover:bg-gray-50 dark:hover:bg-neutral-700'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-mono text-sm font-bold">{tarefa.tarefa_id}</span>
                                                        <span className="text-xs text-gray-400">{tarefa.responsavel}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">{tarefa.data_criacao}</div>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Etiquetas da Tarefa Selecionada */}
                                        {selectedTask && (
                                            <div className="mt-4 p-3 bg-gray-50 dark:bg-neutral-700/50 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-sm">Etiquetas: {selectedTask.tarefa_id}</span>
                                                    {loadingTaskLabels && <Loader2 className="w-4 h-4 animate-spin text-shopee-primary" />}
                                                </div>

                                                {!loadingTaskLabels && (
                                                    <>
                                                        {taskLabels.length > 0 && (
                                                            <p className="text-sm font-bold text-blue-600 mb-2">
                                                                ✅ {taskLabels.length} etiqueta(s) encontrada(s)
                                                            </p>
                                                        )}
                                                        {taskNotFound.length > 0 && (
                                                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mb-2">
                                                                <p className="text-xs font-bold text-red-600 dark:text-red-400">
                                                                    ❌ {taskNotFound.length} não encontrado(s):
                                                                </p>
                                                                <div className="text-xs text-red-500 dark:text-red-300 font-mono mt-1 break-all">
                                                                    {taskNotFound.join(', ')}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {taskLabels.length > 0 && (
                                                            <button onClick={handlePrint} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                                                                <Printer className="w-5 h-5" /> IMPRIMIR
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === HISTÓRICO === */}
                        {activeTab === 'historico' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-shopee-primary">Histórico de Impressões</h2>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">{historyTotal} registro(s)</span>
                                        <button onClick={() => loadHistory(historyPage)} disabled={loadingHistory} className="p-1 text-gray-400 hover:text-shopee-primary transition-colors cursor-pointer group">
                                            <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''} group-hover:scale-110 transition-transform`} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500">Etiquetas marcadas como impressas</p>

                                {loadingHistory ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-shopee-primary" />
                                    </div>
                                ) : historyData.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p>Nenhuma impressão registrada</p>
                                    </div>
                                ) : (
                                    <div className="max-h-[200px] overflow-y-auto border border-gray-200 dark:border-neutral-700 rounded-lg">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-50 dark:bg-neutral-700 sticky top-0">
                                                <tr>
                                                    <th className="px-2 py-1.5 text-left font-semibold">QRCode</th>
                                                    <th className="px-2 py-1.5 text-left font-semibold">Impresso</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {historyData.map((row, idx) => (
                                                    <tr key={row.qrcode + idx} className="border-t border-gray-100 dark:border-neutral-700">
                                                        <td className="px-2 py-1 font-mono font-bold">{row.qrcode}</td>
                                                        <td className="px-2 py-1 text-xs text-green-600">{row.impresso}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Paginação */}
                                {historyTotalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-2">
                                        <button
                                            onClick={() => loadHistory(historyPage - 1)}
                                            disabled={historyPage === 1 || loadingHistory}
                                            className="px-3 py-1 rounded bg-gray-100 dark:bg-neutral-700 disabled:opacity-50 text-sm"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-sm text-gray-500">{historyPage} / {historyTotalPages}</span>
                                        <button
                                            onClick={() => loadHistory(historyPage + 1)}
                                            disabled={historyPage >= historyTotalPages || loadingHistory}
                                            className="px-3 py-1 rounded bg-gray-100 dark:bg-neutral-700 disabled:opacity-50 text-sm"
                                        >
                                            Próximo
                                        </button>
                                    </div>
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
                                <button
                                    onClick={() => setShowPrintAllModal(true)}
                                    className="ml-1 bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded font-medium flex items-center gap-1 transition-colors"
                                    title="Imprimir todas as etiquetas"
                                >
                                    <Printer className="w-3 h-3" /> Todos
                                </button>
                            </div>
                        </div>

                        {/* Tabela Compacta */}
                        <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-100 dark:bg-neutral-700 sticky top-0">
                                    <tr>
                                        <th className="px-2 py-1.5 text-center w-8">
                                            <input
                                                type="checkbox"
                                                checked={selectAll && tableData.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-3.5 h-3.5 rounded border-gray-300 text-shopee-primary focus:ring-shopee-primary cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-2 py-1.5 text-left font-semibold">QRCode</th>
                                        <th className="px-2 py-1.5 text-left font-semibold">ID_UM</th>
                                        <th className="px-2 py-1.5 text-left font-semibold">ID_DOIS</th>
                                        <th className="px-2 py-1.5 text-left font-semibold">Série</th>
                                        <th className="px-2 py-1.5 text-center w-8">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.map((row, idx) => (
                                        <tr
                                            key={row.qrcode + idx}
                                            className={`border-t border-gray-100 dark:border-neutral-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors ${!row.id_um && !row.id_dois ? 'bg-amber-50 dark:bg-amber-900/10' : ''} ${selectedLabels.has(row.qrcode) ? 'bg-shopee-primary/10' : ''}`}
                                        >
                                            <td className="px-2 py-1 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLabels.has(row.qrcode)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        toggleSelection(row);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-3.5 h-3.5 rounded border-gray-300 text-shopee-primary focus:ring-shopee-primary cursor-pointer"
                                                />
                                            </td>
                                            <td
                                                className="px-2 py-1 font-mono font-bold"
                                                onClick={() => {
                                                    setSelectedFromTable(row);
                                                    setSearchResult(null);
                                                }}
                                            >
                                                {row.qrcode}
                                            </td>
                                            <td className="px-2 py-1 truncate max-w-[80px]">{row.id_um || <span className="text-gray-400">-</span>}</td>
                                            <td className="px-2 py-1 truncate max-w-[80px]">{row.id_dois || <span className="text-gray-400">-</span>}</td>
                                            <td className="px-2 py-1 font-mono">{row.serie}</td>
                                            <td className="px-2 py-1 text-center">
                                                {(row.id_um || row.id_dois) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditModal(row);
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="Editar vínculos"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {tableData.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-2 py-4 text-center text-gray-400">
                                                {loadingTable ? 'Carregando...' : 'Nenhum registro'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Botão Imprimir Selecionados */}
                        {selectedLabels.size > 0 && (
                            <div className="px-2 py-2 border-t border-gray-200 dark:border-neutral-700 bg-shopee-primary/5">
                                <button
                                    onClick={() => {
                                        // Atualizar preview com selecionados
                                        setSelectedFromTable(null);
                                        setSearchResult(null);
                                        setActiveTab('buscar');
                                        handlePrint();
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
                                >
                                    <Printer className="w-4 h-4" /> Imprimir {selectedLabels.size} Selecionado(s)
                                </button>
                            </div>
                        )}

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
                                <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-neutral-700 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left">QRCode</th>
                                                <th className="px-4 py-2 text-left">Série</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {unlinkedData.slice((unlinkedPage - 1) * LINK_PAGE_SIZE, unlinkedPage * LINK_PAGE_SIZE).map((row, idx) => (
                                                <tr key={`${row.qrcode}-${idx}`} className="border-t border-gray-100 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer" onClick={() => setLinkQrcode(row.qrcode)}>
                                                    <td className="px-4 py-2 font-mono font-bold text-gray-700 dark:text-gray-300">{row.qrcode}</td>
                                                    <td className="px-4 py-2 font-mono text-gray-500">{row.serie}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Paginação Não Vinculados */}
                                {unlinkedData.length > LINK_PAGE_SIZE && (
                                    <div className="px-4 py-2 border-t border-gray-200 dark:border-neutral-700 flex items-center justify-between text-xs">
                                        <span className="text-gray-500">
                                            {((unlinkedPage - 1) * LINK_PAGE_SIZE) + 1}-{Math.min(unlinkedPage * LINK_PAGE_SIZE, unlinkedData.length)} de {unlinkedData.length}
                                        </span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setUnlinkedPage(p => Math.max(1, p - 1))}
                                                disabled={unlinkedPage === 1}
                                                className="px-2 py-1 rounded bg-gray-100 dark:bg-neutral-700 disabled:opacity-50 cursor-pointer"
                                            >
                                                <ChevronLeft className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => setUnlinkedPage(p => Math.min(Math.ceil(unlinkedData.length / LINK_PAGE_SIZE), p + 1))}
                                                disabled={unlinkedPage >= Math.ceil(unlinkedData.length / LINK_PAGE_SIZE)}
                                                className="px-2 py-1 rounded bg-gray-100 dark:bg-neutral-700 disabled:opacity-50 cursor-pointer"
                                            >
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tabela 2: Gaiolas COM VÍNCULO */}
                            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden">
                                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-neutral-700 flex justify-between">
                                    <span className="font-bold text-blue-700 dark:text-blue-400">✅ Gaiolas COM Vínculo</span>
                                    <span className="text-xs bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100 px-2 py-0.5 rounded-full">{linkedData.length}</span>
                                </div>
                                <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
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
                                            {linkedData.slice((linkedPage - 1) * LINK_PAGE_SIZE, linkedPage * LINK_PAGE_SIZE).map((row, idx) => (
                                                <tr key={`${row.qrcode}-${idx}`} className="border-t border-gray-100 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700">
                                                    <td className="px-4 py-2 font-mono font-bold text-gray-700 dark:text-gray-300">{row.qrcode}</td>
                                                    <td className="px-4 py-2 truncate max-w-[100px]">{row.id_um}</td>
                                                    <td className="px-4 py-2 truncate max-w-[100px]">{row.id_dois}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button
                                                            onClick={() => handleClearId(row.qrcode)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors cursor-pointer"
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
                                {/* Paginação Vinculados */}
                                {linkedData.length > LINK_PAGE_SIZE && (
                                    <div className="px-4 py-2 border-t border-gray-200 dark:border-neutral-700 flex items-center justify-between text-xs">
                                        <span className="text-gray-500">
                                            {((linkedPage - 1) * LINK_PAGE_SIZE) + 1}-{Math.min(linkedPage * LINK_PAGE_SIZE, linkedData.length)} de {linkedData.length}
                                        </span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setLinkedPage(p => Math.max(1, p - 1))}
                                                disabled={linkedPage === 1}
                                                className="px-2 py-1 rounded bg-gray-100 dark:bg-neutral-700 disabled:opacity-50 cursor-pointer"
                                            >
                                                <ChevronLeft className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => setLinkedPage(p => Math.min(Math.ceil(linkedData.length / LINK_PAGE_SIZE), p + 1))}
                                                disabled={linkedPage >= Math.ceil(linkedData.length / LINK_PAGE_SIZE)}
                                                className="px-2 py-1 rounded bg-gray-100 dark:bg-neutral-700 disabled:opacity-50 cursor-pointer"
                                            >
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Single Label Preview - Apenas se NÃO estiver em 'vincular' */}
                    {/* Preview da Tabela Espelho */}
                    {selectedFromTable && !searchResult && selectedLabels.size === 0 && activeTab !== 'lote' && activeTab !== 'gerar' && activeTab !== 'vincular' && (
                        <div>
                            <div className="text-center text-sm text-gray-500 mb-2 print:hidden">Clique para visualizar</div>
                            <FifoLabel data={selectedFromTable} printDateTime={printDateTime} />
                        </div>
                    )}

                    {/* Selected Labels Preview - Múltiplas do espelho */}
                    {selectedLabels.size > 0 && (
                        <div className="space-y-4 print:space-y-0">
                            {getSelectedLabelsData().map((label, idx) => (
                                <div key={label.qrcode} className={idx < selectedLabels.size - 1 ? 'print:break-after-page' : ''}>
                                    <FifoLabel data={label} printDateTime={printDateTime} />
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'buscar' && searchResult && (
                        <FifoLabel data={searchResult} printDateTime={printDateTime} />
                    )}

                    {/* Batch Print Preview */}
                    {activeTab === 'lote' && batchResults.length > 0 && (
                        <div className="space-y-4 print:space-y-0">
                            {batchResults.map((label, idx) => (
                                <div key={label.qrcode} className={idx < batchResults.length - 1 ? 'print:break-after-page' : ''}>
                                    <FifoLabel data={label} printDateTime={printDateTime} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Generated Labels Preview */}
                    {activeTab === 'gerar' && generatedLabels.length > 0 && (
                        <div className="space-y-4 print:space-y-0">
                            {generatedLabels.map((label, idx) => (
                                <div key={label.qrcode} className={idx < generatedLabels.length - 1 ? 'print:break-after-page' : ''}>
                                    <FifoLabel data={label} printDateTime={printDateTime} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Task Labels Preview */}
                    {activeTab === 'reimprimir' && taskLabels.length > 0 && (
                        <div className="space-y-4 print:space-y-0">
                            {taskLabels.map((label, idx) => (
                                <div key={label.qrcode} className={idx < taskLabels.length - 1 ? 'print:break-after-page' : ''}>
                                    <FifoLabel data={label} printDateTime={printDateTime} />
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

            {/* Modal de Edição de Vínculos */}
            {editingLabel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                Editar Vínculos
                            </h3>
                            <button
                                onClick={() => setEditingLabel(null)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="text-center p-3 bg-gray-50 dark:bg-neutral-700 rounded-lg">
                                <span className="font-mono font-bold text-xl text-shopee-primary">
                                    {editingLabel.qrcode}
                                </span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    ID_UM
                                </label>
                                <input
                                    type="text"
                                    value={editIdUm}
                                    onChange={(e) => setEditIdUm(e.target.value)}
                                    className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-shopee-primary outline-none"
                                    placeholder="Lacre de identificação 1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    ID_DOIS
                                </label>
                                <input
                                    type="text"
                                    value={editIdDois}
                                    onChange={(e) => setEditIdDois(e.target.value)}
                                    className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-shopee-primary outline-none"
                                    placeholder="Lacre de identificação 2"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setEditingLabel(null)}
                                    className="flex-1 py-3 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={saving}
                                    className="flex-1 py-3 bg-shopee-primary hover:bg-shopee-dark text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação - Imprimir Todos */}
            {showPrintAllModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex flex-col items-center mb-4">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white text-center">
                                Imprimir TODAS as Etiquetas?
                            </h3>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
                            <p className="text-amber-800 dark:text-amber-300 text-sm text-center">
                                <strong>⚠️ Atenção:</strong> Esta ação irá carregar e imprimir <strong>{tableStats.total}</strong> etiquetas
                                (com e sem vínculos). O processo pode ser demorado dependendo da quantidade de registros.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPrintAllModal(false)}
                                disabled={loadingPrintAll}
                                className="flex-1 py-3 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handlePrintAll}
                                disabled={loadingPrintAll}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {loadingPrintAll ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Carregando...
                                    </>
                                ) : (
                                    <>
                                        <Printer className="w-5 h-5" />
                                        Confirmar Impressão
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Lock, LogOut, Save, Shield } from 'lucide-react';

type AdminConfig = {
    fifoEnabled: boolean;
    norseEnabled: boolean;
    recebimentoEnabled: boolean;
    regrasEnabled: boolean;
};

const DEFAULT_CONFIG: AdminConfig = {
    fifoEnabled: true,
    norseEnabled: false,
    recebimentoEnabled: true,
    regrasEnabled: true
};

export default function AdminPage() {
    const [config, setConfig] = useState<AdminConfig>(DEFAULT_CONFIG);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [newFifoPassword, setNewFifoPassword] = useState('');
    const [fifoPasswordState, setFifoPasswordState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const loadConfig = async () => {
        setCheckingAuth(true);
        setError('');

        try {
            const res = await fetch('/api/admin/config', { cache: 'no-store' });
            if (res.status === 401) {
                setIsAuthenticated(false);
                return;
            }

            const json = await res.json();
            setConfig({
                fifoEnabled: json?.modules?.fifo?.enabled ?? true,
                norseEnabled: json?.modules?.norse?.enabled ?? false,
                recebimentoEnabled: json?.modules?.recebimento?.enabled ?? true,
                regrasEnabled: json?.modules?.regras?.enabled ?? true
            });
            setIsAuthenticated(true);
        } catch {
            setError('Erro ao carregar configuracoes.');
        } finally {
            setCheckingAuth(false);
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const handleLogin = async () => {
        if (!password.trim()) return;
        setAuthLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const json = await res.json();

            if (res.ok && json.valid) {
                setPassword('');
                await loadConfig();
            } else {
                setIsAuthenticated(false);
                setError(json.error || 'Senha incorreta.');
            }
        } catch {
            setError('Erro de conexao.');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSave = async () => {
        setSaveState('saving');
        setError('');

        try {
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entries: {
                        'module.fifo.enabled': config.fifoEnabled,
                        'module.norse.enabled': config.norseEnabled,
                        'module.recebimento.enabled': config.recebimentoEnabled,
                        'module.regras.enabled': config.regrasEnabled
                    }
                })
            });

            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.error || 'Erro ao salvar configuracoes.');
            }

            setSaveState('saved');
            setTimeout(() => setSaveState('idle'), 1500);
        } catch (err) {
            setSaveState('error');
            setError(err instanceof Error ? err.message : 'Erro ao salvar configuracoes.');
        }
    };

    const handleSaveFifoPassword = async () => {
        if (!newFifoPassword.trim()) return;
        setFifoPasswordState('saving');
        
        try {
            const res = await fetch('/api/admin/fifo-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newFifoPassword })
            });

            if (!res.ok) {
                throw new Error('Erro ao salvar senha FIFO');
            }

            setFifoPasswordState('saved');
            setNewFifoPassword('');
            setTimeout(() => setFifoPasswordState('idle'), 3000);
        } catch (err) {
            setFifoPasswordState('error');
            setTimeout(() => setFifoPasswordState('idle'), 3000);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        setIsAuthenticated(false);
        setConfig(DEFAULT_CONFIG);
        setPassword('');
        setSaveState('idle');
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-shopee-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center p-8">
                <div className="bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-md">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-shopee-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-shopee-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Painel Administrativo</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Acesso restrito</p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            placeholder="Digite a senha"
                            className="w-full p-4 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-shopee-primary outline-none text-center text-lg tracking-widest"
                            autoFocus
                        />
                        {error && (
                            <p className="text-red-500 text-sm text-center">{error}</p>
                        )}
                        <button
                            onClick={handleLogin}
                            disabled={authLoading}
                            className="w-full bg-shopee-primary hover:bg-shopee-dark text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                            Entrar
                        </button>
                    </div>

                    <div className="mt-6 text-center">
                        <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-shopee-primary text-sm">
                            ← Voltar para o Inicio
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 p-8 text-gray-900 dark:text-gray-100">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-shopee-primary transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Voltar
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-shopee-primary/10 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-shopee-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Painel de Controle</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ative ou desative modulos do sistema</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-4 p-4 border border-gray-200 dark:border-neutral-700 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold">Etiquetas FIFO</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Bloqueia acesso ao modulo e ao menu</p>
                                </div>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.fifoEnabled}
                                        onChange={(e) => setConfig(prev => ({ ...prev, fifoEnabled: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-12 h-6 rounded-full transition-colors ${config.fifoEnabled ? 'bg-shopee-primary' : 'bg-gray-300 dark:bg-neutral-600'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${config.fifoEnabled ? 'translate-x-6' : 'translate-x-1'} translate-y-0.5`} />
                                    </div>
                                </label>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                                <h3 className="text-sm font-semibold mb-2">Alterar Senha do Modulo FIFO</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={newFifoPassword}
                                        onChange={(e) => setNewFifoPassword(e.target.value)}
                                        placeholder="Nova senha FIFO"
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-shopee-primary outline-none text-sm"
                                    />
                                    <button
                                        onClick={handleSaveFifoPassword}
                                        disabled={fifoPasswordState === 'saving' || !newFifoPassword.trim()}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-800 dark:text-gray-100 rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 text-sm"
                                    >
                                        {fifoPasswordState === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Salvar
                                    </button>
                                </div>
                                {fifoPasswordState === 'saved' && <p className="text-sm text-green-600 mt-2">Senha FIFO atualizada com sucesso!</p>}
                                {fifoPasswordState === 'error' && <p className="text-sm text-red-500 mt-2">Erro ao atualizar senha.</p>}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-neutral-700 rounded-xl">
                            <div>
                                <h2 className="font-semibold">Identificacao de Gaiolas</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Bloqueia acesso ao modulo e ao menu</p>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.norseEnabled}
                                    onChange={(e) => setConfig(prev => ({ ...prev, norseEnabled: e.target.checked }))}
                                    className="sr-only"
                                />
                                <div className={`w-12 h-6 rounded-full transition-colors ${config.norseEnabled ? 'bg-shopee-primary' : 'bg-gray-300 dark:bg-neutral-600'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${config.norseEnabled ? 'translate-x-6' : 'translate-x-1'} translate-y-0.5`} />
                                </div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-neutral-700 rounded-xl">
                            <div>
                                <h2 className="font-semibold">Recebimento</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Bloqueia acesso ao modulo e ao menu</p>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.recebimentoEnabled}
                                    onChange={(e) => setConfig(prev => ({ ...prev, recebimentoEnabled: e.target.checked }))}
                                    className="sr-only"
                                />
                                <div className={`w-12 h-6 rounded-full transition-colors ${config.recebimentoEnabled ? 'bg-shopee-primary' : 'bg-gray-300 dark:bg-neutral-600'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${config.recebimentoEnabled ? 'translate-x-6' : 'translate-x-1'} translate-y-0.5`} />
                                </div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-neutral-700 rounded-xl">
                            <div>
                                <h2 className="font-semibold">Status de Pacotes</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Bloqueia acesso ao modulo e ao menu</p>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.regrasEnabled}
                                    onChange={(e) => setConfig(prev => ({ ...prev, regrasEnabled: e.target.checked }))}
                                    className="sr-only"
                                />
                                <div className={`w-12 h-6 rounded-full transition-colors ${config.regrasEnabled ? 'bg-shopee-primary' : 'bg-gray-300 dark:bg-neutral-600'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${config.regrasEnabled ? 'translate-x-6' : 'translate-x-1'} translate-y-0.5`} />
                                </div>
                            </label>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 text-sm text-red-500">{error}</div>
                    )}

                    <div className="mt-6 flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saveState === 'saving'}
                            className="px-4 py-2 bg-shopee-primary hover:bg-shopee-dark text-white rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {saveState === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saveState === 'saving' ? 'Salvando...' : 'Salvar Alteracoes'}
                        </button>
                        {saveState === 'saved' && (
                            <span className="text-sm text-green-600">Alteracoes salvas.</span>
                        )}
                        {saveState === 'error' && (
                            <span className="text-sm text-red-500">Falha ao salvar.</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

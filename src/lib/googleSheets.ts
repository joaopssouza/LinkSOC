import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Configurar as credenciais a partir das variáveis de ambiente
const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Fix for newline characters in env vars
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

export const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID || '', serviceAccountAuth);

export async function loadSheet() {
    await doc.loadInfo();
    return doc;
}

// ========================
// REGRAS DE FLUXO
// ========================

export type Regra = {
    Status: string;
    Fluxo: string;
    Significado: string;
    Cor: string; // 'Verde' | 'Vermelho' | 'Amarelo'
};

export async function fetchRegrasFromSheet(): Promise<Regra[]> {
    await loadSheet();
    // Prioriza 'FLOW_STATUS', fallback para 'Regras' ou índice 0
    const sheet = doc.sheetsByTitle['FLOW_STATUS'] || doc.sheetsByTitle['Regras'] || doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    return rows.map((row: any) => ({
        Status: row.get('Status') || '',
        Fluxo: row.get('Fluxo') || '',
        Significado: row.get('Significado') || '',
        Cor: row.get('Cor') || 'Cinza'
    }));
}

// ========================
// FIFO - ETIQUETAS DE GAIOLA
// ========================

export type FifoData = {
    qrcode: string;      // Coluna A - CG0001
    id_um: string;       // Coluna B - ID_UM
    id_dois: string;     // Coluna C - ID_DOIS
    serie: string;       // Coluna D - Serie (0001)
    impresso?: string;   // Coluna E - Impresso (Sim/Não)
};

/**
 * Busca uma etiqueta FIFO por QRCode (CGxxxx), ID_UM ou ID_DOIS
 * @param scanId O valor escaneado (pode ser QRCode, ID_UM ou ID_DOIS)
 * @returns Dados da etiqueta ou null se não encontrado
 */
export async function getFifoByScanId(scanId: string): Promise<FifoData | null> {
    // Mock return if no credentials
    if (!process.env.GOOGLE_SHEET_ID) {
        return {
            qrcode: 'CG9999',
            id_um: scanId,
            id_dois: '',
            serie: '9999'
        };
    }

    await loadSheet();
    // Prioriza 'ID_GAIOLA', fallback para 'FIFO' ou índice 1
    const sheet = doc.sheetsByTitle['ID_GAIOLA'] || doc.sheetsByTitle['FIFO'] || doc.sheetsByIndex[1];
    const rows = await sheet.getRows();

    // Busca por QRCode, ID_UM OU ID_DOIS
    const row = rows.find((r: any) => {
        const qrcode = r.get('QRCode') || r.get(sheet.headerValues[0]) || '';
        return qrcode.toUpperCase() === scanId.toUpperCase() ||
            r.get('ID_UM') === scanId ||
            r.get('ID_DOIS') === scanId;
    });

    if (!row) return null;

    return {
        qrcode: row.get('QRCode') || row.get(sheet.headerValues[0]) || '',
        id_um: row.get('ID_UM') || '',
        id_dois: row.get('ID_DOIS') || '',
        serie: row.get('Serie') || row.get('SERIE') || ''
    };
}

/**
 * Busca múltiplas etiquetas por lista de IDs (para impressão em lote)
 * Remove duplicatas automaticamente (mesmo QRCode)
 */
export async function getFifoByMultipleIds(scanIds: string[]): Promise<{ found: FifoData[], notFound: string[] }> {
    if (!process.env.GOOGLE_SHEET_ID) {
        return {
            found: scanIds.map((id, idx) => ({
                qrcode: `CG${String(idx + 1).padStart(4, '0')}`,
                id_um: id,
                id_dois: '',
                serie: String(idx + 1).padStart(4, '0')
            })),
            notFound: []
        }
    }

    await loadSheet();
    const sheet = doc.sheetsByTitle['ID_GAIOLA'] || doc.sheetsByTitle['FIFO'] || doc.sheetsByIndex[1];
    const rows = await sheet.getRows();

    const foundQRCodes = new Set<string>();
    const results: FifoData[] = [];
    const notFound: string[] = [];

    // Valid Ids (remove empty strings)
    const validScanIds = scanIds.map(s => s.trim()).filter(Boolean);

    for (const scanId of validScanIds) {
        const row = rows.find((r: any) =>
            r.get('ID_UM') === scanId || r.get('ID_DOIS') === scanId
        );

        if (row) {
            const qrcode = row.get('QRCode') || row.get(sheet.headerValues[0]) || '';

            // Ignorar duplicatas
            if (!foundQRCodes.has(qrcode)) {
                foundQRCodes.add(qrcode);
                results.push({
                    qrcode,
                    id_um: row.get('ID_UM') || '',
                    id_dois: row.get('ID_DOIS') || '',
                    serie: row.get('Serie') || row.get('SERIE') || ''
                });
            }
        } else {
            notFound.push(scanId);
        }
    }

    return { found: results, notFound };
}

export type GenerateMode = 'sequential' | 'random';

// Limite máximo de CG
export const MAX_CG_NUMBER = 5000;

/**
 * Gera N etiquetas em massa (QRCode + Serie, sem IDs vinculados)
 * - CG vai de CG0001 a CG5000 (independente da Serie)
 * - Serie é autoincremento separado
 * - Modo 'sequential': preenche os "buracos" na sequência de CG
 * - Modo 'random': gera CG aleatórios únicos entre 0001 e 5000
 * @param quantity Quantidade de etiquetas a gerar
 * @param mode 'sequential' ou 'random'
 * @returns Lista de novas etiquetas criadas
 */
/**
 * Gera N etiquetas em massa (QRCode + Serie, sem IDs vinculados)
 * - CG vai de CG1 a CG5000 (sem zeros à esquerda)
 * - Serie é autoincremento separado (mantém zeros à esquerda conforme padrão)
 * - Modo 'sequential': preenche os "buracos" na sequência
 * - Modo 'random': gera CG aleatórios únicos
 * - GRAVAÇÃO EM LOTE: Usa addRows para evitar sobrecarga na API
 * @param quantity Quantidade de etiquetas a gerar
 * @param mode 'sequential' ou 'random'
 * @returns Lista de novas etiquetas criadas
 */
export async function createBatchQRCodes(quantity: number, mode: GenerateMode = 'sequential'): Promise<FifoData[]> {
    if (!process.env.GOOGLE_SHEET_ID) {
        const results: FifoData[] = [];
        for (let i = 1; i <= quantity; i++) {
            const cgNum = mode === 'random' ? Math.floor(Math.random() * MAX_CG_NUMBER) + 1 : i;
            results.push({
                qrcode: `CG${cgNum}`, // Sem zeros à esquerda
                id_um: '',
                id_dois: '',
                serie: String(i).padStart(4, '0')
            });
        }
        return results;
    }

    await loadSheet();
    const sheet = doc.sheetsByTitle['ID_GAIOLA'] || doc.sheetsByTitle['FIFO'] || doc.sheetsByIndex[1];
    const rows = await sheet.getRows();

    // Coletar todos os CG existentes (extrair número do QRCode)
    const existingCGs = new Set<number>();
    let maxSerie = 0;

    // Detectar nome da coluna de série
    let serieHeader = 'Serie'; // Default
    const possibleHeaders = ['Serie', 'SERIE', 'Série', 'SÉRIE'];

    for (const h of sheet.headerValues) {
        if (possibleHeaders.includes(h)) {
            serieHeader = h;
            break;
        }
    }

    for (const row of rows) {
        // Extrair número do CG (funciona tanto para CG0045 quanto CG45)
        const qrcode = row.get('QRCode') || row.get(sheet.headerValues[0]) || '';
        const cgMatch = qrcode.match(/CG(\d+)/i);
        if (cgMatch) {
            const cgNum = parseInt(cgMatch[1], 10);
            if (!isNaN(cgNum)) {
                existingCGs.add(cgNum);
            }
        }

        // Encontrar maior Serie para autoincremento
        const serieVal = row.get(serieHeader) || row.get('Serie') || row.get('SERIE') || '0';
        const serieNum = parseInt(serieVal, 10);
        if (!isNaN(serieNum) && serieNum > maxSerie) {
            maxSerie = serieNum;
        }
    }

    const newRowsData: FifoData[] = [];
    const rowsToAdd: any[] = []; // Array para adição em lote
    let serieCounter = maxSerie; // Serie é autoincremento independente

    if (mode === 'sequential') {
        // Modo Sequencial: preenche os "buracos" na sequência de 1 a 5000
        let cgNum = 1;

        while (newRowsData.length < quantity && cgNum <= MAX_CG_NUMBER) {
            // Se este CG não existe, criar
            if (!existingCGs.has(cgNum)) {
                serieCounter++;
                const cgStr = String(cgNum); // Sem zeros à esquerda
                const serieStr = String(serieCounter).padStart(4, '0');
                const qrcode = `CG${cgStr}`;

                // Adiciona à lista de gravação EM LOTE
                rowsToAdd.push({
                    [sheet.headerValues[0]]: qrcode,
                    'ID_UM': '',
                    'ID_DOIS': '',
                    [serieHeader]: serieStr // Usa o header detectado
                });

                newRowsData.push({
                    qrcode,
                    id_um: '',
                    id_dois: '',
                    serie: serieStr
                });

                existingCGs.add(cgNum); // Marcar como usado para não repetir na mesma sessão
            }
            cgNum++;
        }
    } else {
        // Modo Aleatório: gera CG únicos aleatórios entre 1 e 5000
        const generated = new Set<number>();
        let attempts = 0;
        const maxAttempts = quantity * 200; // Evitar loop infinito

        while (generated.size < quantity && attempts < maxAttempts) {
            // Gera número entre 1 e 5000
            const randomCG = Math.floor(Math.random() * MAX_CG_NUMBER) + 1;

            // Verifica se não existe na planilha e não foi gerado nesta sessão
            if (!existingCGs.has(randomCG) && !generated.has(randomCG)) {
                generated.add(randomCG);
                existingCGs.add(randomCG); // Marcar como usado
                serieCounter++;

                const cgStr = String(randomCG); // Sem zeros à esquerda
                const serieStr = String(serieCounter).padStart(4, '0');
                const qrcode = `CG${cgStr}`;

                // Adiciona à lista de gravação EM LOTE
                rowsToAdd.push({
                    [sheet.headerValues[0]]: qrcode,
                    'ID_UM': '',
                    'ID_DOIS': '',
                    [serieHeader]: serieStr // Usa o header detectado
                });

                newRowsData.push({
                    qrcode,
                    id_um: '',
                    id_dois: '',
                    serie: serieStr
                });
            }
            attempts++;
        }

        // Ordena por CG para melhor visualização
        newRowsData.sort((a, b) => {
            const aNum = parseInt(a.qrcode.replace('CG', ''));
            const bNum = parseInt(b.qrcode.replace('CG', ''));
            return aNum - bNum;
        });
    }

    // Gravação OTIMIZADA: Grava tudo de uma vez
    if (rowsToAdd.length > 0) {
        try {
            await sheet.addRows(rowsToAdd);
        } catch (error) {
            console.error('Erro ao gravar linhas em lote:', error);
            // Em caso de erro crítico na gravação em lote, poderíamos tentar fallback ou lançar erro
            throw new Error('Falha ao gravar etiquetas no Google Sheets.');
        }
    }

    return newRowsData;
}

/**
 * Valida se um QRCode pode ser vinculado (verifica duplicados)
 * @returns { valid: boolean, error?: string }
 */
export async function validateQRCodeForLink(qrcode: string): Promise<{ valid: boolean; error?: string; data?: FifoData }> {
    if (!process.env.GOOGLE_SHEET_ID) {
        return { valid: true, data: { qrcode, id_um: '', id_dois: '', serie: '0000' } };
    }

    await loadSheet();
    const sheet = doc.sheetsByTitle['ID_GAIOLA'] || doc.sheetsByTitle['FIFO'] || doc.sheetsByIndex[1];
    const rows = await sheet.getRows();

    // Encontrar todas as linhas com este QRCode
    const matchingRows = rows.filter((r: any) =>
        (r.get('QRCode') || r.get(sheet.headerValues[0])) === qrcode
    );

    if (matchingRows.length === 0) {
        return { valid: false, error: 'QRCode não encontrado na planilha.' };
    }

    if (matchingRows.length > 1) {
        // Verificar se todos têm a mesma série
        const series = matchingRows.map((r: any) => r.get('Serie') || r.get('SERIE') || '');
        const uniqueSeries = [...new Set(series)];

        if (uniqueSeries.length > 1) {
            const displaySeries = uniqueSeries.map(s => `**${s || "VAZIO"}**`).join(', ');
            return {
                valid: false,
                error: `QRCode duplicado com séries diferentes: ${displaySeries}. Corrija na planilha antes de vincular.`
            };
        } else {
            return {
                valid: false,
                error: `QRCode duplicado (${matchingRows.length}x) com mesma série. Corrija na planilha antes de vincular.`
            };
        }
    }

    const row = matchingRows[0];
    return {
        valid: true,
        data: {
            qrcode: row.get('QRCode') || row.get(sheet.headerValues[0]) || '',
            id_um: row.get('ID_UM') || '',
            id_dois: row.get('ID_DOIS') || '',
            serie: row.get('Serie') || row.get('SERIE') || ''
        }
    };
}

/**
 * Vincula ID_UM e/ou ID_DOIS a um QRCode existente (com validação)
 */
export async function linkIdToQRCode(qrcode: string, id_um?: string, id_dois?: string): Promise<{ success: boolean; error?: string }> {
    // Primeiro valida
    const validation = await validateQRCodeForLink(qrcode);
    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    if (!process.env.GOOGLE_SHEET_ID) {
        return { success: true };
    }

    await loadSheet();
    const sheet = doc.sheetsByTitle['ID_GAIOLA'] || doc.sheetsByTitle['FIFO'] || doc.sheetsByIndex[1];
    const rows = await sheet.getRows();

    const row = rows.find((r: any) =>
        (r.get('QRCode') || r.get(sheet.headerValues[0])) === qrcode
    );

    if (!row) return { success: false, error: 'QRCode não encontrado.' };

    if (id_um !== undefined) {
        row.set('ID_UM', id_um);
    }
    if (id_dois !== undefined) {
        row.set('ID_DOIS', id_dois);
    }

    await row.save();
    return { success: true };
}

/**
 * Limpa ID_UM e ID_DOIS de um QRCode (para corrigir erros)
 */
export async function clearIdFromQRCode(qrcode: string): Promise<{ success: boolean; error?: string }> {
    if (!process.env.GOOGLE_SHEET_ID) {
        return { success: true };
    }

    await loadSheet();
    const sheet = doc.sheetsByTitle['ID_GAIOLA'] || doc.sheetsByTitle['FIFO'] || doc.sheetsByIndex[1];
    const rows = await sheet.getRows();

    const row = rows.find((r: any) =>
        (r.get('QRCode') || r.get(sheet.headerValues[0])) === qrcode
    );

    if (!row) return { success: false, error: 'QRCode não encontrado.' };

    row.set('ID_UM', '');
    row.set('ID_DOIS', '');

    await row.save();
    return { success: true };
}

/**
 * Busca todos os dados FIFO para exibição em tabela
 * @param page Número da página (1-indexed)
 * @param pageSize Itens por página
 */
export async function getAllFifoData(page: number = 1, pageSize: number = 15): Promise<{
    data: FifoData[];
    total: number;
    totalPages: number;
    stats: { total: number; unlinked: number; unique: number; duplicates: number };
    exceeded: boolean;
}> {
    if (!process.env.GOOGLE_SHEET_ID) {
        const mockData: FifoData[] = [];
        for (let i = 1; i <= 50; i++) {
            mockData.push({
                qrcode: `CG${String(i).padStart(4, '0')}`,
                id_um: i % 3 === 0 ? `ID${i}A` : '',
                id_dois: i % 5 === 0 ? `ID${i}B` : '',
                serie: String(i).padStart(4, '0')
            });
        }
        const start = (page - 1) * pageSize;
        const unlinked = mockData.filter(d => !d.id_um && !d.id_dois).length;
        return {
            data: mockData.slice(start, start + pageSize),
            total: mockData.length,
            totalPages: Math.ceil(mockData.length / pageSize),
            stats: { total: mockData.length, unlinked, unique: mockData.length, duplicates: 0 },
            exceeded: false
        };
    }

    await loadSheet();
    const sheet = doc.sheetsByTitle['ID_GAIOLA'] || doc.sheetsByTitle['FIFO'] || doc.sheetsByIndex[1];
    const rows = await sheet.getRows();

    const allData: FifoData[] = rows.map((row: any) => ({
        qrcode: row.get('QRCode') || row.get(sheet.headerValues[0]) || '',
        id_um: row.get('ID_UM') || '',
        id_dois: row.get('ID_DOIS') || '',
        serie: row.get('Serie') || row.get('SERIE') || ''
    }));

    const total = allData.length;
    const unlinked = allData.filter(d => !d.id_um && !d.id_dois).length;

    // Calcular duplicados
    const qrcodeCounts = new Map<string, number>();
    allData.forEach(d => {
        qrcodeCounts.set(d.qrcode, (qrcodeCounts.get(d.qrcode) || 0) + 1);
    });
    const uniqueCount = qrcodeCounts.size;
    const duplicateCount = total - uniqueCount;

    // Verificar limite
    const exceeded = total > MAX_QRCODES;

    const start = (page - 1) * pageSize;
    const paginatedData = allData.slice(start, start + pageSize);

    return {
        data: paginatedData,
        total,
        totalPages: Math.ceil(total / pageSize),
        stats: { total, unlinked, unique: uniqueCount, duplicates: duplicateCount },
        exceeded
    };
}

// Manter compatibilidade com código antigo (deprecated)
export async function getFifoByUniqueId(uniqueId: string) {
    const result = await getFifoByScanId(uniqueId);
    if (result) {
        return {
            sequencial: result.qrcode,
            id: uniqueId
        };
    }
    return null;
}

// ========================
// AUTENTICAÇÃO FIFO
// ========================

export const MAX_QRCODES = 5000;

/**
 * Valida a senha de acesso ao módulo FIFO
 * Busca na planilha FIFO_AUTH, coluna PASSWORD
 */
export async function validateFifoPassword(password: string): Promise<boolean> {
    // Mock: se não tiver credenciais, aceita qualquer senha
    if (!process.env.GOOGLE_SHEET_ID) {
        return password === 'demo';
    }

    try {
        await loadSheet();
        const sheet = doc.sheetsByTitle['FIFO_AUTH'];

        if (!sheet) {
            console.error('Planilha FIFO_AUTH não encontrada');
            return false;
        }

        const rows = await sheet.getRows();

        // Verifica se a senha existe em alguma linha da coluna PASSWORD
        const validPassword = rows.some((row: any) => {
            const storedPassword = row.get('PASSWORD') || '';
            return storedPassword === password;
        });

        return validPassword;
    } catch (error) {
        console.error('Erro ao validar senha FIFO:', error);
        return false;
    }
}

// ========================
// FIFO_REPRINT - Fila de Reimpressão (AppSheet)
// ========================

export type ReprintItem = {
    id: string;        // ID bipado pelo AppSheet (pode ser ID_UM, ID_DOIS ou QRCode)
    timestamp: string; // Data/hora do bipe
    rowIndex: number;  // Índice da linha para exclusão
};

/**
 * Busca todos os itens na fila de reimpressão (FIFO_REPRINT)
 * @returns Lista de IDs para reimprimir e contagem
 */
export async function getReprintQueue(): Promise<{ items: ReprintItem[]; total: number }> {
    if (!process.env.GOOGLE_SHEET_ID) {
        return { items: [], total: 0 };
    }

    try {
        await loadSheet();
        const sheet = doc.sheetsByTitle['FIFO_REPRINT'];

        if (!sheet) {
            console.log('Planilha FIFO_REPRINT não encontrada');
            return { items: [], total: 0 };
        }

        const rows = await sheet.getRows();

        const items: ReprintItem[] = rows.map((row: any, idx: number) => ({
            id: row.get('ID') || row.get(sheet.headerValues[0]) || '',
            timestamp: row.get('TIMESTAMP') || row.get('DATA') || '',
            rowIndex: idx
        })).filter((item: ReprintItem) => item.id.trim() !== '');

        return { items, total: items.length };
    } catch (error) {
        console.error('Erro ao buscar fila de reimpressão:', error);
        return { items: [], total: 0 };
    }
}

/**
 * Busca as etiquetas correspondentes aos IDs na fila de reimpressão
 * @returns Etiquetas encontradas e IDs não encontrados
 */
export async function getReprintLabels(): Promise<{ found: FifoData[]; notFound: string[]; total: number }> {
    const queue = await getReprintQueue();

    if (queue.total === 0) {
        return { found: [], notFound: [], total: 0 };
    }

    const ids = queue.items.map(item => item.id);
    const result = await getFifoByMultipleIds(ids);

    return {
        found: result.found,
        notFound: result.notFound,
        total: queue.total
    };
}

/**
 * Limpa a fila de reimpressão após impressão bem-sucedida
 * @param ids Lista de IDs para remover da fila (opcional, se vazio limpa tudo)
 */
export async function clearReprintQueue(ids?: string[]): Promise<{ success: boolean; cleared: number }> {
    if (!process.env.GOOGLE_SHEET_ID) {
        return { success: true, cleared: 0 };
    }

    try {
        await loadSheet();
        const sheet = doc.sheetsByTitle['FIFO_REPRINT'];

        if (!sheet) {
            return { success: false, cleared: 0 };
        }

        const rows = await sheet.getRows();
        let cleared = 0;

        // Deletar de trás pra frente para não bagunçar índices
        for (let i = rows.length - 1; i >= 0; i--) {
            const rowId = rows[i].get('ID') || rows[i].get(sheet.headerValues[0]) || '';

            // Se ids foi passado, só remove os especificados
            if (!ids || ids.includes(rowId)) {
                await rows[i].delete();
                cleared++;
            }
        }

        return { success: true, cleared };
    } catch (error) {
        console.error('Erro ao limpar fila de reimpressão:', error);
        return { success: false, cleared: 0 };
    }
}

// ========================
// TAREFAS - Integração AppSheet
// ========================

export type Tarefa = {
    tarefa_id: string;
    data_criacao: string;
    status: string;
    responsavel: string;
};

export type ItemTarefa = {
    item_id: string;
    tarefa_id: string;
    lacre_id: string;
};

/**
 * Busca todas as tarefas com status "Concluída"
 */
export async function getCompletedTasks(): Promise<Tarefa[]> {
    if (!process.env.GOOGLE_SHEET_ID) {
        return [];
    }

    try {
        await loadSheet();
        const sheet = doc.sheetsByTitle['Tarefas'];

        if (!sheet) {
            console.log('Planilha Tarefas não encontrada');
            return [];
        }

        const rows = await sheet.getRows();

        return rows
            .map((row: any) => ({
                tarefa_id: row.get('Tarefa_ID') || '',
                data_criacao: row.get('Data_Criacao') || '',
                status: row.get('Status') || '',
                responsavel: row.get('Responsavel') || ''
            }))
            .filter((t: Tarefa) => t.status.toLowerCase() === 'concluída' || t.status.toLowerCase() === 'concluida');
    } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        return [];
    }
}

/**
 * Busca os itens de uma tarefa específica
 */
export async function getTaskItems(tarefaId: string): Promise<ItemTarefa[]> {
    if (!process.env.GOOGLE_SHEET_ID) {
        return [];
    }

    try {
        await loadSheet();
        const sheet = doc.sheetsByTitle['Itens_Tarefa'];

        if (!sheet) {
            console.log('Planilha Itens_Tarefa não encontrada');
            return [];
        }

        const rows = await sheet.getRows();

        return rows
            .map((row: any) => ({
                item_id: row.get('Item_ID') || '',
                tarefa_id: row.get('Tarefa_ID') || '',
                lacre_id: row.get('Lacre_ID') || ''
            }))
            .filter((item: ItemTarefa) => item.tarefa_id === tarefaId);
    } catch (error) {
        console.error('Erro ao buscar itens da tarefa:', error);
        return [];
    }
}

/**
 * Busca etiquetas FIFO pelos Lacre_IDs (pode ser ID_UM ou ID_DOIS)
 */
export async function getLabelsByLacreIds(lacreIds: string[]): Promise<{ found: FifoData[]; notFound: string[] }> {
    if (!process.env.GOOGLE_SHEET_ID || lacreIds.length === 0) {
        return { found: [], notFound: lacreIds };
    }

    try {
        await loadSheet();
        const sheet = doc.sheetsByTitle['ID_GAIOLA'] || doc.sheetsByTitle['FIFO'] || doc.sheetsByIndex[1];
        const rows = await sheet.getRows();

        const found: FifoData[] = [];
        const notFound: string[] = [];

        for (const lacreId of lacreIds) {
            const row = rows.find((r: any) =>
                r.get('ID_UM') === lacreId || r.get('ID_DOIS') === lacreId
            );

            if (row) {
                found.push({
                    qrcode: row.get('QRCode') || row.get(sheet.headerValues[0]) || '',
                    id_um: row.get('ID_UM') || '',
                    id_dois: row.get('ID_DOIS') || '',
                    serie: row.get('Serie') || row.get('SERIE') || ''
                });
            } else {
                notFound.push(lacreId);
            }
        }

        return { found, notFound };
    } catch (error) {
        console.error('Erro ao buscar etiquetas por lacre:', error);
        return { found: [], notFound: lacreIds };
    }
}

/**
 * Busca etiquetas de uma tarefa específica
 */
export async function getTaskLabels(tarefaId: string): Promise<{ found: FifoData[]; notFound: string[]; total: number }> {
    const items = await getTaskItems(tarefaId);
    const lacreIds = items.map(item => item.lacre_id).filter(id => id.trim() !== '');

    if (lacreIds.length === 0) {
        return { found: [], notFound: [], total: 0 };
    }

    const result = await getLabelsByLacreIds(lacreIds);
    return {
        found: result.found,
        notFound: result.notFound,
        total: lacreIds.length
    };
}

// ========================
// HISTÓRICO DE IMPRESSÕES
// ========================

/**
 * Marca etiquetas como impressas, incrementando contador
 * @param qrcodes Lista de QRCodes para marcar como impressos
 */
export async function markAsPrinted(qrcodes: string[]): Promise<{ success: boolean; marked: number }> {
    if (qrcodes.length === 0) {
        return { success: true, marked: 0 };
    }

    await loadSheet();
    const sheet = doc.sheetsByTitle['ID_GAIOLA'] || doc.sheetsByTitle['FIFO'] || doc.sheetsByIndex[1];
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    let marked = 0;
    const timestamp = new Date().toLocaleString('pt-BR');

    for (const qrcode of qrcodes) {
        const row = rows.find((r: any) =>
            (r.get('QRCode') || r.get(sheet.headerValues[0]) || '').toUpperCase() === qrcode.toUpperCase()
        );

        if (row) {
            // Extrair contador atual
            const currentValue = row.get('Impresso') || '';
            let count = 1;

            // Verificar se já tem contador (formato: "X vez(es) - última: DD/MM/YYYY HH:mm:ss")
            const match = currentValue.match(/^(\d+)\s*vez/);
            if (match) {
                count = parseInt(match[1], 10) + 1;
            } else if (currentValue.toLowerCase().includes('sim')) {
                count = 2; // Já foi impresso uma vez antes
            }

            const vezStr = count === 1 ? 'vez' : 'vezes';
            row.set('Impresso', `${count} ${vezStr} - última: ${timestamp}`);
            await row.save();
            marked++;
        }
    }

    return { success: true, marked };
}

/**
 * Busca histórico de impressões (etiquetas marcadas como impressas)
 * @param page Página (1-indexed)
 * @param pageSize Tamanho da página
 */
export async function getPrintHistory(page: number = 1, pageSize: number = 50): Promise<{
    data: FifoData[];
    total: number;
    page: number;
    totalPages: number;
}> {
    await loadSheet();
    const sheet = doc.sheetsByTitle['ID_GAIOLA'] || doc.sheetsByTitle['FIFO'] || doc.sheetsByIndex[1];
    const rows = await sheet.getRows();

    // Filtrar apenas impressos (qualquer valor não vazio na coluna Impresso)
    const printedRows = rows.filter((row: any) => {
        const impresso = row.get('Impresso') || '';
        return impresso.trim() !== '';
    });

    const total = printedRows.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;

    const data: FifoData[] = printedRows.slice(startIdx, endIdx).map((row: any) => ({
        qrcode: row.get('QRCode') || row.get(sheet.headerValues[0]) || '',
        id_um: row.get('ID_UM') || '',
        id_dois: row.get('ID_DOIS') || '',
        serie: row.get('Serie') || row.get('SERIE') || '',
        impresso: row.get('Impresso') || ''
    }));

    return { data, total, page, totalPages };
}

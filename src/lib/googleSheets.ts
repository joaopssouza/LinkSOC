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
};

/**
 * Busca uma etiqueta FIFO por ID_UM ou ID_DOIS
 * @param scanId O ID escaneado (pode ser ID_UM ou ID_DOIS)
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

    // Busca por ID_UM OU ID_DOIS
    const row = rows.find((r: any) =>
        r.get('ID_UM') === scanId || r.get('ID_DOIS') === scanId
    );

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

/**
 * Gera N etiquetas em massa (QRCode + Serie, sem IDs vinculados)
 * @param quantity Quantidade de etiquetas a gerar
 * @returns Lista de novas etiquetas criadas
 */
export async function createBatchQRCodes(quantity: number): Promise<FifoData[]> {
    if (!process.env.GOOGLE_SHEET_ID) {
        const results: FifoData[] = [];
        for (let i = 1; i <= quantity; i++) {
            results.push({
                qrcode: `CG${String(i).padStart(4, '0')}`,
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

    // Encontrar última série existente
    let maxSerie = 0;
    for (const row of rows) {
        const serieVal = row.get('Serie') || row.get('SERIE') || '0';
        const serieNum = parseInt(serieVal, 10);
        if (!isNaN(serieNum) && serieNum > maxSerie) {
            maxSerie = serieNum;
        }
    }

    // Criar novas linhas
    const newRows: FifoData[] = [];
    for (let i = 1; i <= quantity; i++) {
        const newSerie = maxSerie + i;
        const serieStr = String(newSerie).padStart(4, '0');
        const qrcode = `CG${serieStr}`;

        await sheet.addRow({
            [sheet.headerValues[0]]: qrcode, // Coluna A = QRCode
            'ID_UM': '',
            'ID_DOIS': '',
            'Serie': serieStr
        });

        newRows.push({
            qrcode,
            id_um: '',
            id_dois: '',
            serie: serieStr
        });
    }

    return newRows;
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

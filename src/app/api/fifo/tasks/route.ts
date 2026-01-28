import { NextResponse } from 'next/server';
import { getCompletedTasks } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

// GET /api/fifo/tasks - Lista tarefas concluídas
export async function GET() {
    try {
        const tasks = await getCompletedTasks();

        return NextResponse.json({
            success: true,
            data: tasks,
            total: tasks.length
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar tarefas' },
            { status: 500 }
        );
    }
}

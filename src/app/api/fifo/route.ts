import { NextResponse } from 'next/server';
import { getFifoByUniqueId } from '@/lib/googleSheets';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        const data = await getFifoByUniqueId(id);
        if (data) {
            return NextResponse.json({ found: true, data });
        } else {
            return NextResponse.json({ found: false, message: 'ID not found' });
        }
    } catch (error) {
        console.error('Error fetching FIFO data:', error);
        return NextResponse.json({ found: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

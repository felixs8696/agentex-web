// app/api/get-task/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.AGENTEX_BASE_URL || 'http://localhost:5003';

export async function GET(req: NextRequest, { params }: { params: { taskId: string } }) {
    const { taskId } = params;

    if (!taskId) {
        return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    try {
        const res = await fetch(`${BASE_URL}/tasks/${taskId}`);
        if (!res.ok) {
            throw new Error(`Failed to fetch task with ID ${taskId}`);
        }
        const task = await res.json();
        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const revalidate = 0;

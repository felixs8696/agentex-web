// app/api/modify-task/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.AGENTEX_BASE_URL || 'http://localhost:5003';

export async function POST(req: NextRequest) {
    const { task_id, modification_type, prompt } = await req.json();
    console.log('task_id:', task_id);
    console.log('modification_type:', modification_type);
    console.log('prompt:', prompt);

    let payload;

    switch (modification_type) {
        case 'instruct':
            payload = {
                type: modification_type,
                prompt: prompt || '',
            };
            break;
        case 'approve':
            payload = {
                type: modification_type,
            };
            break;
        case 'cancel':
            payload = {
                type: modification_type,
            };
            break;
        default:
            return NextResponse.json({ error: `Invalid modification type: ${modification_type}` }, { status: 400 });
    }

    try {
        const res = await fetch(`${BASE_URL}/tasks/${task_id}/modify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            throw new Error('Failed to modify task');
        }

        const updatedTask = await res.json();
        return NextResponse.json(updatedTask);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

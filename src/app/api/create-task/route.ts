// app/api/create-task/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.AGENTEX_BASE_URL || 'http://localhost:5003';

export async function POST(req: NextRequest) {
    const { agent_name, agent_version, prompt, require_approval } = await req.json();

    const payload = {
        agent_name,
        agent_version,
        prompt,
        require_approval: require_approval || false,
    };

    try {
        const res = await fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            throw new Error('Failed to create task');
        }

        const task = await res.json();
        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

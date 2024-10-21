// app/api/get-agent/[agentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.AGENTEX_BASE_URL || 'http://localhost:5003';

export async function GET(req: NextRequest, { params }: { params: { agentId: string } }) {
    const { agentId } = params;

    if (!agentId) {
        return NextResponse.json({ error: 'agent ID is required' }, { status: 400 });
    }

    try {
        const res = await fetch(`${BASE_URL}/agents/${agentId}`);
        if (!res.ok) {
            throw new Error(`Failed to fetch agent with ID ${agentId}`);
        }
        const agent = await res.json();
        return NextResponse.json(agent);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const revalidate = 0;

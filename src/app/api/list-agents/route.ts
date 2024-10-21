import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.AGENTEX_BASE_URL || 'http://localhost:5003';

export async function GET(req: NextRequest) {
    try {
        const res = await fetch(`${BASE_URL}/agents`);
        if (!res.ok) {
            throw new Error('Failed to fetch agents');
        }
        const agents = await res.json();
        return NextResponse.json(agents);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const revalidate = 0;

import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = "edge";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

interface ManagerMemory {
  manager_id: string;
  preferences: Array<{
    timestamp: string;
    preference_type: string;
    preference_text: string;
    source_quote: string;
  }>;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const manager_id = searchParams.get('manager_id');

    if (!manager_id) {
      return NextResponse.json(
        { error: 'manager_id query parameter is required' },
        { status: 400 }
      );
    }

    const memoryKey = `manager:${manager_id}`;
    const memory = await redis.get<ManagerMemory>(memoryKey);

    if (!memory) {
      return NextResponse.json({
        manager_id: manager_id,
        preferences: [],
        message: 'No memory found for this manager'
      });
    }

    return NextResponse.json(memory);

  } catch (error) {
    console.error('Retrieve error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve memory',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

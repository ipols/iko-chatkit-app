import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = "edge";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

interface SaveMemoryRequest {
  manager_id: string;
  preference_type: string;
  preference_text: string;
  source_quote?: string;
}

interface ManagerMemory {
  manager_id: string;
  preferences: Array<{
    timestamp: string;
    preference_type: string;
    preference_text: string;
    source_quote: string;
  }>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as SaveMemoryRequest;

    const {
      manager_id,
      preference_type,
      preference_text,
      source_quote
    } = body;

    if (!manager_id || !preference_type || !preference_text) {
      return NextResponse.json(
        { error: 'Missing required fields: manager_id, preference_type, preference_text' },
        { status: 400 }
      );
    }

    const memoryKey = `manager:${manager_id}`;
    let memory = await redis.get<ManagerMemory>(memoryKey);

    if (!memory) {
      memory = {
        manager_id: manager_id,
        preferences: []
      };
    }

    memory.preferences.push({
      timestamp: new Date().toISOString(),
      preference_type: preference_type,
      preference_text: preference_text,
      source_quote: source_quote || ""
    });

    await redis.set(memoryKey, memory);

    return NextResponse.json({
      success: true,
      message: 'Preference saved',
      total_preferences: memory.preferences.length
    });

  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save preference',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

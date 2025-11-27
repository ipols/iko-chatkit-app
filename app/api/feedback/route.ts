import { NextRequest, NextResponse } from "next/server";
import Airtable from "airtable";

const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
  console.error("Missing Airtable configuration");
}

const airtable = new Airtable({ apiKey: AIRTABLE_API_TOKEN });
const base = airtable.base(AIRTABLE_BASE_ID!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      threadId,
      itemIds,
      kind,
      userMessage,
      assistantResponse,
      sessionId,
      widgetId,
      actionType,
      actionPayload,
      timestamp: providedTimestamp,
    } = body;

    if (!kind) {
      return NextResponse.json(
        { error: "Missing required field: kind" },
        { status: 400 }
      );
    }

    const timestamp = providedTimestamp || new Date().toISOString();

    const record = await base("Feedback").create({
      Timestamp: timestamp,
      "Thread ID": threadId || "",
      "Item IDs": itemIds?.join(", ") || "",
      "Feedback Type": kind,
      "User Message": userMessage || "",
      "Assistant Response": assistantResponse || "",
      "Session ID": sessionId || "",
      "Widget ID": widgetId || "",
      "Action Type": actionType || "",
      "Action Payload": actionPayload ? JSON.stringify(actionPayload) : "",
    });

    console.log("Feedback stored in Airtable:", record.id);

    return NextResponse.json({ success: true, recordId: record.id });
  } catch (error) {
    console.error("Error storing feedback:", error);
    return NextResponse.json(
      {
        error: "Failed to store feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

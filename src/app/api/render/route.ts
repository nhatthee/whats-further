import { NextRequest, NextResponse } from "next/server";
import { runMockRenderService } from "@/effects/render-service";

function isValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("must be") ||
    message.includes("must not be") ||
    message.includes("request must be an object")
  );
}

export async function handleRenderPost(body: unknown) {
  try {
    const response = runMockRenderService(body);

    return NextResponse.json(
      {
        ok: true,
        data: response,
      },
      { status: 200 },
    );
  } catch (error) {
    if (isValidationError(error)) {
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Invalid request",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Internal render service error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return handleRenderPost(body);
}

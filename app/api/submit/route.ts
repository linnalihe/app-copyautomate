import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { submissionSchema } from "@/lib/schema";
import { createServiceClient } from "@/lib/supabase/server";

function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "";
  return createHash("sha256").update(salt + ip).digest("hex");
}

function sanitize(str: string): string {
  return str.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

async function isRateLimited(ipHash: string): Promise<boolean> {
  const supabase = createServiceClient();
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", windowStart);

  if (error) return false; // fail open — don't block submissions on DB error
  return (count ?? 0) >= 5;
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // 1. Validate
    const result = submissionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input.", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // 2. Honeypot — silent accept so bots think they succeeded
    if (result.data.honeypot) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // 3. Hash IP
    const rawIP =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "0.0.0.0";
    const ipHash = hashIP(rawIP);

    // 4. Rate limit (5 submissions per IP per hour, checked via DB)
    if (await isRateLimited(ipHash)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    // 5. Sanitize + insert
    const { email, message, first_name, last_name } = result.data;
    const supabase = createServiceClient();

    const { error: dbError } = await supabase.from("submissions").insert({
      email: sanitize(email),
      message: sanitize(message),
      first_name: sanitize(first_name) || "anonymous",
      last_name: sanitize(last_name) || "anonymous",
      ip_hash: ipHash,
    });

    if (dbError) {
      console.error("Insert error:", dbError.message);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

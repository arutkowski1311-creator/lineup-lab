import { getAuthContext, json, error } from "@/lib/api-helpers";
import { generateContent } from "@/lib/anthropic";
import { z } from "zod";

const contentSchema = z.object({
  type: z.string().min(1),
  platform: z.string().min(1),
  tone: z.string().min(1),
  context: z.string().optional(),
});

export async function POST(request: Request) {
  const ctx = await getAuthContext(["owner", "manager"]);
  if ("error" in ctx) return ctx.error;

  const body = await request.json();
  const parsed = contentSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.message);

  // Get operator name for branding
  const { data: operator } = await ctx.supabase
    .from("operators")
    .select("name")
    .eq("id", ctx.operatorId)
    .single();

  try {
    const content = await generateContent({
      ...parsed.data,
      operatorName: operator?.name || "Dumpster Rental Co",
    });

    return json({ content });
  } catch (err) {
    return error(`Content generation failed: ${err instanceof Error ? err.message : "Unknown error"}`, 500);
  }
}

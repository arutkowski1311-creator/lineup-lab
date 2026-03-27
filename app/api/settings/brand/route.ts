import { getAuthContext, json, error } from "@/lib/api-helpers";
import { z } from "zod";

const brandSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  logo_url: z.string().optional(),
  primary_color: z.string().optional(),
  accent_color: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  service_area_description: z.string().optional(),
  tagline: z.string().optional(),
});

export async function PATCH(request: Request) {
  const ctx = await getAuthContext(["owner"]);
  if ("error" in ctx) return ctx.error;

  const body = await request.json();
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.message);

  const { data, error: dbError } = await ctx.supabase
    .from("operators")
    .update(parsed.data)
    .eq("id", ctx.operatorId)
    .select()
    .single();

  if (dbError) return error(dbError.message);
  return json(data);
}

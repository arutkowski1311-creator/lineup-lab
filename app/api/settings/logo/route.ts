import { getAuthContext, json, error } from "@/lib/api-helpers";

// Upload logo to Supabase Storage
export async function POST(request: Request) {
  const ctx = await getAuthContext(["owner"]);
  if ("error" in ctx) return ctx.error;

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) return error("No file provided", 400);

  const fileExt = file.name.split(".").pop();
  const fileName = `${ctx.operatorId}/logo.${fileExt}`;

  const { error: uploadError } = await ctx.supabase.storage
    .from("logos")
    .upload(fileName, file, { upsert: true });

  if (uploadError) return error(uploadError.message);

  const { data: urlData } = ctx.supabase.storage
    .from("logos")
    .getPublicUrl(fileName);

  // Update operator logo_url
  await ctx.supabase
    .from("operators")
    .update({ logo_url: urlData.publicUrl })
    .eq("id", ctx.operatorId);

  return json({ logo_url: urlData.publicUrl });
}

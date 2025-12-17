import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { successResponse, ApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const promptType = searchParams.get("prompt_type") || "";

  // 构建查询
  let query = supabase.from("prompts").select("category");

  // 如果指定了 prompt_type，只获取该类型的分类
  if (promptType) {
    query = query.eq("prompt_type", promptType);
  }

  const { data, error } = await query;

  if (error) {
    return ApiError.SERVER_ERROR(error.message);
  }

  // 提取唯一分类
  const categoriesSet = new Set<string>();
  data?.forEach((item) => categoriesSet.add(item.category));
  const categories = Array.from(categoriesSet);

  return successResponse({ data: categories });
}

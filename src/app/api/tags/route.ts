import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { successResponse, ApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const promptType = searchParams.get("prompt_type") || "";

  // 如果指定了 prompt_type，需要从 prompts 表动态计算标签数量
  if (promptType) {
    // 获取该类型下所有 prompts 的 tags
    const { data: prompts, error } = await supabase
      .from("prompts")
      .select("tags")
      .eq("prompt_type", promptType);

    if (error) {
      return ApiError.SERVER_ERROR(error.message);
    }

    // 统计每个标签的数量
    const tagCounts: Record<string, number> = {};
    prompts?.forEach((p) => {
      p.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // 获取标签详情
    const { data: tagsData, error: tagsError } = await supabase
      .from("tags")
      .select("*");

    if (tagsError) {
      return ApiError.SERVER_ERROR(tagsError.message);
    }

    // 合并数量，过滤掉数量为 0 的标签
    const filteredTags = tagsData
      ?.map((tag) => ({
        ...tag,
        count: tagCounts[tag.slug] || 0,
      }))
      .filter((tag) => tag.count > 0)
      .sort((a, b) => b.count - a.count);

    return successResponse({ data: filteredTags || [] });
  }

  // 默认返回所有标签
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("count", { ascending: false });

  if (error) {
    return ApiError.SERVER_ERROR(error.message);
  }

  return successResponse({ data: data || [] });
}

import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-server";
import { successResponse, ApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // 获取查询参数
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const tag = searchParams.get("tag") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "24", 10);
  const offset = (page - 1) * limit;

  // 构建查询
  let query = supabase.from("prompts").select("*", { count: "exact" });

  // 搜索过滤
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,prompt.ilike.%${search}%,author.ilike.%${search}%`
    );
  }

  // 分类过滤
  if (category) {
    query = query.eq("category", category);
  }

  // 标签过滤
  if (tag) {
    query = query.contains("tags", [tag]);
  }

  // 分页
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return ApiError.SERVER_ERROR(error.message);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  // 转换字段名以匹配前端类型
  const prompts =
    data?.map((item) => ({
      id: item.id,
      title: item.title,
      title_en: item.title_en,
      preview: item.preview,
      prompt: item.prompt,
      prompt_en: item.prompt_en,
      author: item.author,
      link: item.link,
      mode: item.mode,
      category: item.category,
      sub_category: item.sub_category,
      tags: item.tags,
      created: item.created_at,
    })) || [];

  return successResponse({
    data: prompts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  });
}

// 创建新提示词
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证必填字段
    const { title, preview, prompt, author, mode, category } = body;
    if (!title || !preview || !prompt || !author || !mode || !category) {
      return ApiError.BAD_REQUEST(
        "缺少必填字段: title, preview, prompt, author, mode, category"
      );
    }

    // 验证 mode 值
    if (!["generate", "edit"].includes(mode)) {
      return ApiError.BAD_REQUEST("mode 必须是 generate 或 edit");
    }

    const { data, error } = await supabaseAdmin
      .from("prompts")
      .insert({
        title: body.title,
        title_en: body.title_en || null,
        preview: body.preview,
        prompt: body.prompt,
        prompt_en: body.prompt_en || null,
        author: body.author,
        link: body.link || null,
        mode: body.mode,
        category: body.category,
        sub_category: body.sub_category || null,
        tags: body.tags || null,
      })
      .select()
      .single();

    if (error) {
      return ApiError.SERVER_ERROR(error.message);
    }

    return successResponse(data, "创建成功");
  } catch {
    return ApiError.BAD_REQUEST("请求体解析失败");
  }
}

// 服务端数据获取函数
import { supabase } from './supabase';
import { Prompt, Tag, PromptType, DbPrompt } from '@/types';
import { mapDbPromptToPrompt } from './type-mapping';

export interface FetchPromptsParams {
  search?: string;
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
  excludeNsfw?: boolean;
  prompt_type?: PromptType;
}

export interface PromptsResult {
  data: Prompt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Build search filter for prompts query
 */
function buildSearchFilter(search: string): string {
  return `title.ilike.%${search}%,prompt.ilike.%${search}%,title_en.ilike.%${search}%,prompt_en.ilike.%${search}%`;
}

/**
 * Calculate pagination info from query results
 */
function calculatePagination(
  page: number,
  limit: number,
  total: number
): PromptsResult['pagination'] {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Create empty prompts result for error cases
 */
function createEmptyPromptsResult(page: number, limit: number): PromptsResult {
  return {
    data: [],
    pagination: calculatePagination(page, limit, 0),
  };
}

// 获取提示词列表 (服务端)
export async function fetchPrompts(params: FetchPromptsParams = {}): Promise<PromptsResult> {
  const {
    search = '',
    category = '',
    tag = '',
    page = 1,
    limit = 24,
    prompt_type = 'image',
  } = params;

  const offset = (page - 1) * limit;

  let query = supabase.from('prompts').select('*', { count: 'exact' });

  // Apply prompt_type filter
  query = query.eq('prompt_type', prompt_type);

  // Apply search filter
  if (search) {
    query = query.or(buildSearchFilter(search));
  }

  // Apply category filter
  if (category) {
    query = query.eq('category', category);
  }

  // Apply tag filter
  if (tag) {
    query = query.contains('tags', [tag]);
  }

  // 默认过滤 NSFW 内容
  if (params.excludeNsfw !== false) {
    query = query.neq('category', 'NSFW');
  }

  // Apply sorting and pagination
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching prompts:', error);
    return createEmptyPromptsResult(page, limit);
  }

  // Map database records to frontend types using shared mapping function
  const mappedData = (data as DbPrompt[] || []).map(mapDbPromptToPrompt);

  return {
    data: mappedData,
    pagination: calculatePagination(page, limit, count || 0),
  };
}

// 获取标签列表 (服务端)
// 使用与 API 路由相同的聚合逻辑，确保数据一致
export async function fetchTags(prompt_type?: PromptType): Promise<Tag[]> {
  if (prompt_type) {
    // 使用单一查询获取该类型下所有 prompts 的 tags，并在内存中聚合
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('tags')
      .eq('prompt_type', prompt_type)
      .not('tags', 'is', null);

    if (error) {
      console.error('Error fetching prompts for tags:', error);
      return [];
    }

    // 统计每个标签的数量
    const tagCounts = new Map<string, number>();
    prompts?.forEach((p) => {
      p.tags?.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // 获取标签详情
    const { data: tagsData, error: tagsError } = await supabase
      .from('tags')
      .select('*');

    if (tagsError) {
      console.error('Error fetching tags:', tagsError);
      return [];
    }

    // 合并数量，过滤掉数量为 0 的标签，并排序
    const filteredTags = (tagsData || [])
      .map((tag) => ({
        ...tag,
        count: tagCounts.get(tag.slug) || 0,
      }))
      .filter((tag) => tag.count > 0)
      .sort((a, b) => b.count - a.count);

    return filteredTags;
  }

  // 默认返回所有标签
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('count', { ascending: false });

  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }

  return data || [];
}

// 获取分类列表 (服务端) - 使用 DISTINCT 优化
export async function fetchCategories(prompt_type?: PromptType): Promise<string[]> {
  let query = supabase.from('prompts').select('category');

  // Filter by prompt_type if provided
  if (prompt_type) {
    query = query.eq('prompt_type', prompt_type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  // Use Set to get unique categories, filter out null/empty
  const categoriesSet = new Set<string>();
  data?.forEach((item) => {
    if (item.category && item.category.trim()) {
      categoriesSet.add(item.category);
    }
  });
  
  return Array.from(categoriesSet).sort();
}

// 获取单个提示词 (服务端)
export async function fetchPromptById(id: number): Promise<Prompt | null> {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching prompt:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Map database record to frontend type using shared mapping function
  return mapDbPromptToPrompt(data as DbPrompt);
}

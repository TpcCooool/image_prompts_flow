// 服务端数据获取函数
import { supabase } from './supabase';
import { Prompt, Tag } from '@/types';

export interface FetchPromptsParams {
  search?: string;
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
  excludeNsfw?: boolean;
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

// 获取提示词列表 (服务端)
export async function fetchPrompts(params: FetchPromptsParams = {}): Promise<PromptsResult> {
  const {
    search = '',
    category = '',
    tag = '',
    page = 1,
    limit = 24,
  } = params;

  const offset = (page - 1) * limit;

  let query = supabase.from('prompts').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`title.ilike.%${search}%,prompt.ilike.%${search}%,title_en.ilike.%${search}%,prompt_en.ilike.%${search}%`);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (tag) {
    query = query.contains('tags', [tag]);
  }

  // 默认过滤 NSFW 内容
  if (params.excludeNsfw !== false) {
    query = query.neq('category', 'NSFW');
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching prompts:', error);
    return {
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0, hasMore: false },
    };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

// 获取标签列表 (服务端)
export async function fetchTags(): Promise<Tag[]> {
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

// 获取分类列表 (服务端)
export async function fetchCategories(): Promise<string[]> {
  const { data, error } = await supabase.from('prompts').select('category');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  const categoriesSet = new Set<string>();
  data?.forEach((item) => categoriesSet.add(item.category));
  return Array.from(categoriesSet);
}

import { supabase } from '@/lib/supabase';
import { successResponse, ApiError } from '@/lib/api-response';

export async function GET() {
  // 从 prompts 表获取所有唯一分类
  const { data, error } = await supabase
    .from('prompts')
    .select('category');

  if (error) {
    return ApiError.SERVER_ERROR(error.message);
  }

  // 提取唯一分类
  const categoriesSet = new Set<string>();
  data?.forEach((item) => categoriesSet.add(item.category));
  const categories = Array.from(categoriesSet);

  return successResponse({ data: categories });
}

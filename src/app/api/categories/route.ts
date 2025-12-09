import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // 从 prompts 表获取所有唯一分类
  const { data, error } = await supabase
    .from('prompts')
    .select('category');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 提取唯一分类
  const categoriesSet = new Set<string>();
  data?.forEach((item) => categoriesSet.add(item.category));
  const categories = Array.from(categoriesSet);

  return NextResponse.json({
    data: categories,
  });
}

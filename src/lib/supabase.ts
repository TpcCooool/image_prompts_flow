import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库类型定义
export interface DbPrompt {
  id: number;
  title: string;
  title_en: string | null;
  preview: string;
  prompt: string;
  prompt_en: string | null;
  author: string;
  link: string | null;
  mode: 'generate' | 'edit';
  category: string;
  sub_category: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface DbTag {
  id: string;
  name_zh: string;
  name_en: string;
  slug: string;
  count: number;
}

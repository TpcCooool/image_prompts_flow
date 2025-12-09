export interface Prompt {
  title: string;
  title_en?: string;
  preview: string;
  prompt: string;
  prompt_en?: string;
  author: string;
  link?: string;
  mode: 'generate' | 'edit';
  category: string;
  sub_category?: string;
  created?: string;
  tags?: string[];
}

export interface Tag {
  id: string;
  name_zh: string;
  name_en: string;
  slug: string;
  count: number;
}

export type Language = 'zh' | 'en';

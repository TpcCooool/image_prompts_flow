'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import TagFilter from '@/components/TagFilter';
import CategoryFilter from '@/components/CategoryFilter';
import PromptCard from '@/components/PromptCard';
import PromptModal from '@/components/PromptModal';
import { Prompt, Tag, Language } from '@/types';
import { translations } from '@/lib/i18n';

// 定义 API 响应类型
interface PromptsResponse {
  data: Prompt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export default function Home() {
  const [lang, setLang] = useState<Language>('zh');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  
  // 数据状态
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const t = translations[lang];

  // 获取标签和分类（只在初始化时获取一次）
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [tagsRes, categoriesRes] = await Promise.all([
          fetch('/api/tags'),
          fetch('/api/categories'),
        ]);
        const tagsData = await tagsRes.json();
        const categoriesData = await categoriesRes.json();
        setTags(tagsData.data);
        setCategories(categoriesData.data);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  // 获取 prompts（当筛选条件变化时重新获取）
  const fetchPrompts = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', '24');
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedTag) params.set('tag', selectedTag);

      const res = await fetch(`/api/prompts?${params.toString()}`);
      const data: PromptsResponse = await res.json();
      
      if (append) {
        setPrompts((prev) => [...prev, ...data.data]);
      } else {
        setPrompts(data.data);
      }
      setTotalCount(data.pagination.total);
      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedTag]);

  // 当筛选条件变化时，重置并重新获取数据
  useEffect(() => {
    fetchPrompts(1, false);
  }, [fetchPrompts]);

  const handleLoadMore = () => {
    fetchPrompts(page + 1, true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Header
        lang={lang}
        onLangChange={setLang}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          lang={lang}
        />

        {/* Tag Filter */}
        <TagFilter
          tags={tags}
          selectedTag={selectedTag}
          onTagSelect={setSelectedTag}
          lang={lang}
        />

        {/* Results Count */}
        <div className="py-4 flex items-center justify-between">
          <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
            {t.promptCount.replace('{count}', totalCount.toString())}
          </span>
        </div>

        {/* Prompts Grid */}
        {loading && prompts.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          </div>
        ) : prompts.length > 0 ? (
          <>
            {/* Masonry Layout */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
              {prompts.map((prompt, index) => (
                <PromptCard 
                  key={index} 
                  prompt={prompt} 
                  lang={lang} 
                  onClick={() => setSelectedPrompt(prompt)}
                />
              ))}
            </div>

            {/* Load More Button - 液态玻璃风格 */}
            {hasMore && (
              <div className="flex justify-center py-12">
                <button
                  onClick={handleLoadMore}
                  className="glass-button px-8 py-3.5 rounded-2xl text-[14px] font-medium
                            bg-white/70 dark:bg-white/10 backdrop-blur-xl
                            text-gray-800 dark:text-white
                            border border-white/50 dark:border-white/20
                            shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_20px_rgba(0,0,0,0.1)]
                            hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_30px_rgba(0,0,0,0.15)]
                            hover:-translate-y-1 hover:bg-white/90 dark:hover:bg-white/20
                            active:scale-[0.97]
                            transition-all duration-300 ease-out"
                >
                  {t.loadMore}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <p className="text-lg">{t.noResults}</p>
          </div>
        )}
      </main>

      {/* Footer - Apple 风格 */}
      <footer className="mt-16 py-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[13px] text-gray-400 dark:text-gray-500 font-medium">
            AI Image Prompts Library © 2024
          </p>
        </div>
      </footer>

      {/* Prompt Detail Modal */}
      {selectedPrompt && (
        <PromptModal
          prompt={selectedPrompt}
          lang={lang}
          onClose={() => setSelectedPrompt(null)}
        />
      )}
    </div>
  );
}

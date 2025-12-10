"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Header from "@/components/Header";
import TagFilter from "@/components/TagFilter";
import CategoryFilter from "@/components/CategoryFilter";
import PromptCard from "@/components/PromptCard";
import PromptModal from "@/components/PromptModal";
import { PromptCardSkeletonList } from "@/components/PromptCardSkeleton";
import { Prompt, Tag, Language } from "@/types";
import { translations } from "@/lib/i18n";
import { useDebounce } from "@/hooks/useDebounce";
import { PromptsResult } from "@/lib/data";

interface PromptsContainerProps {
  initialPrompts: PromptsResult;
  initialTags: Tag[];
  initialCategories: string[];
}

export default function PromptsContainer({
  initialPrompts,
  initialTags,
  initialCategories,
}: PromptsContainerProps) {
  const [lang, setLang] = useState<Language>("zh");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  // 使用服务端初始数据（过滤 NSFW）
  const filteredInitialPrompts = useMemo(
    () => initialPrompts.data.filter((p) => p.category !== "NSFW"),
    [initialPrompts.data]
  );
  const [prompts, setPrompts] = useState<Prompt[]>(filteredInitialPrompts);
  const [tags] = useState<Tag[]>(initialTags);
  const [categories] = useState<string[]>(initialCategories);
  const [totalCount, setTotalCount] = useState(initialPrompts.pagination.total);
  const [page, setPage] = useState(initialPrompts.pagination.page);
  const [hasMore, setHasMore] = useState(initialPrompts.pagination.hasMore);
  const [loading, setLoading] = useState(false);
  
  // 用于强制重渲染列表，避免切换筛选时旧图残留
  const [filterKey, setFilterKey] = useState(0);

  const t = translations[lang];

  // 获取 prompts（当筛选条件变化时重新获取）
  const fetchPrompts = useCallback(
    async (pageNum: number, append = false) => {
      // 非追加模式时，立即清空数据显示骨架屏
      if (!append) {
        setPrompts([]);
        setFilterKey((k) => k + 1);
      }
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", pageNum.toString());
        params.set("limit", "24");
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (selectedCategory) params.set("category", selectedCategory);
        if (selectedTag) params.set("tag", selectedTag);
        // 默认过滤 NSFW，除非明确选择了 NSFW 分类
        if (selectedCategory !== "NSFW") {
          params.set("excludeNsfw", "true");
        }

        const res = await fetch(`/api/prompts?${params.toString()}`);
        const data = await res.json();

        if (append) {
          setPrompts((prev) => [...prev, ...(data.data || [])]);
        } else {
          setPrompts(data.data || []);
        }
        setTotalCount(data.pagination?.total || 0);
        setHasMore(data.pagination?.hasMore || false);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to fetch prompts:", error);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, selectedCategory, selectedTag]
  );

  // 标记是否有过筛选操作
  const [hasFiltered, setHasFiltered] = useState(false);

  // 当筛选条件变化时重新获取数据
  useEffect(() => {
    // 有筛选条件时请求 API
    if (debouncedSearch || selectedCategory || selectedTag) {
      setHasFiltered(true);
      fetchPrompts(1, false);
    } else if (hasFiltered) {
      // 筛选条件全部清空时，恢复初始数据（已过滤 NSFW）
      setPrompts(filteredInitialPrompts);
      setTotalCount(initialPrompts.pagination.total);
      setHasMore(initialPrompts.pagination.hasMore);
      setPage(1);
      setHasFiltered(false);
      setFilterKey((k) => k + 1);
    }
  }, [debouncedSearch, selectedCategory, selectedTag]);

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
            {t.promptCount.replace("{count}", totalCount.toString())}
          </span>
        </div>

        {/* Prompts Grid */}
        {loading && prompts.length === 0 ? (
          // 加载中显示骨架屏，体验更丝滑
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
            <PromptCardSkeletonList count={12} />
          </div>
        ) : prompts.length > 0 ? (
          <>
            {/* Masonry Layout - 使用 key 强制重渲染避免旧图残留 */}
            <div key={filterKey} className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
              {prompts.map((prompt, index) => (
                <PromptCard
                  key={`${prompt.id || index}`}
                  prompt={prompt}
                  lang={lang}
                  onClick={() => setSelectedPrompt(prompt)}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center py-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="glass-button px-8 py-3.5 rounded-2xl text-[14px] font-medium
                            bg-white/70 dark:bg-white/10 backdrop-blur-xl
                            text-gray-800 dark:text-white
                            border border-white/50 dark:border-white/20
                            shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_20px_rgba(0,0,0,0.1)]
                            hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_30px_rgba(0,0,0,0.15)]
                            hover:-translate-y-1 hover:bg-white/90 dark:hover:bg-white/20
                            active:scale-[0.97]
                            transition-all duration-300 ease-out
                            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "加载中..." : t.loadMore}
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

      {/* Footer */}
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

"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Header from "@/components/Header";
import TagFilter from "@/components/TagFilter";
import CategoryFilter from "@/components/CategoryFilter";
import PromptCard from "@/components/PromptCard";
import PromptModal from "@/components/PromptModal";
import { PromptCardSkeletonList } from "@/components/PromptCardSkeleton";
import { Prompt, Tag, Language, PromptType } from "@/types";
import { translations } from "@/lib/i18n";
import { useDebounce, useScrollDirection } from "@/hooks";
import { PromptsResult } from "@/lib/data";
import { getApiClient } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";

interface PromptsContainerProps {
  initialPrompts: PromptsResult;
  initialTags: Tag[];
  initialCategories: string[];
}

// API response types - apiClient.get<T> 返回 ApiResponse<T>
// response.data 就是 T，response.pagination 在顶层
// 所以泛型直接用数组类型

interface TagsApiResponse extends Array<Tag> {}

interface CategoriesApiResponse extends Array<string> {}

export default function PromptsContainer({
  initialPrompts,
  initialTags,
  initialCategories,
}: PromptsContainerProps) {
  const [lang, setLang] = useState<Language>("zh");
  const [promptType, setPromptType] = useState<PromptType>("image");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  // Toast notifications
  const { addToast } = useToast();

  // API client instance
  const apiClient = useMemo(() => getApiClient(), []);

  // 使用服务端初始数据（过滤 NSFW）
  const filteredInitialPrompts = useMemo(
    () => initialPrompts.data.filter((p) => p.category !== "NSFW"),
    [initialPrompts.data]
  );
  const [prompts, setPrompts] = useState<Prompt[]>(filteredInitialPrompts);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [totalCount, setTotalCount] = useState(initialPrompts.pagination.total);
  const [page, setPage] = useState(initialPrompts.pagination.page);
  const [hasMore, setHasMore] = useState(initialPrompts.pagination.hasMore);
  const [loading, setLoading] = useState(false);

  // 用于强制重渲染列表，避免切换筛选时旧图残留
  const [filterKey, setFilterKey] = useState(0);

  // Scroll direction for header hide/show on mobile
  const { scrollDirection, isAtTop } = useScrollDirection({ threshold: 10 });
  // Hide header when scrolling down and not at top (mobile only behavior handled in CSS)
  const isHeaderHidden = scrollDirection === "down" && !isAtTop;

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
        const params: Record<string, string | number | boolean | undefined> = {
          page: pageNum,
          limit: 24,
          prompt_type: promptType,
        };

        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedCategory) params.category = selectedCategory;
        if (selectedTag) params.tag = selectedTag;
        // 默认过滤 NSFW，除非明确选择了 NSFW 分类
        if (selectedCategory !== "NSFW") {
          params.excludeNsfw = true;
        }

        // 泛型直接用 Prompt[]，response.data 就是数组，response.pagination 在顶层
        const response = await apiClient.get<Prompt[]>(
          "/api/prompts",
          { params }
        )

        if (!response.success) {
          addToast({
            type: "error",
            message: response.error || t.loadError || "加载失败，请重试",
            action: {
              label: t.retry || "重试",
              onClick: () => fetchPrompts(pageNum, append),
            },
          });
          return;
        }
        console.log(append, response);
        // response 直接包含 data (Prompt[]) 和 pagination
        const { data, pagination } = response;
        if (append) {
          // 追加时去重，避免 key 冲突
          setPrompts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newItems = (data || []).filter(
              (p: Prompt) => !existingIds.has(p.id)
            );
            return [...prev, ...newItems];
          });
        } else {
          setPrompts(data || []);
        }
        setTotalCount(pagination?.total || 0);
        setHasMore(pagination?.hasMore || false);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to fetch prompts:", error);
        addToast({
          type: "error",
          message: t.loadError || "加载失败，请重试",
          action: {
            label: t.retry || "重试",
            onClick: () => fetchPrompts(pageNum, append),
          },
        });
      } finally {
        setLoading(false);
      }
    },
    [
      debouncedSearch,
      selectedCategory,
      selectedTag,
      promptType,
      apiClient,
      addToast,
      t,
    ]
  );

  // 标记是否有过筛选操作
  const [hasFiltered, setHasFiltered] = useState(false);

  // 获取 tags 和 categories（根据 promptType）
  const fetchFilters = useCallback(async () => {
    try {
      const params = { prompt_type: promptType };

      const [tagsResponse, categoriesResponse] = await Promise.all([
        apiClient.get<TagsApiResponse>("/api/tags", { params }),
        apiClient.get<CategoriesApiResponse>("/api/categories", { params }),
      ]);

      if (tagsResponse.success && tagsResponse.data) {
        setTags(tagsResponse.data || []);
      } else if (tagsResponse.error) {
        console.error("Failed to fetch tags:", tagsResponse.error);
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data || []);
      } else if (categoriesResponse.error) {
        console.error("Failed to fetch categories:", categoriesResponse.error);
      }
    } catch (error) {
      console.error("Failed to fetch filters:", error);
      addToast({
        type: "error",
        message: t.loadError || "加载筛选条件失败",
      });
    }
  }, [promptType, apiClient, addToast, t]);

  // promptType 变化时重新获取 tags 和 categories
  // 使用 ref 跟踪是否是首次渲染，避免覆盖初始数据
  const isFirstRender = React.useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      // 首次渲染时，使用服务端传入的初始数据，不需要重新请求
      isFirstRender.current = false;
      return;
    }

    // 切换类型时清空已选的分类和标签
    setSelectedCategory(null);
    setSelectedTag(null);
    fetchFilters();
  }, [promptType]); // 移除 fetchFilters 依赖，避免循环

  // 当筛选条件变化时重新获取数据
  const isFirstFilterRender = useRef(true);

  useEffect(() => {
    // 首次渲染跳过，使用初始数据
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }

    // promptType 变化时总是请求 API
    if (promptType !== "image") {
      setHasFiltered(true);
      fetchPrompts(1, false);
      return;
    }

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
  }, [debouncedSearch, selectedCategory, selectedTag, promptType]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchPrompts(page + 1, true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Header
        lang={lang}
        onLangChange={setLang}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        promptType={promptType}
        onPromptTypeChange={setPromptType}
        isHidden={isHeaderHidden}
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
            <div
              key={filterKey}
              className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5"
            >
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

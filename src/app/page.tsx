import { Suspense } from 'react';
import PromptsContainerWrapper from '@/components/PromptsContainerWrapper';
import { fetchPrompts, fetchTags, fetchCategories } from '@/lib/data';

// 页面级缓存配置
// revalidate: 60 表示每 60 秒重新验证一次缓存
export const revalidate = 60;

// 主页 - Server Component
// SSR 优势: SEO、更快的首屏渲染、减少客户端 JS
export default async function Home() {
  // 默认 prompt_type 为 'image'
  const defaultPromptType = 'image';
  
  // 服务端并行获取初始数据，传入 prompt_type 确保数据一致
  const [promptsResult, tags, categories] = await Promise.all([
    fetchPrompts({ page: 1, limit: 24, prompt_type: defaultPromptType }),
    fetchTags(defaultPromptType),
    fetchCategories(defaultPromptType),
  ]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
        </div>
      }
    >
      <PromptsContainerWrapper
        initialPrompts={promptsResult}
        initialTags={tags}
        initialCategories={categories}
      />
    </Suspense>
  );
}

"use client";

// 瀑布流卡片骨架屏组件
export default function PromptCardSkeleton() {
  return (
    <div
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl overflow-hidden 
                 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]
                 dark:shadow-[0_2px_15px_-3px_rgba(0,0,0,0.3)]
                 border border-gray-200/50 dark:border-gray-700/50
                 break-inside-avoid mb-5"
    >
      {/* 图片骨架 */}
      <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-800 min-h-[160px] animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800" />
      </div>

      {/* 内容骨架 */}
      <div className="p-5 space-y-3">
        {/* 标题骨架 */}
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-3/4" />
        
        {/* 描述骨架 */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
        </div>
        
        {/* 作者骨架 */}
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4" />
        
        {/* 按钮骨架 */}
        <div className="flex gap-2 pt-2">
          <div className="flex-1 h-11 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// 骨架屏列表组件
export function PromptCardSkeletonList({ count = 12 }: { count?: number }) {
  // 为瀑布流生成随机但固定的高度
  const heights = [160, 200, 180, 220, 190, 170, 210, 185, 195, 175, 205, 215];
  
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl overflow-hidden 
                     shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]
                     dark:shadow-[0_2px_15px_-3px_rgba(0,0,0,0.3)]
                     border border-gray-200/50 dark:border-gray-700/50
                     break-inside-avoid mb-5"
        >
          <div 
            className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse"
            style={{ height: heights[i % heights.length] }}
          />
          <div className="p-5 space-y-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-3/4" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4" />
            <div className="flex gap-2 pt-2">
              <div className="flex-1 h-11 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
              <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

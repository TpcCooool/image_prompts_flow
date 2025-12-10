"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  RefreshCw,
} from "lucide-react";
import PromptForm, { PromptFormData } from "@/components/PromptForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Prompt } from "@/types";
import { getImageUrl } from "@/lib/config";
import { useDebounce } from "@/hooks/useDebounce";

interface PromptWithId extends Prompt {
  id: number;
}

interface PromptsResponse {
  data: PromptWithId[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}


export default function AdminPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [prompts, setPrompts] = useState<PromptWithId[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptWithId | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPrompt, setDeletingPrompt] = useState<PromptWithId | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 检查认证状态，未登录则跳转
  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    router.replace("/admin/login");
  };

  // 获取分类
  useEffect(() => {
    if (checkingAuth) return;
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []))
      .catch(console.error);
  }, [checkingAuth]);

  // 获取提示词列表
  const fetchPrompts = useCallback(async () => {
    if (checkingAuth) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/prompts?${params.toString()}`);
      const data: PromptsResponse = await res.json();

      setPrompts(data.data || []);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
    } finally {
      setLoading(false);
    }
  }, [checkingAuth, page, debouncedSearch]);

  // 搜索变化时重置页码
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // 创建提示词
  const handleCreate = async (formData: PromptFormData) => {
    const res = await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "创建失败");
    }
    fetchPrompts();
  };

  // 更新提示词
  const handleUpdate = async (formData: PromptFormData) => {
    if (!editingPrompt) return;
    const res = await fetch(`/api/prompts/${editingPrompt.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "更新失败");
    }
    fetchPrompts();
  };

  // 删除提示词
  const handleDelete = async () => {
    if (!deletingPrompt) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/prompts/${deletingPrompt.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "删除失败");
      }
      setDeleteDialogOpen(false);
      setDeletingPrompt(null);
      fetchPrompts();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditForm = (prompt: PromptWithId) => {
    setEditingPrompt(prompt);
    setFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingPrompt(null);
    setFormOpen(true);
  };

  const openDeleteDialog = (prompt: PromptWithId) => {
    setDeletingPrompt(prompt);
    setDeleteDialogOpen(true);
  };

  // 检查认证中显示 loading
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            提示词管理
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPrompts}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                         text-gray-600 dark:text-gray-400 transition-colors"
              title="刷新"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg 
                         hover:bg-gray-100 dark:hover:bg-gray-800 
                         text-gray-600 dark:text-gray-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">退出</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索提示词..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={openCreateForm}
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-xl
                       bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm
                       transition-colors shrink-0"
          >
            <Plus className="w-5 h-5" />
            添加提示词
          </button>
        </div>

        {/* Stats */}
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          共 {total} 条记录
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    预览
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    作者
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    模式
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                      </div>
                    </td>
                  </tr>
                ) : prompts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  prompts.map((prompt) => (
                    <tr
                      key={prompt.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <img
                          src={getImageUrl(prompt.preview)}
                          alt={prompt.title}
                          className="w-16 h-12 object-cover rounded-lg bg-gray-100 dark:bg-gray-800"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/64x48/f3f4f6/9ca3af?text=No+Image";
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {prompt.title}
                          </p>
                          {prompt.title_en && (
                            <p className="text-xs text-gray-500 truncate">
                              {prompt.title_en}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {prompt.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {prompt.author}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            prompt.mode === "generate"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          }`}
                        >
                          {prompt.mode === "generate" ? "生成" : "编辑"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditForm(prompt)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                                       text-gray-600 dark:text-gray-400 transition-colors"
                            title="编辑"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(prompt)}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 
                                       text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 
                                       transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                第 {page} / {totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                             text-gray-600 dark:text-gray-400 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                             text-gray-600 dark:text-gray-400 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Form Modal */}
      <PromptForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingPrompt(null);
        }}
        onSubmit={editingPrompt ? handleUpdate : handleCreate}
        initialData={editingPrompt || undefined}
        categories={categories}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="确认删除"
        message={`确定要删除「${deletingPrompt?.title}」吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeletingPrompt(null);
        }}
      />
    </div>
  );
}

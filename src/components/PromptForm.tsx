"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { Prompt } from "@/types";
import ImageUpload from "./ImageUpload";

interface PromptFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PromptFormData) => Promise<void>;
  initialData?: Prompt & { id?: number };
  categories: string[];
}

export interface PromptFormData {
  title: string;
  title_en: string;
  preview: string;
  prompt: string;
  prompt_en: string;
  author: string;
  link: string;
  mode: "generate" | "edit";
  category: string;
  sub_category: string;
  tags: string[];
}

const defaultFormData: PromptFormData = {
  title: "",
  title_en: "",
  preview: "",
  prompt: "",
  prompt_en: "",
  author: "",
  link: "",
  mode: "generate",
  category: "",
  sub_category: "",
  tags: [],
};

export default function PromptForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
}: PromptFormProps) {
  const [formData, setFormData] = useState<PromptFormData>(defaultFormData);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof PromptFormData, string>>>({}); 
  const [uploadedImageKey, setUploadedImageKey] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [originalPreview, setOriginalPreview] = useState<string>(""); // 保存原始图片 URL（预留用于后续删除旧图片）

  const isEditing = !!initialData?.id;

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        title_en: initialData.title_en || "",
        preview: initialData.preview || "",
        prompt: initialData.prompt || "",
        prompt_en: initialData.prompt_en || "",
        author: initialData.author || "",
        link: initialData.link || "",
        mode: initialData.mode || "generate",
        category: initialData.category || "",
        sub_category: initialData.sub_category || "",
        tags: initialData.tags || [],
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
    setUploadedImageKey(null);
    setOriginalPreview(initialData?.preview || "");
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PromptFormData, string>> = {};

    if (!formData.title.trim()) newErrors.title = "标题不能为空";
    if (!formData.preview.trim()) newErrors.preview = "预览图不能为空";
    if (!formData.prompt.trim()) newErrors.prompt = "提示词不能为空";
    if (!formData.author.trim()) newErrors.author = "作者不能为空";
    if (!formData.category.trim()) newErrors.category = "分类不能为空";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 清理新上传的图片（取消或失败时调用）
  const cleanupUploadedImage = async () => {
    if (uploadedImageKey) {
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: uploadedImageKey }),
        });
        console.log("已清理上传的图片:", uploadedImageKey);
      } catch (cleanupError) {
        console.error("清理图片失败:", cleanupError);
      }
    }
  };

  // 关闭表单（包含取消时的清理）
  const handleClose = async () => {
    // 如果用户上传了新图片但取消，删除新上传的图片
    await cleanupUploadedImage();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      setUploadedImageKey(null); // 成功后清除 key
      onClose();
    } catch (error) {
      console.error("提交失败:", error);
      // 补偿机制：如果数据库操作失败，删除已上传的图片
      await cleanupUploadedImage();
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) handleClose();
      }}
    >
      <div
        className="modal-content bg-white dark:bg-gray-900 rounded-2xl shadow-2xl 
                   border border-gray-200/50 dark:border-gray-700/50
                   w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? "编辑提示词" : "添加提示词"}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                       text-gray-500 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Title */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className={`w-full h-10 px-3 rounded-xl border bg-white dark:bg-gray-800 
                             text-gray-900 dark:text-white text-sm
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             ${errors.title ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  placeholder="中文标题"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  英文标题
                </label>
                <input
                  type="text"
                  value={formData.title_en}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title_en: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="English Title"
                />
              </div>
            </div>

            {/* Preview Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                预览图 <span className="text-red-500">*</span>
              </label>
              <ImageUpload
                value={formData.preview}
                onChange={(url) => setFormData((prev) => ({ ...prev, preview: url }))}
                onKeyChange={setUploadedImageKey}
                disabled={loading}
              />
              {errors.preview && <p className="text-red-500 text-xs mt-1">{errors.preview}</p>}
            </div>

            {/* Prompt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  提示词 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                  rows={4}
                  className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-gray-800 
                             text-gray-900 dark:text-white text-sm resize-none
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             ${errors.prompt ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  placeholder="中文提示词内容..."
                />
                {errors.prompt && <p className="text-red-500 text-xs mt-1">{errors.prompt}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  英文提示词
                </label>
                <textarea
                  value={formData.prompt_en}
                  onChange={(e) => setFormData((prev) => ({ ...prev, prompt_en: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="English prompt content..."
                />
              </div>
            </div>

            {/* Author & Link */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  作者 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                  className={`w-full h-10 px-3 rounded-xl border bg-white dark:bg-gray-800 
                             text-gray-900 dark:text-white text-sm
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             ${errors.author ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  placeholder="作者名称"
                />
                {errors.author && <p className="text-red-500 text-xs mt-1">{errors.author}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  来源链接
                </label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Mode & Category */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  模式 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.mode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, mode: e.target.value as "generate" | "edit" }))
                  }
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="generate">生成</option>
                  <option value="edit">编辑</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  分类 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="categories"
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className={`w-full h-10 px-3 rounded-xl border bg-white dark:bg-gray-800 
                             text-gray-900 dark:text-white text-sm
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             ${errors.category ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  placeholder="选择或输入分类"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  子分类
                </label>
                <input
                  type="text"
                  value={formData.sub_category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sub_category: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="子分类"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                标签
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入标签后按回车添加"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 
                             text-gray-700 dark:text-gray-300 text-sm font-medium
                             hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  添加
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs
                                 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-11 rounded-xl text-sm font-medium
                         bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                         hover:bg-gray-200 dark:hover:bg-gray-700
                         transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-xl text-sm font-medium
                         bg-blue-500 hover:bg-blue-600 text-white
                         transition-colors disabled:opacity-50
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? "更新" : "创建"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

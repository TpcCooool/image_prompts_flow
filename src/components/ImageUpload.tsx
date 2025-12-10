"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { getImageUrl } from "@/lib/config";

interface ImageUploadProps {
  value: string;
  onChange: (url: string, key?: string) => void;
  onKeyChange?: (key: string | null) => void;
  disabled?: boolean;
}

interface UploadResult {
  url: string;
  key: string;
}

export default function ImageUpload({
  value,
  onChange,
  onKeyChange,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "上传失败");
      }

      const result: UploadResult = await res.json();
      onChange(result.url, result.key);
      onKeyChange?.(result.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    }
  };

  return (
    <div className="space-y-2">
      {/* 预览区域 / 上传区域 */}
      {value ? (
        <div className="space-y-2">
          {/* 图片预览 */}
          <div className="relative group">
            <img
              src={getImageUrl(value)}
              alt="Preview"
              className="w-full h-40 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/400x160/f3f4f6/9ca3af?text=Invalid+Image";
              }}
            />
          </div>

          {/* 图片链接（只读显示） */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <span
              className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1"
              title={value}
            >
              {value}
            </span>
          </div>

          {/* 更换图片按钮 */}
          {!disabled && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full h-10 rounded-xl text-sm font-medium
                         bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                         hover:bg-gray-200 dark:hover:bg-gray-700
                         transition-colors disabled:opacity-50
                         flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  更换图片
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !uploading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed
            transition-colors cursor-pointer
            ${
              dragOver
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            }
            ${disabled || uploading ? "cursor-not-allowed opacity-50" : ""}
          `}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <span className="text-sm text-gray-500">上传中...</span>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-2">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-sm text-gray-500">点击或拖拽上传图片</span>
              <span className="text-xs text-gray-400 mt-1">
                支持 JPG、PNG、GIF、WebP，最大 10MB
              </span>
            </>
          )}
        </div>
      )}

      {/* 隐藏的 input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* 错误提示 */}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

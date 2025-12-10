import { NextRequest } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { successResponse, ApiError } from '@/lib/api-response';

// Cloudflare R2 配置
const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!; // 例如: https://your-bucket.r2.dev

// 生成唯一文件名
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop() || 'jpg';
  return `prompts/${timestamp}-${random}.${ext}`;
}

// 上传图片
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return ApiError.BAD_REQUEST('未提供文件');
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return ApiError.BAD_REQUEST('不支持的文件类型，仅支持 JPG、PNG、GIF、WebP');
    }

    // 验证文件大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return ApiError.BAD_REQUEST('文件过大，最大支持 10MB');
    }

    const fileName = generateFileName(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    // 上传到 R2
    await R2.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const url = `${PUBLIC_URL}/${fileName}`;

    return successResponse({ url, key: fileName });
  } catch (error) {
    console.error('Upload error:', error);
    return ApiError.SERVER_ERROR('上传失败');
  }
}

// 删除图片（用于补偿机制）
export async function DELETE(request: NextRequest) {
  try {
    const { key } = await request.json();

    if (!key) {
      return ApiError.BAD_REQUEST('未提供文件 key');
    }

    await R2.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );

    return successResponse(null, '删除成功');
  } catch (error) {
    console.error('Delete error:', error);
    return ApiError.SERVER_ERROR('删除失败');
  }
}

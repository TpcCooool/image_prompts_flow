// 图片 CDN 域名配置
// 修改这里来切换图片源
export const IMAGE_BASE_URL = 'https://pub-974258f086414f3f9aca93f0cae7d280.r2.dev';

// 获取完整图片 URL
export function getImageUrl(imagePath: string): string {
  // 如果已经是完整 URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // 否则拼接 base URL
  return `${IMAGE_BASE_URL}/${imagePath}`;
}

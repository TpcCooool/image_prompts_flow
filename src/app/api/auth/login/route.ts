import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';
import { successResponse, ApiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const { username = 'admin', password } = await request.json();

    if (!password) {
      return ApiError.BAD_REQUEST('请输入密码');
    }

    // 从数据库查询用户
    const { data: user, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, username, password_hash')
      .eq('username', username)
      .single();

    if (error || !user) {
      return ApiError.UNAUTHORIZED('用户名或密码错误');
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return ApiError.UNAUTHORIZED('用户名或密码错误');
    }

    // 生成 token
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    
    return successResponse({ token });
  } catch {
    return ApiError.BAD_REQUEST('请求解析失败');
  }
}

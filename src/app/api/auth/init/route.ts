import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';
import { successResponse, ApiError } from '@/lib/api-response';

// 初始化管理员账户（只应该运行一次）
// 调用: POST /api/auth/init
export async function POST(request: NextRequest) {
  try {
    const { secret, username = 'admin', password } = await request.json();
    
    // 需要 service role key 作为 secret 验证
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret || secret !== serviceKey?.slice(-10)) {
      return ApiError.UNAUTHORIZED('未授权');
    }

    if (!password) {
      return ApiError.BAD_REQUEST('请提供密码');
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 检查用户是否存在
    const { data: existing } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      // 更新密码
      const { error } = await supabaseAdmin
        .from('admin_users')
        .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
        .eq('username', username);

      if (error) throw error;
      return successResponse(null, '管理员密码已更新');
    }

    // 创建新用户
    const { error } = await supabaseAdmin
      .from('admin_users')
      .insert({ username, password_hash: passwordHash });

    if (error) throw error;
    return successResponse(null, '管理员账户已创建');
  } catch (err) {
    const message = err instanceof Error ? err.message : '操作失败';
    return ApiError.SERVER_ERROR(message);
  }
}

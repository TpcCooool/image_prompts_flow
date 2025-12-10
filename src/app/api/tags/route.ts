import { supabase } from '@/lib/supabase';
import { successResponse, ApiError } from '@/lib/api-response';

export async function GET() {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('count', { ascending: false });

  if (error) {
    return ApiError.SERVER_ERROR(error.message);
  }

  return successResponse({ data: data || [] });
}

import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  if (hasSupabasePublicEnv()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) await supabase.auth.signOut();
  }

  revalidatePath('/', 'layout');
  return NextResponse.redirect(new URL('/auth?message=signedout', request.url), { status: 303 });
}

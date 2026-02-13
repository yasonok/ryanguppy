/**
 * Aquarium Studio - Supabase 配置
 */

const SUPABASE_URL = 'https://yasonok.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KmbFDTbOwxAS4kFFzNKnoA_bWJARvIA';

// 匯出到全域
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

console.log('✅ Supabase 配置已載入');
console.log('📡 URL:', SUPABASE_URL);

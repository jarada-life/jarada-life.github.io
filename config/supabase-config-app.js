import { supabaseConfig } from "./supabaseConfig";

// Supabase API 호출을 위한 유틸리티 함수
export async function saveTokenToSupabase(token, userId = 'anonymous') {
    try {
        // const response = await fetch(`${supabaseConfig.projectUrl}/rest/v1/${supabaseConfig.tableName}`, {
        const response = await fetch(`${supabaseConfig.projectUrl}/rest/v1/${supabaseConfig.tableName}`, {
            method: 'POST',
            headers: {
                'apikey': supabaseConfig.anonKey,
                'Authorization': `Bearer ${supabaseConfig.anonKey}`,
                'Content-Type': 'application/json',
                'Content-Profile': supabaseConfig.schema,  // 스키마 지정 방식 수정
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                user_id: userId,
                fcm_token: token,
                device_type: 'web',
                created_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save token to Supabase');
        }

        return true;
    } catch (error) {
        console.error('Error saving token to Supabase:', error);
        throw error;
    }
}
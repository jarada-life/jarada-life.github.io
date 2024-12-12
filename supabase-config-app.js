export const supabaseConfig = {
    projectUrl: 'https://hkwmpafwndphdhodqizb.supabase.co', // https://[PROJECT_ID].supabase.co
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhrd21wYWZ3bmRwaGRob2RxaXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwOTc5ODgsImV4cCI6MjA0NzY3Mzk4OH0.MSPKwJoSN5OCvDljUXEliCbiNpFQkT6BfAyw2F-2yis',
    tableName: 'pm_push_tokens',  // Supabase에 생성한 테이블 이름
    schema: 'woorytools',  // 예: 'push_notification'
};

// Supabase API 호출을 위한 유틸리티 함수
export async function saveTokenToSupabase(token, userId = 'anonymous') {
    try {
        // const response = await fetch(`${supabaseConfig.projectUrl}/rest/v1/${supabaseConfig.tableName}`, {
            const response = await fetch(`${supabaseConfig.projectUrl}/rest/v1/rpc/${supabaseConfig.schema}_${supabaseConfig.tableName}`, {
            method: 'POST',
            headers: {
                'apikey': supabaseConfig.anonKey,
                'Authorization': `Bearer ${supabaseConfig.anonKey}`,
                'Content-Type': 'application/json',
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
// batch-notification.js
import { supabaseConfig } from './config/supabaseConfig.js';
import { firebaseConfig } from './config/firebase-config-app.js';

// Supabase에서 모든 토큰 가져오기
async function getFcmTokens() {
    try {
        const response = await fetch(
            `${supabaseConfig.projectUrl}/rest/v1/${supabaseConfig.tableName}?select=fcm_token`, {
            headers: {
                'apikey': supabaseConfig.anonKey,
                'Authorization': `Bearer ${supabaseConfig.anonKey}`,
                'Content-Profile': supabaseConfig.schema
            }
        });

        if (!response.ok) throw new Error('Failed to fetch tokens');
        
        const data = await response.json();
        return data.map(item => item.fcm_token);
    } catch (error) {
        console.error('Error fetching tokens:', error);
        throw error;
    }
}

// FCM에 일괄 전송 (최대 500개씩)
async function sendBatchNotification(title, body) {
    try {
        // 1. 모든 토큰 가져오기
        const tokens = await getFcmTokens();
        
        // 2. 500개씩 나누기 (FCM 제한)
        const chunks = [];
        for (let i = 0; i < tokens.length; i += 500) {
            chunks.push(tokens.slice(i, i + 500));
        }

        // 3. 각 청크별로 전송
        for (const tokenChunk of chunks) {
            const response = await fetch('https://fcm.googleapis.com/v1/projects/' + firebaseConfig.projectId + '/messages:send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`, // Access 토큰 필요
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: {
                        notification: {
                            title,
                            body,
                        },
                        tokens: tokenChunk, // 여러 토큰 전송
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Batch send error:', error);
            }
        }

        return true;
    } catch (error) {
        console.error('Error sending batch notification:', error);
        throw error;
    }
}
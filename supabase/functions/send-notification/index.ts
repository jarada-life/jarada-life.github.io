import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, body, scheduledTime } = await req.json()

    if (!title || !body) {
        return new Response(
            JSON.stringify({ error: 'Title and body are required' }),
            { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }


    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (scheduledTime) {
      const { error } = await supabase
        .from('pm_scheduled_notifications')
        .insert({
          title,
          body,
          scheduled_time: scheduledTime,
          status: 'pending'
        })

      if (error) throw error
      
      return new Response(
        JSON.stringify({ message: 'Notification scheduled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('fcm_token')

      const accessToken = await getFirebaseAccessToken()
      await sendNotifications(tokens, title, body, accessToken)

      return new Response(
        JSON.stringify({ message: 'Notification sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error details:', error)  // 로그 추가
    return new Response(
        JSON.stringify({ error: error.message }),
        { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
    )
  }
})

async function getFirebaseAccessToken() {
  const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? '{}')
  
  const now = Math.floor(Date.now() / 1000)
  const jwtClaims = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging'
  }

  // JWT 서명을 위한 헤더
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: serviceAccount.private_key_id
  }

  // JWT 생성
  const encoder = new TextEncoder()
  const headerBase64 = btoa(JSON.stringify(header))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  const claimsBase64 = btoa(JSON.stringify(jwtClaims))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  // 서명 생성
  const key = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(serviceAccount.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(`${headerBase64}.${claimsBase64}`)
  )

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  const jwt = `${headerBase64}.${claimsBase64}.${signatureBase64}`

  // OAuth2 토큰 요청
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })

  const { access_token } = await tokenResponse.json()
  return access_token
}

async function sendNotifications(tokens, title, body, accessToken) {
  const projectId = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? '{}').project_id

  // FCM v1 API 엔드포인트
  const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

  // 토큰 배열을 청크로 나누기 (FCM은 한 번에 500개까지만 처리)
  const chunkSize = 500
  const tokenChunks = []
  for (let i = 0; i < tokens.length; i += chunkSize) {
    tokenChunks.push(tokens.slice(i, i + chunkSize))
  }

  // 각 청크별로 메시지 전송
  for (const chunk of tokenChunks) {
    const message = {
      message: {
        notification: {
          title,
          body
        },
        tokens: chunk.map(t => t.fcm_token)
      }
    }

    const response = await fetch(fcmEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to send FCM message: ${JSON.stringify(error)}`)
    }
  }
}
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { create, verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging']

// PEM 형식의 private key를 importKey를 통해 CryptoKey로 변환
async function pemToKey(pem: string): Promise<CryptoKey> {
  // PEM 헤더/푸터 제거 및 base64 디코딩
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = pem
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');

  // base64 디코딩
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  // CryptoKey로 변환
  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    true,
    ['sign']
  );
}

// // JWT 생성 부분
// const now = Math.floor(Date.now() / 1000);
// const key = await pemToKey(serviceAccount.private_key);

// const jwt = await create(
//   { alg: 'RS256', typ: 'JWT' },
//   {
//     iss: serviceAccount.client_email,
//     scope: SCOPES.join(' '),
//     aud: 'https://oauth2.googleapis.com/token',
//     exp: now + 3600,
//     iat: now
//   },
//   key  // 변환된 CryptoKey 사용
// );

async function getAccessToken(serviceAccount) {


  // // JWT 생성
  // const jwt = await create(
  //   { alg: 'RS256', typ: 'JWT' },
  //   {
  //     iss: serviceAccount.client_email,
  //     scope: SCOPES.join(' '),
  //     aud: 'https://oauth2.googleapis.com/token',
  //     exp: now + 3600,
  //     iat: now
  //   },
  //   serviceAccount.private_key
  // )

  // JWT 생성 부분
  const now = Math.floor(Date.now() / 1000);
  const key = await pemToKey(serviceAccount.private_key);

  const jwt = await create(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: serviceAccount.client_email,
      scope: SCOPES.join(' '),
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    },
    key  // 변환된 CryptoKey 사용
  );
  // OAuth2 토큰 교환
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

  if (!tokenResponse.ok) {
    throw new Error('Failed to get access token')
  }

  const { access_token } = await tokenResponse.json()
  return access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, body } = await req.json()
    console.log('Received request:', { title, body })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { db: { schema: 'woorytools' } }
    )

    const { data: tokens, error: dbError } = await supabase
      .from('pm_push_tokens')
      .select('fcm_token')

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    console.log('Retrieved tokens:', tokens?.length ?? 0)

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No tokens available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? '{}')
    console.log(serviceAccount)
    const accessToken = await getAccessToken(serviceAccount)
    console.log('Got access token')

    // FCM 메시지 전송
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`

    for (let i = 0; i < tokens.length; i += 500) {
      const chunk = tokens.slice(i, i + 500)

      for (const token of chunk) {
        const message = {
          message: {
            token: token.fcm_token,
            notification: {
              title,
              body
            },
            android: {
              priority: 'high'
            },
            apns: {
              headers: {
                'apns-priority': '10'
              }
            }
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
          console.error('FCM Error for token:', token.fcm_token)
          const error = await response.json()
          console.error('FCM Error details:', error)
        } else {
          console.log('Successfully sent message to token:', token.fcm_token)
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Notifications sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error details:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
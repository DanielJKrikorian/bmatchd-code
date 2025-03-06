import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/13568109/2alhfqf/'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      )
    }

    // Parse request body
    const { to, template, data } = await req.json()
    
    if (!to || !template || !data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Forward to Zapier webhook
    const response = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        template,
        data
      })
    })

    // Get response text first
    const responseText = await response.text()
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      // If not JSON, use text as message
      responseData = { message: responseText }
    }

    if (!response.ok) {
      throw new Error(responseData.error || `Failed to send to Zapier: ${response.status} ${response.statusText}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email sent successfully',
        data: responseData 
      }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to send email',
        details: error.toString()
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})

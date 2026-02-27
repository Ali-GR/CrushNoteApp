import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { report_id } = await req.json()

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Get report and target content
        const { data: report, error: reportError } = await supabaseAdmin
            .from('reports')
            .select('*, target_id, target_type')
            .eq('id', report_id)
            .single()

        if (reportError || !report) {
            console.error("Report error:", reportError)
            return new Response("Report not found", { status: 404, headers: corsHeaders })
        }

        let content = ""
        let authorId = ""

        if (report.target_type === 'post') {
            const { data: post } = await supabaseAdmin.from('posts').select('content, user_id').eq('id', report.target_id).single()
            content = post?.content ?? ""
            authorId = post?.user_id ?? ""
        } else {
            const { data: comment } = await supabaseAdmin.from('comments').select('content, user_id').eq('id', report.target_id).single()
            content = comment?.content ?? ""
            authorId = comment?.user_id ?? ""
        }

        if (!content) {
            return new Response("Content not found", { status: 404, headers: corsHeaders })
        }

        // 2. OpenAI Moderation API Call
        const openAiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openAiKey) {
            return new Response("OpenAI API Key not configured", { status: 500, headers: corsHeaders })
        }

        console.log(`Analyzing content: "${content.substring(0, 50)}..."`)

        const response = await fetch("https://api.openai.com/v1/moderations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openAiKey}`
            },
            body: JSON.stringify({ input: content })
        })

        const moderationData = await response.json()
        const result = moderationData.results?.[0]
        const isViolation = result?.flagged || false

        if (isViolation) {
            console.log("Violation detected! Deleting content and adding strike.")
            // 3. Delete content
            if (report.target_type === 'post') {
                await supabaseAdmin.from('posts').delete().eq('id', report.target_id)
            } else {
                await supabaseAdmin.from('comments').delete().eq('id', report.target_id)
            }

            // 4. Add Strike
            await supabaseAdmin.rpc('increment_strikes', { user_uuid: authorId })

            return new Response(JSON.stringify({
                status: "violation",
                action: "deleted_and_striked",
                categories: result?.categories
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 5. Dismiss report
        console.log("No violation found. Dismissing report.")
        await supabaseAdmin.from('reports').delete().eq('id', report_id)

        return new Response(JSON.stringify({ status: "okay", action: "report_dismissed" }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (err: any) {
        console.error("Function error:", err)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})

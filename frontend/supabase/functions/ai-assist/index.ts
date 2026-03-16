import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";

    if (type === "document-fill") {
      systemPrompt = `You are an AI assistant for TRUSTIFICATE, a certificate issuance platform. The admin selected a template and needs you to COMPLETELY pre-fill realistic sample data for ALL empty fields. The admin will review and edit your suggestions before issuing.

Generate realistic, professional data. For example:
- Real-sounding names (e.g. "Sarah Mitchell", "David Chen")
- Professional email addresses matching the name
- Relevant course/training names matching the template type
- Realistic scores (e.g. "87%", "92/100")
- Plausible durations (e.g. "40 hours", "6 weeks")
- Today's date for completion, appropriate issuer titles

Return a JSON object with ALL of these fields filled:
{
  "recipientName": "...",
  "recipientEmail": "...",
  "courseName": "...",
  "trainingName": "...",
  "companyName": "...",
  "score": "...",
  "durationText": "...",
  "issuerName": "...",
  "issuerTitle": "...",
  "completionDate": "YYYY-MM-DD"
}

IMPORTANT: Fill EVERY field with a realistic value. The admin wants to see a complete form they can quickly edit, not empty fields.`;
    } else if (type === "template-assist") {
      systemPrompt = `You are an AI assistant for TRUSTIFICATE, a certificate issuance platform. The admin is creating a certificate template and just typed a title. Generate a COMPLETE template based on that title.

Available placeholders: {{recipient_name}}, {{course_name}}, {{score}}, {{issue_date}}, {{completion_date}}, {{duration_text}}, {{company_name}}, {{training_name}}, {{issuer_name}}, {{issuer_title}}, {{certificate_number}}.

Return a JSON object with ALL fields:
{
  "title": "refined title if needed",
  "subtitle": "e.g. Certificate of Completion",
  "bodyText": "formal certificate body using relevant {{placeholders}}",
  "numberPrefix": "2-4 letter prefix like CC, PD, CT, INT",
  "issuerName": "appropriate role title",
  "issuerTitle": "appropriate department",
  "primaryColor": "#hex color matching the certificate theme",
  "secondaryColor": "#hex lighter/accent color",
  "suggestedPlaceholders": ["array", "of", "relevant", "placeholder", "names"]
}

Write formal, professional certificate language. Use placeholders naturally in the body text. Pick colors that feel appropriate (green for completion, blue for professional, purple for achievement, etc). FILL EVERY FIELD.`;
    } else {
      throw new Error("Unknown assist type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(context) },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit reached. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify({ suggestions: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


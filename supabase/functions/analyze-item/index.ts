import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, description, name } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing item with AI:", { imageUrl, description, name });

    const messages: any[] = [
      {
        role: "system",
        content: `You are an AI assistant that helps analyze lost items. Your task is to:
1. Analyze the provided image and description
2. Extract detailed visual characteristics (color, brand, condition, distinctive features)
3. Enhance the description with specific details that would help match with found items
4. Return a structured JSON response

Be specific and focus on identifying features. Keep descriptions concise but detailed.`
      }
    ];

    // Build user message with image and text
    const userContent: any[] = [
      {
        type: "text",
        text: `Analyze this lost item:
Item Name: ${name}
User Description: ${description || "No description provided"}

Please provide:
1. A detailed description of the item's appearance
2. Key identifying features
3. Suggested keywords for matching`
      }
    ];

    if (imageUrl) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: imageUrl
        }
      });
    }

    messages.push({
      role: "user",
      content: userContent
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    console.log("AI Analysis result:", analysisText);

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: analysisText,
        originalDescription: description,
        originalName: name
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-item function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Solution for semantic-search-insight
// This replaces the placeholder in webapp/server/api/search/semantic.ts

// prepare the system prompt for the LLM
const systemPrompt = `You are a movie query analyzer.
Extract filters and optimized queries. Return ONLY JSON:

{
  "genres": ["genre1","genre2"] or null,
  "dateRange": {"start": "YYYY-MM-DD" or null, "end": "YYYY-MM-DD" or null},
  "denseQuery": "semantic reformulation for vector search",
  "sparseQuery": "keyword-style reformulation for lexical search",
  "userMessage": "Based on your request, we filtered movies by ...",
  "hasFilters": true or false
}

Rules:
- Genres: only from → action, comedy, drama, horror, sci-fi, romance, thriller, documentary, animation, fantasy, adventure, crime, mystery, western, musical, war, family, history, biography, sport. Lowercase. Null if none.

- Dates: Extract ONLY if the user explicitly mentions a time period (decade, year, range, "before/after", "recent").
  • If no explicit time reference is present, set dateRange = {"start": null, "end": null}.
  • Examples:
    - "90s" → 1990-1999
    - "2020" → 2020-2020
    - "1995 to 2000" → 1995-2000
    - "before 2000" → 1900-1999
    - "recent" → 2020-2024

- Dense query: semantic, natural, theme/plot-based.
- Sparse query: keywords, entities, compact. Drop stopwords.
- If query = only filters → denseQuery = "movies", sparseQuery = "film movie".

- userMessage format:
  • Genres + dates → "Based on your request, we filtered movies by \`{genres list}\` genres released in the \`YYYY - YYYY\` time period."
  • Only genres → "Based on your request, we filtered movies by \`{genres list}\` genres."
  • Only dates → "Based on your request, we filtered movies released in the \`YYYY - YYYY\` time period."
  • No filters → null.

Example output with both genres & dates:
{
  "genres": ["drama","sci-fi","thriller"],
  "dateRange": {"start":"1990-01-01","end":"2004-12-31"},
  "denseQuery": "dramatic and suspenseful science fiction thrillers",
  "sparseQuery": "drama sci-fi thriller movie",
  "userMessage": "Based on your request, we filtered movies by \`drama\`, \`sci-fi\`, and \`thriller\` genres released in the \`1990 - 2004\` time period.",
  "hasFilters": true
}

Example output with only genre:
{
  "genres": ["sci-fi"],
  "dateRange": {"start": null, "end": null},
  "denseQuery": "science fiction movies about space exploration",
  "sparseQuery": "sci-fi space exploration movie",
  "userMessage": "Based on your request, we filtered movies by \`sci-fi\` genres.",
  "hasFilters": true
}
`;

try {
  // Call the LLM via Groq API to get the insight
  const groq = await getGroqClient();
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: searchQuery },
    ],
    model: GROQ_MODELS.LLAMA3_1_8B_INSTANT, // which LLM to use
    temperature: 0.1, // Low temperature for consistent parsing
    max_tokens: 300, // max tokens to generate
  });

  // get the response from the LLM
  const response = completion.choices[0]?.message?.content || "{}";

  // Extract JSON from the response (in case it includes explanatory text)
  const jsonString = extractJSONFromResponse(response);
  const parsedInsight = JSON.parse(jsonString) as SearchInsight;

  // construct the insight object
  insight = {
    genres: parsedInsight.genres || undefined,
    dateRange: parsedInsight.dateRange || undefined,
    hasFilters: parsedInsight.hasFilters || false,
    userMessage:
      parsedInsight.userMessage || "We found movies matching your description.",
    denseQuery: parsedInsight.denseQuery || searchQuery,
    sparseQuery: parsedInsight.sparseQuery || searchQuery,
  };
} catch (error) {
  console.error("Error analyzing search query:", error);
}

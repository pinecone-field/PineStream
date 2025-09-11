---
slug: query-expansion
id: 4ujuns6lfqa8
type: challenge
title: Query Expansion & Enhanced Search
teaser: This challenge teaches you how to implement AI-powered query analysis, intelligent
  filtering, and enhanced search insights
notes:
- type: text
  contents: |
    # ![logo.png](../assets/logo.png) Welcome to PineStream Workshop!

    In this workshop, you'll add AI-powered features to a sample movie streaming platform.

    You will go through the following challenges:

    - Setup & Introduction
    - Embeddings Generation
    - User Recommendations
    - Semantic Search Implementation
    - Query Expansion & Enhanced Search &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#128072; ***you're here!***
    - Similar Movies (RAG Pipeline)
    - Workshop Summary & Review
- type: text
  contents: |
    # Query Expansion & Enhanced Search

    In this challenge, you will:
    - Implement AI-powered query analysis using an LLM
    - Add intelligent filtering and metadata extraction
    - Generate user-friendly insights about search results
    - Learn how AI can enhance and expand user queries
    - Understand the power of LLM-enhanced search experiences
tabs:
- id: qlgikneipnck
  title: IDE
  type: service
  hostname: pinestream
  port: 8080
- id: h8vdd2alptsa
  title: Terminal
  type: terminal
  hostname: pinestream
  workdir: /app/webapp
- id: s7szyzreqrmz
  title: PineStream
  type: service
  hostname: pinestream
  port: 3000
difficulty: advanced
enhanced_loading: null
---

 In this challenge, you will:

  - Implement AI-powered query analysis using an LLM
  - Add intelligent filtering and metadata extraction
  - Generate user-friendly insights about search results
  - Learn how AI can enhance and expand user queries
  - Understand the power of LLM-enhanced search experiences

# 🧠 &nbsp; Understanding Query Expansion & AI Insights
===

Query expansion is a technique that enhances user search queries by analyzing their intent and adding relevant context. In PineStream, this means using AI to understand what users are really looking for and

- Extracts implicit filters (genres, time periods)
- Optimizes the query for better results through dense search
- Generates a query better suited for sparse search
- Generates user-friendly insights about the search

Here is an example of what the optimized query looks like for the query `Action movies from the 90s with car chases`:

```nocopy
{
 "genres": ["action"],
 "dateRange": {
 "start": "1990-01-01",
 "end": "1999-12-31"
 },
 "denseQuery": "action movies with car chases",
 "sparseQuery": "action car chase movie"
}
```

# 🕵️ &nbsp; Check the Current Implementation
===

Go to the [Terminal](tab-1) and start the application (if not already running):

```run
cd /app/webapp
pnpm dev
```

Go to the [PineStream tab](tab-2) and try using the semantic search functionality. Notice that:

1. **Basic semantic search** works (from the previous challenge)
2. **No automatic filtering** based on query analysis
3. **No insights** are provided about search results

**You will now implement the AI-powered query expansion system**!

# 🚀 &nbsp; Implementing AI-Powered Insights
===

> [!IMPORTANT]
> The query expansion system needs an LLM to analyze user queries and extract intelligent insights. You could use OpenAI or any other LLM provider. For this workshop, you will use Groq Cloud. This LLM hosting platform provides ultra-low-latency AI inference for several modern open models. Recall that you set up a Groq account and API key during the first challenge. Now, you will use the Groq API to analyze the user query and extract insights.

As you should recall, the semantic search API is implemented in the `server/api/search/semantic.ts` file. Before the semantic search API calls the `doVectorSearch` function (which you implemented in the previous challenge), it calls the `getSearchInsight` function to get insights about the search query and prepare what arguments to pass to the `doVectorSearch` function.

Go to the [IDE tab](tab-0). Open the file `server/api/search/semantic.ts` and find the `getSearchInsight` function. Note that currently, it returns an `emptyInsight`. To make it extract insights, put the following code in the body of the placeholder:

```ts
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
```

> [!NOTE]
>While the above code block is huge, the bigger part is the system message we sent to the LLM with detailed instructions on analyzing the query and extracting insights. This system message is stored in the `systemPrompt` variable. Building such a system prompt is a skill that takes practice and largely depends on the capabilities of the particular LLM you use.

The `llama-3.1-8b-instant` model is a small, fast, and affordable model capable of producing a JSON response per the instructions in the system prompt. The semantic search API uses this JSON response to
- construct a metadata filter for date ranges and genres
- pass the optimized dense query when calling `doVectorSearch` with the dense index
- pass the optimized sparse query when calling `doVectorSearch` with the sparse index

In a nutshell, your insights gathering implementation:
1. **Prepares system prompt** with detailed instructions on how to analyze the query and extract insights
2. **Calls and LLM** to get the insights passing the system prompt and the search query
3. **Parses the JSON response** from the LLM
4. **Constructs the insight object** with the insights


# ✅ &nbsp; Test Your Implementation
===

Go to the [PineStream tab](tab-2) and use the semantic search functionality again (✨ icon in the search bar). You can use any example queries it provides or write your own. Either way, make sure the request mentions genres and/or dates so the LLM can find some insights. You should see a `Smart Filters Applied` box above the search results, telling which genres and dates filters were applied. You can click on the `?` icon to see the details and even the actual JSON response from the LLM.

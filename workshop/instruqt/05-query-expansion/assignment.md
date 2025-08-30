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
- type: text
  contents: |
    # Query Expansion & Enhanced Search

    In this challenge, you will:
    - Implement AI-powered query analysis using Groq LLM
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

- Implement AI-powered query analysis using Groq LLM
- Add intelligent filtering and metadata extraction
- Generate user-friendly insights about search results
- Learn how AI can enhance and expand user queries
- Understand the power of LLM-enhanced search experiences

# 🧠 &nbsp; Understanding Query Expansion & AI Insights
===

Query expansion is a technique that enhances user search queries by analyzing their intent and adding relevant context. In PineStream, this means using AI to understand what users are really looking for and helping them find better results.

## What Query Expansion Does

### 1. **Query Analysis**
- Understands the user's intent behind their search
- Extracts implicit filters (genres, time periods, themes)
- Identifies the type of content they're seeking

### 2. **Intelligent Filtering**
- Automatically applies relevant filters based on query analysis
- Suggests additional search criteria
- Helps users narrow down results without manual effort

### 3. **Enhanced Results**
- Provides context about why certain results were returned
- Explains how the search was interpreted
- Offers suggestions for refining the search

## Example of Query Expansion

```nocopy
User Query: "90s sci-fi movies about time travel"

AI Analysis:
- Time Period: 1990-1999
- Genre: sci-fi
- Theme: time travel
- Implicit: probably wants action/adventure, not documentaries

Expanded Query:
- Dense: "sci-fi movies about time travel with action and adventure"
- Sparse: "sci-fi time travel action adventure movie"
- Filters: genre=sci-fi, release_date=1990-1999

User Message: "Based on your request, we filtered movies by
`sci-fi` genres released in the `1990 - 1999` time period."
```

## Why This Matters

- **Better Results**: AI understands context that keywords miss
- **User Experience**: Users get results that match their intent, not just their words
- **Discovery**: Helps users find content they didn't know how to search for
- **Efficiency**: Reduces the need for multiple search attempts

# 🕵️ &nbsp; Check the Current Implementation
===

Go to the [Terminal](tab-1) and start the application (if not already running):

```run
cd /app/webapp
pnpm dev
```

Go to the [PineStream tab](tab-2) and try using the semantic search functionality. Notice that:

1. **Basic semantic search** works (from the previous challenge)
2. **No AI insights** are provided about search results
3. **No automatic filtering** based on query analysis
4. **No query expansion** or enhancement

**You will now implement the AI-powered query expansion system**!

# 🚀 &nbsp; Implementing AI-Powered Query Analysis
===

The query expansion system uses Groq LLM to analyze user queries and extract intelligent insights. This is implemented in the `server/api/search/semantic.ts` file.

## Step 1: Implement Query Analysis with LLM

Go to the [IDE tab](tab-0). Open the file `server/api/search/semantic.ts` and find the `generateSearchInsight` function.

This function should use Groq LLM to analyze the search query and extract insights. Replace the `// STEP 1: Implement query analysis with LLM` placeholder with the following code:

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

This implementation:
1. **Defines a comprehensive system prompt** that instructs the LLM how to analyze queries
2. **Calls Groq LLM** with the user's query to get intelligent analysis
3. **Extracts structured insights** including genres, date ranges, and optimized queries
4. **Handles errors gracefully** with fallback values

## Step 2: Apply Insights to Search

Now you need to use the AI-generated insights to enhance the search process. Find the `performEnhancedSearch` function and replace the `// STEP 1: Apply AI insights to search` placeholder with the following code:

```ts
// Generate AI insights for the query
const insight = await generateSearchInsight(searchQuery);

// Build metadata filter from AI insights
const metadataFilter: any = {};
if (insight.genres && insight.genres.length > 0) {
  metadataFilter.genre = { $in: insight.genres };
}
if (insight.dateRange?.start || insight.dateRange?.end) {
  if (insight.dateRange.start) {
    metadataFilter.release_date = { $gte: dateToNumber(insight.dateRange.start) };
  }
  if (insight.dateRange.end) {
    metadataFilter.release_date = {
      ...metadataFilter.release_date,
      $lte: dateToNumber(insight.dateRange.end)
    };
  }
}

// Use enhanced queries for better search results
const denseQuery = insight.denseQuery || searchQuery;
const sparseQuery = insight.sparseQuery || searchQuery;

// Perform hybrid search with enhanced queries and filters
const denseResults = await performVectorSearch(
  denseQuery,
  PINECONE_INDEXES.MOVIES_DENSE,
  limit,
  metadataFilter
);

const sparseResults = await performVectorSearch(
  sparseQuery,
  PINECONE_INDEXES.MOVIES_SPARSE,
  limit,
  metadataFilter
);

// Combine and deduplicate results
const combinedResults = new Set<number>();
denseResults.forEach((id) => combinedResults.add(id));
sparseResults.forEach((id) => combinedResults.add(id));

return {
  movies: Array.from(combinedResults),
  insight: insight
};
```

This enhanced search:
1. **Uses AI insights** to build intelligent metadata filters
2. **Applies genre and date filters** automatically based on query analysis
3. **Uses optimized queries** for both dense and sparse search
4. **Returns both results and insights** for a better user experience

## Summary

You have now implemented a sophisticated AI-powered query expansion system that:

1. **Analyzes User Intent**: Uses Groq LLM to understand what users are really looking for
2. **Extracts Intelligent Filters**: Automatically identifies genres, time periods, and themes
3. **Optimizes Search Queries**: Creates better dense and sparse queries for improved results
4. **Provides User Insights**: Explains how the search was interpreted and what filters were applied

The system transforms simple user queries into intelligent, context-aware searches that deliver much better results.

# 🎯 &nbsp; How the Enhanced Search System Works

## The Complete Enhanced Search Flow

1. **User Query**: User types "90s sci-fi movies about time travel"
2. **AI Analysis**: LLM analyzes the query and extracts:
   - Genres: ["sci-fi"]
   - Date Range: 1990-1999
   - Enhanced dense query: "sci-fi movies about time travel with action and adventure"
   - Enhanced sparse query: "sci-fi time travel action adventure movie"
3. **Filter Application**: System automatically applies genre and date filters
4. **Enhanced Search**: Uses optimized queries for both dense and sparse search
5. **Result Combination**: Combines results from both search strategies
6. **User Feedback**: Provides clear explanation of what was searched and filtered

## Why This Approach Works

- **Intelligent Understanding**: LLM grasps context that simple keyword matching misses
- **Automatic Filtering**: Users don't need to manually specify filters
- **Better Queries**: Enhanced queries lead to more relevant results
- **User Transparency**: Clear explanation of how the search was interpreted

## Example Query Transformations

```nocopy
Input: "recent action movies with strong female leads"
AI Output:
- Genres: ["action"]
- Date Range: 2020-2024
- Dense Query: "recent action movies featuring strong female protagonists"
- Sparse Query: "action strong female lead movie"
- User Message: "Based on your request, we filtered movies by `action` genres released in the `2020 - 2024` time period."

Input: "classic westerns before 1980"
AI Output:
- Genres: ["western"]
- Date Range: 1900-1979
- Dense Query: "classic western films from the golden age of cinema"
- Sparse Query: "western classic movie"
- User Message: "Based on your request, we filtered movies by `western` genres released in the `1900 - 1979` time period."
```

# ✅ &nbsp; Test Your Implementation
===

Go to the [PineStream tab](tab-2) and test the enhanced semantic search functionality:

1. **Test AI-powered queries**:
   - "90s sci-fi movies about time travel"
   - "recent action movies with strong female leads"
   - "classic westerns before 1980"
   - "psychological thrillers from the 2000s"

2. **Verify AI insights**:
   - Check that genres are automatically extracted
   - Verify date ranges are correctly identified
   - Confirm enhanced queries are generated
   - Look for user-friendly messages explaining the search

3. **Test filtering behavior**:
   - Results should respect automatically applied filters
   - Date ranges should limit results appropriately
   - Genre filters should work correctly
   - Combined filters should work together

## What to Look For

- **Intelligent filtering**: Automatic genre and date extraction
- **Enhanced queries**: Better search terms than the original input
- **User transparency**: Clear explanation of what was searched
- **Improved results**: More relevant and focused search results

## Troubleshooting

If the enhanced search isn't working:
1. **Check Groq API**: Verify your Groq API key is working
2. **Check terminal logs**: Look for LLM API errors
3. **Verify JSON parsing**: Ensure the LLM response is valid JSON
4. **Test with simple queries**: Start with basic queries to isolate issues

# 🎉 &nbsp; Congratulations!

You've successfully implemented an AI-powered query expansion system! This system:

- **Understands user intent** through intelligent LLM analysis
- **Automatically applies filters** based on query context
- **Optimizes search queries** for better results
- **Provides transparent insights** about search interpretation

In the final challenge, you'll implement the RAG pipeline for similar movies, bringing together all the AI capabilities you've built to create a complete, intelligent movie discovery system!

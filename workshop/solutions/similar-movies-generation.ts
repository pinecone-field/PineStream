// Solution for similar-movies-generation
// This replaces the placeholder in webapp/server/api/movies/[id]/similar.ts

// If Groq API is not available, return generic descriptions
if (!isGroqAvailable) {
  return batch.map(
    () => `Similar to ${currentMovie.title} in genre and style.`
  );
}

// Prepare the base prompt for individual movie comparisons
const systemPrompt = `You are a movie plot analyzing expert. 
        The user is viewing a web page that displays a movie details and similar movies. 
        You will be given:
      - The title and plot of the a reference movie (the one the page is about)
      - List of similar movies (titles and plots) to compare to the reference movie
      Your task is to generate one sentence explanation of how each movie in the list 
      is similar to the reference movie.
      Focus on:
      - Shared themes, plot elements, or character dynamics
      - Similar genres, tone, or atmosphere
      - Comparable storylines or settings
      - Emotional or narrative similarities

      Explain to the user why the movies are similar (plot, genre, tone, atmosphere, ..). 
      Keep the description to ONE sentence PER LINE. 
      Do not output anything but the sentences. 
      Do not number the sentences. Do not use bullet points.`;

try {
  const groq = await getGroqClient();
  const prompt = `
      Reference Movie: \n${referenceMovie.title}
      Plot: \n${
        referenceMovie.plot || referenceMovie.overview || "No plot available"
      }

      Movies to analyze:
      ${similarMovies
        .map(
          (movie: any, index: number) => `
          ${index + 1}.
          Title: \n${movie.title} - ${movie.genre || "N/A"}
          Plot: \n${movie.plot || movie.overview || "No plot available"}
          `
        )
        .join("\n\n")}
    `;
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    model: GROQ_MODELS.LLAMA3_1_8B_INSTANT, // which LLM to use
    temperature: 0.3,
    max_tokens: 400,
  });
  const response = completion.choices[0]?.message?.content || "";
  return response
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .slice(0, batch.length);
} catch (error) {
  console.error("Error generating similarity descriptions:", error);
  // Fallback: add generic descriptions if LLM fails
  return batch.map(
    () => `Similar to ${currentMovie.title} in genre and style.`
  );
}

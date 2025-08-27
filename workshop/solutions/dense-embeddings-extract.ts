// Solution for dense-embeddings-extract
// This replaces the placeholder in webapp/server/api/admin/generate-dense-embeddings.post.ts

//
// STEP 1: Assert that the movie has a plot and overview
//
const plotText = movie.plot || "";
const overviewText = movie.overview || "";
if (!plotText.trim() && !overviewText.trim()) {
  return chunks;
}

//
// STEP 2: Create chunks from the plot text if available
//
if (plotText.trim()) {
  const plotChunks = await splitText(plotText);

  // Create a record for each plot chunk
  for (let chunkIndex = 0; chunkIndex < plotChunks.length; chunkIndex++) {
    const chunk = plotChunks[chunkIndex];
    const chunkId = `${movie.id}_plot_chunk_${chunkIndex}`;

    chunks.push({
      id: chunkId,
      text: chunk,
      title: movie.title || "Unknown Title",
      genre: csvToArray(movie.genre),
      movieId: movie.id,
      chunkIndex: chunkIndex,
      totalChunks: plotChunks.length,
      source: "plot",
      ...(movie.release_date && {
        release_date: dateToNumber(movie.release_date),
      }),
    });
  }
}

//
// STEP 3: Create chunks from the overview text if available
//
if (overviewText.trim()) {
  const overviewChunks = await splitText(overviewText);

  // Create a record for each overview chunk
  for (let chunkIndex = 0; chunkIndex < overviewChunks.length; chunkIndex++) {
    const chunk = overviewChunks[chunkIndex];
    const chunkId = `${movie.id}_overview_chunk_${chunkIndex}`;

    chunks.push({
      id: chunkId,
      text: chunk,
      title: movie.title || "Unknown Title",
      genre: csvToArray(movie.genre),
      movieId: movie.id,
      chunkIndex: chunkIndex,
      totalChunks: overviewChunks.length,
      source: "overview",
      ...(movie.release_date && {
        release_date: dateToNumber(movie.release_date),
      }),
    });
  }
}

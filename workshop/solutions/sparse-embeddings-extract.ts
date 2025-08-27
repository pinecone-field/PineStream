// Solution for sparse-embeddings-extract
// This replaces the placeholder in webapp/server/api/admin/generate-sparse-embeddings.post.ts

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
  chunks.push({
    id: `${movie.id}_plot`,
    text: plotText,
    title: movie.title,
    genre: csvToArray(movie.genre),
    movie_id: movie.id,
    source: "plot",
    ...(movie.release_date && {
      release_date: dateToNumber(movie.release_date),
    }),
  });
}

//
// STEP 3: Create chunks from the overview text if available
//
if (overviewText.trim()) {
  chunks.push({
    id: `${movie.id}_overview`,
    text: overviewText,
    title: movie.title,
    genre: csvToArray(movie.genre),
    movie_id: movie.id,
    source: "overview",
    ...(movie.release_date && {
      release_date: dateToNumber(movie.release_date),
    }),
  });
}

<template>
  <footer class="bg-black/90 text-gray-400 py-8">
    <div class="container mx-auto px-4">
      <div class="text-center">
        <div class="flex flex-col lg:flex-row lg:justify-center lg:space-x-8">
          <p class="text-sm">
            Data powered by
            <a
              href="https://huggingface.co/datasets/DSWF/movie-dataset"
              target="_blank"
              rel="noopener noreferrer"
              class="text-red-500 hover:text-red-400 underline"
            >
              Hugging Face Movie Dataset
            </a>
          </p>
          <p class="text-sm mt-2 lg:mt-0">
            Images provided by
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-red-500 hover:text-red-400 underline"
            >
              TMDB
            </a>
          </p>
          <p class="text-sm mt-2 lg:mt-0">
            Plot data from
            <a
              href="https://www.kaggle.com/datasets/exactful/wikipedia-movies/data"
              target="_blank"
              rel="noopener noreferrer"
              class="text-red-500 hover:text-red-400 underline"
            >
              Wikipedia Movies Dataset
            </a>
          </p>
        </div>
        <p class="text-xs mt-4 text-gray-500">
          © 2025
          <a
            href="https://pinecone.io"
            target="_blank"
            rel="noopener noreferrer"
            class="text-red-500 hover:text-red-400 underline"
          >
            Pinecone
          </a>
          . All rights reserved.
        </p>
        <p class="text-xs mt-2 text-gray-600">
          Conceived and built by Milen Dyankov
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
// No additional logic needed for this footer component
</script>

<style scoped>
/* Footer styles are handled by Tailwind classes */
</style>

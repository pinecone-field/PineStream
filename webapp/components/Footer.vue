<template>
  <footer class="bg-black/90 text-gray-400 py-8">
    <div class="container mx-auto px-4">
      <div class="text-center">
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
        <p class="text-sm mt-2">
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
        <p class="text-xs mt-4 text-gray-500">
          © 2024 PineStream. All rights reserved.
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

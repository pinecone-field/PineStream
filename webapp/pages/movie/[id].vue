<template>
  <div class="bg-black text-white">
    <!-- Header -->
    <Header :show-search="false" :show-back-button="true" />

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-screen">
      <div class="text-2xl">Loading...</div>
    </div>

    <!-- Movie Details -->
    <div v-else-if="movie" class="pt-20">
      <!-- Hero Section -->
      <section class="relative h-screen">
        <img
          v-if="movie.poster_url"
          :src="movie.poster_url"
          :alt="movie.title"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div
          v-else
          class="absolute inset-0 bg-gradient-to-br from-gray-900 to-black"
        ></div>
        <div
          class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"
        ></div>

        <div class="absolute bottom-0 left-0 right-0 p-8">
          <div class="container mx-auto">
            <div class="max-w-4xl">
              <h1 class="text-5xl font-bold mb-4">{{ movie.title }}</h1>

              <!-- Movie Meta -->
              <div class="flex items-center space-x-4 mb-4 text-sm">
                <span class="text-green-400">{{ movie.release_date }}</span>
                <span class="text-gray-400">•</span>
                <span class="text-yellow-400"
                  >⭐ {{ movie.vote_average?.toFixed(1) || "N/A" }}</span
                >
                <span class="text-gray-400">•</span>
                <span class="text-gray-400">{{ movie.vote_count }} votes</span>
                <span v-if="movie.original_language" class="text-gray-400"
                  >•</span
                >
                <span
                  v-if="movie.original_language"
                  class="text-gray-400 uppercase"
                  >{{ movie.original_language }}</span
                >
              </div>

              <!-- Genre -->
              <div v-if="movie.genre" class="mb-4">
                <span class="text-gray-300">{{ movie.genre }}</span>
              </div>

              <!-- Overview -->
              <p
                v-if="movie.overview"
                class="text-lg text-gray-300 mb-6 max-w-2xl"
              >
                {{ movie.overview }}
              </p>

              <!-- Action Buttons -->
              <div class="flex space-x-4">
                <button
                  class="bg-white text-black px-8 py-3 rounded font-semibold hover:bg-gray-200 flex items-center"
                >
                  <span class="mr-2">▶</span>
                  Play
                </button>
                <button
                  class="bg-gray-600/80 text-white px-8 py-3 rounded font-semibold hover:bg-gray-600"
                >
                  Add to List
                </button>
                <button
                  class="bg-gray-600/80 text-white px-8 py-3 rounded font-semibold hover:bg-gray-600"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Similar Movies Section -->
      <section class="container mx-auto px-4 py-8 pb-4">
        <h2 class="text-2xl font-bold mb-6">Similar Movies</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <!-- Placeholder for similar movies -->
          <div
            v-for="i in 6"
            :key="i"
            class="group cursor-pointer transition-transform hover:scale-105"
          >
            <div class="relative">
              <div
                class="w-full h-64 bg-gray-800 rounded flex items-center justify-center"
              >
                <span class="text-gray-400">Coming Soon</span>
              </div>
              <div
                class="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors rounded"
              ></div>
            </div>
            <div class="mt-2">
              <h4 class="font-semibold text-sm truncate text-gray-400">
                Similar Movie {{ i }}
              </h4>
              <div class="flex items-center space-x-2 text-xs text-gray-500">
                <span>2024</span>
                <span>•</span>
                <span>⭐ N/A</span>
              </div>
            </div>
          </div>
        </div>

        <!-- TODO: Implement similar movies functionality -->
        <div class="mt-4 text-center text-gray-400">
          <p>Similar movies feature will be implemented soon</p>
        </div>
      </section>
    </div>

    <!-- Error State -->
    <div v-else class="flex items-center justify-center h-screen">
      <div class="text-center">
        <div class="text-2xl mb-4">Movie not found</div>
        <NuxtLink to="/" class="text-red-500 hover:text-red-400">
          Go back to home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const movie = ref(null);
const loading = ref(true);

// Load movie data
const loadMovie = async () => {
  try {
    loading.value = true;
    const movieId = route.params.id;
    const data = await $fetch(`/api/movies/${movieId}`);
    movie.value = data;
  } catch (error) {
    console.error("Error loading movie:", error);
    movie.value = null;
  } finally {
    loading.value = false;
  }
};

// Load movie when component mounts
onMounted(() => {
  loadMovie();
});

// Watch for route changes
watch(
  () => route.params.id,
  () => {
    loadMovie();
  }
);
</script>

<style scoped>
/* Custom styles for movie page */
</style>

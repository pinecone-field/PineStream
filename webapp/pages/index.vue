<template>
  <div class="min-h-screen bg-black text-white">
    <!-- Header -->
    <header
      class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent"
    >
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-red-600">PineStream</h1>

          <!-- Search Bar -->
          <div class="relative">
            <input
              v-model="searchQuery"
              @input="handleSearch"
              type="text"
              placeholder="Search movies..."
              class="bg-black/50 border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
            />
            <div
              v-if="searchResults.length > 0"
              class="absolute top-full left-0 right-0 bg-black/95 border border-gray-600 rounded mt-1 max-h-96 overflow-y-auto"
            >
              <div
                v-for="movie in searchResults"
                :key="movie.id"
                @click="goToMovie(movie.id)"
                class="p-3 hover:bg-gray-800 cursor-pointer flex items-center space-x-3"
              >
                <img
                  v-if="movie.poster_url"
                  :src="movie.poster_url"
                  :alt="movie.title"
                  class="w-12 h-18 object-cover rounded"
                />
                <div>
                  <div class="font-semibold">{{ movie.title }}</div>
                  <div class="text-sm text-gray-400">
                    {{ movie.release_date }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section v-if="featuredMovie" class="relative h-screen">
      <img
        :src="featuredMovie.poster_url"
        :alt="featuredMovie.title"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div
        class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"
      ></div>
      <div class="absolute bottom-0 left-0 right-0 p-8">
        <div class="container mx-auto">
          <h2 class="text-5xl font-bold mb-4">{{ featuredMovie.title }}</h2>
          <p class="text-lg text-gray-300 mb-6 max-w-2xl">
            {{ featuredMovie.overview }}
          </p>
          <div class="flex space-x-4">
            <button
              class="bg-white text-black px-8 py-3 rounded font-semibold hover:bg-gray-200"
            >
              Play
            </button>
            <button
              class="bg-gray-600/80 text-white px-8 py-3 rounded font-semibold hover:bg-gray-600"
            >
              More Info
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Movies Grid -->
    <section class="container mx-auto px-4 py-8">
      <h3 class="text-2xl font-bold mb-6">Popular Movies</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div
          v-for="movie in movies"
          :key="movie.id"
          @click="goToMovie(movie.id)"
          class="group cursor-pointer transition-transform hover:scale-105"
        >
          <div class="relative">
            <img
              v-if="movie.poster_url"
              :src="movie.poster_url"
              :alt="movie.title"
              class="w-full h-64 object-cover rounded"
            />
            <div
              v-else
              class="w-full h-64 bg-gray-800 rounded flex items-center justify-center"
            >
              <span class="text-gray-400">No Image</span>
            </div>
            <div
              class="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors rounded"
            ></div>
          </div>
          <div class="mt-2">
            <h4 class="font-semibold text-sm truncate">{{ movie.title }}</h4>
            <div class="flex items-center space-x-2 text-xs text-gray-400">
              <span>{{ movie.release_date }}</span>
              <span>•</span>
              <span>⭐ {{ movie.vote_average?.toFixed(1) || "N/A" }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination.totalPages > 1"
        class="flex justify-center mt-8 space-x-2"
      >
        <button
          @click="loadPage(pagination.page - 1)"
          :disabled="pagination.page <= 1"
          class="px-4 py-2 bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span class="px-4 py-2"
          >{{ pagination.page }} of {{ pagination.totalPages }}</span
        >
        <button
          @click="loadPage(pagination.page + 1)"
          :disabled="pagination.page >= pagination.totalPages"
          class="px-4 py-2 bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
const movies = ref([]);
const featuredMovie = ref(null);
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
});
const searchQuery = ref("");
const searchResults = ref([]);

// Load movies
const loadMovies = async (page = 1) => {
  try {
    const response = await $fetch(`/api/movies?page=${page}&limit=20`);
    movies.value = response.movies;
    pagination.value = response.pagination;

    // Set featured movie as the first one
    if (movies.value.length > 0) {
      featuredMovie.value = movies.value[0];
    }
  } catch (error) {
    console.error("Error loading movies:", error);
  }
};

// Load specific page
const loadPage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    loadMovies(page);
  }
};

// Search functionality (placeholder)
const handleSearch = () => {
  // TODO: Implement search
  searchResults.value = [];
};

// Navigate to movie page
const goToMovie = (id) => {
  navigateTo(`/movie/${id}`);
};

// Load initial data
onMounted(() => {
  loadMovies();
});
</script>

<style scoped>
/* Custom scrollbar for search results */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #1f1f1f;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #666;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #888;
}
</style>

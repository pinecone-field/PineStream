<template>
  <div class="bg-black text-white">
    <!-- Header -->
    <Header :show-search="true" :show-back-button="false" />

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
              @click="playMovie"
              class="bg-white text-black px-8 py-3 rounded font-semibold hover:bg-gray-200"
            >
              Play
            </button>
            <button
              @click="goToMovie(featuredMovie.id)"
              class="bg-gray-600/80 text-white px-8 py-3 rounded font-semibold hover:bg-gray-600"
            >
              More Info
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Recommendations Section -->
    <section class="container mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-2xl font-bold">Recommended for You</h3>
        <div class="text-sm text-gray-400">
          Based on {{ watchedCount }} watched movies
        </div>
      </div>

      <!-- Skeleton loading for recommendations -->
      <div
        v-if="loadingRecommendations"
        class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        <MovieCardSkeleton v-for="i in 6" :key="i" />
      </div>

      <!-- Recommendations content -->
      <div
        v-else-if="recommendations.length > 0"
        class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        <MovieCard
          v-for="movie in recommendations"
          :key="movie.id"
          :movie="movie"
          @click="goToMovie"
        />
      </div>
      <!-- No Recommendations State -->
      <div v-else class="text-center text-gray-400 py-8">
        <p>No recommendations found</p>
      </div>
    </section>

    <!-- Movies Grid -->
    <section class="container mx-auto px-4 py-8 pb-4">
      <h3 class="text-2xl font-bold mb-6">All Movies</h3>

      <!-- Skeleton loading for movies -->
      <div
        v-if="loadingMovies"
        class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        <MovieCardSkeleton v-for="i in 12" :key="i" />
      </div>

      <!-- Movies content -->
      <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <MovieCard
          v-for="movie in movies"
          :key="movie.id"
          :movie="movie"
          @click="goToMovie"
        />
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

    <!-- Video Player -->
    <VideoPlayer :show="showVideoPlayer" @close="closeVideoPlayer" />
  </div>
</template>

<script setup>
const movies = ref([]);
const featuredMovie = ref(null);
const recommendations = ref([]);
const watchedCount = ref(0);
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
});
const showVideoPlayer = ref(false);
const loadingMovies = ref(false);
const loadingRecommendations = ref(false);

// Load movies
const loadMovies = async (page = 1) => {
  loadingMovies.value = true;
  try {
    const response = await $fetch(`/api/movies?page=${page}&limit=20`);
    movies.value = response.movies;
    pagination.value = response.pagination;

    // Set featured movie as the first one
    if (movies.value.length > 0) {
      featuredMovie.value = movies.value[Math.floor(Math.random() * 10)];
    }
  } catch (error) {
    console.error("Error loading movies:", error);
  } finally {
    loadingMovies.value = false;
  }
};

// Load recommendations
const loadRecommendations = async () => {
  loadingRecommendations.value = true;
  try {
    const response = await $fetch("/api/user/recommendations");
    recommendations.value = response.recommendations;
    watchedCount.value = response.watchedCount;
  } catch (error) {
    console.error("Error loading recommendations:", error);
  } finally {
    loadingRecommendations.value = false;
  }
};

// Load specific page
const loadPage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    loadMovies(page);
  }
};

// Navigate to movie page
const goToMovie = (id) => {
  navigateTo(`/movie/${id}`);
};

// Play movie function
const playMovie = () => {
  showVideoPlayer.value = true;
};

// Close video player
const closeVideoPlayer = () => {
  showVideoPlayer.value = false;
};

// Load initial data
onMounted(() => {
  loadMovies();
  loadRecommendations();
});
</script>

<style scoped>
/* Styles are now handled by the Header component */
</style>

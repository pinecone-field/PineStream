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
                  @click="playMovie"
                  class="bg-white text-black px-8 py-3 rounded font-semibold hover:bg-gray-200 flex items-center"
                >
                  <span class="mr-2">▶</span>
                  Play
                </button>
                <button
                  @click="toggleWatched"
                  :class="
                    isWatched
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-600/80 hover:bg-gray-600'
                  "
                  class="text-white px-8 py-3 rounded font-semibold flex items-center"
                >
                  <span class="mr-2">{{ isWatched ? "✓" : "👁" }}</span>
                  {{ isWatched ? "Watched" : "Mark as Watched" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Similar Movies Section -->
      <section class="container mx-auto px-4 py-8 pb-4">
        <h2 class="text-2xl font-bold mb-6">Similar Movies</h2>

        <!-- Loading State for Similar Movies -->
        <div
          v-if="similarMoviesLoading"
          class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          <MovieCardSkeleton v-for="i in 6" :key="i" />
        </div>

        <!-- Similar Movies Grid -->
        <div
          v-else-if="similarMovies && similarMovies.length > 0"
          class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          <NuxtLink
            v-for="similarMovie in similarMovies"
            :key="similarMovie.id"
            :to="`/movie/${similarMovie.id}`"
            class="group cursor-pointer transition-transform hover:scale-105"
          >
            <div class="relative">
              <img
                v-if="similarMovie.poster_url"
                :src="similarMovie.poster_url"
                :alt="similarMovie.title"
                class="w-full h-64 object-cover rounded"
              />
              <div
                v-else
                class="w-full h-64 bg-gray-800 rounded flex items-center justify-center"
              >
                <span class="text-gray-400 text-sm">No Poster</span>
              </div>
              <div
                class="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors rounded"
              ></div>
            </div>
            <div class="mt-2">
              <h4 class="font-semibold text-sm truncate text-white">
                {{ similarMovie.title }}
              </h4>
              <div class="flex items-center space-x-2 text-xs text-gray-500">
                <span>{{
                  similarMovie.release_date?.split("-")[0] || "N/A"
                }}</span>
                <span>•</span>
                <span
                  >⭐ {{ similarMovie.vote_average?.toFixed(1) || "N/A" }}</span
                >
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- No Similar Movies State -->
        <div v-else class="text-center text-gray-400 py-8">
          <p>No similar movies found</p>
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

    <!-- Video Player -->
    <VideoPlayer :show="showVideoPlayer" @close="closeVideoPlayer" />
  </div>
</template>

<script setup>
const route = useRoute();
const movie = ref(null);
const loading = ref(true);
const similarMovies = ref(null);
const similarMoviesLoading = ref(false);
const isWatched = ref(false);
const showVideoPlayer = ref(false);

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

// Load similar movies data
const loadSimilarMovies = async () => {
  try {
    similarMoviesLoading.value = true;
    const movieId = route.params.id;
    const data = await $fetch(`/api/movies/${movieId}/similar`);
    similarMovies.value = data.similarMovies;
  } catch (error) {
    console.error("Error loading similar movies:", error);
    similarMovies.value = [];
  } finally {
    similarMoviesLoading.value = false;
  }
};

// Check if movie is watched
const checkWatchedStatus = async () => {
  try {
    const response = await $fetch("/api/user/watched");
    const watchedMovies = response.watchedMovies;
    isWatched.value = watchedMovies.some(
      (watched) => watched.id === parseInt(route.params.id)
    );
  } catch (error) {
    console.error("Error checking watched status:", error);
  }
};

// Toggle watched status
const toggleWatched = async () => {
  try {
    if (isWatched.value) {
      // Remove from watched
      await $fetch("/api/user/watched", {
        method: "DELETE",
        body: { movieId: parseInt(route.params.id) },
      });
    } else {
      // Add to watched
      await $fetch("/api/user/watched", {
        method: "POST",
        body: { movieId: parseInt(route.params.id) },
      });
    }
    isWatched.value = !isWatched.value;
  } catch (error) {
    console.error("Error toggling watched status:", error);
  }
};

// Play movie function
const playMovie = () => {
  showVideoPlayer.value = true;
  // Mark as watched when playing
  if (!isWatched.value) {
    toggleWatched();
  }
};

// Close video player
const closeVideoPlayer = () => {
  showVideoPlayer.value = false;
};

// Load movie and similar movies when component mounts
onMounted(() => {
  loadMovie();
  loadSimilarMovies();
  checkWatchedStatus();
});

// Watch for route changes
watch(
  () => route.params.id,
  () => {
    loadMovie();
    loadSimilarMovies();
    checkWatchedStatus();
  }
);
</script>

<style scoped>
/* Custom styles for movie page */
</style>

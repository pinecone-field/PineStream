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
      <!-- Split Screen Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-8rem)]">
        <!-- Left: Hero Image -->
        <div class="relative overflow-hidden h-[calc(100vh-8rem)]">
          <img
            v-if="movie.poster_url"
            :src="movie.poster_url"
            :alt="movie.title"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            class="w-full h-full bg-gradient-to-br from-gray-900 to-black"
          ></div>
          <div
            class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"
          ></div>

          <div class="absolute bottom-0 left-0 right-0 p-6">
            <div class="max-w-2xl">
              <h1 class="text-3xl font-bold mb-3 text-white">
                {{ movie.title }}
              </h1>

              <!-- Movie Meta -->
              <div class="flex items-center space-x-4 mb-3 text-xs">
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
              <div v-if="movie.genre" class="mb-3">
                <span class="text-gray-300 text-sm">{{ movie.genre }}</span>
              </div>

              <!-- Overview -->
              <p
                v-if="movie.overview"
                class="text-sm text-gray-300 mb-4 max-w-xl line-clamp-2"
              >
                {{ movie.overview }}
              </p>

              <!-- Action Buttons -->
              <div class="flex space-x-3">
                <button
                  @click="playMovie"
                  class="bg-white text-black px-6 py-2 rounded font-semibold hover:bg-gray-200 flex items-center text-sm"
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
                  class="text-white px-6 py-2 rounded font-semibold flex items-center text-sm"
                >
                  <span class="mr-2">{{ isWatched ? "✓" : "👁" }}</span>
                  {{ isWatched ? "Watched" : "Mark as Watched" }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Content Column -->
        <div
          class="relative flex flex-col overflow-hidden h-[calc(100vh-8rem)]"
        >
          <!-- <div class="flex flex-col h-full"> -->
          <!-- Plot Section - Fixed Height -->
          <div
            v-if="movie.plot"
            class="h-48 bg-gray-900/50 border-l border-gray-700 flex flex-col flex-shrink-0"
          >
            <div class="p-6 pb-4 flex items-center justify-between">
              <h2 class="text-xl font-bold text-white">Plot</h2>
              <button
                @click="showPlotPopup = true"
                class="text-blue-400 hover:text-blue-300 font-medium transition-colors text-sm flex items-center"
              >
                <span class="mr-1">📖</span>
                View Full Plot
              </button>
            </div>
            <div class="flex-1 px-6 pb-6 overflow-y-auto">
              <p class="text-gray-300 leading-relaxed text-sm line-clamp-3">
                {{ movie.plot }}
              </p>
            </div>
          </div>

          <!-- Similar Movies Section - Remaining Height After Plot -->
          <div
            class="flex-1 bg-gray-900/90 border-l border-gray-700 flex flex-col overflow-hidden min-h-0"
          >
            <div class="p-6 pb-4">
              <h2 class="text-xl font-bold mb-4 text-white">Similar Movies</h2>
            </div>
            <div class="h-full px-6 pb-6 overflow-y-auto">
              <!-- Loading State for Similar Movies -->
              <div v-if="similarMoviesLoading" class="grid grid-cols-1 gap-4">
                <div v-for="i in 4" :key="i" class="animate-pulse">
                  <div class="flex space-x-3 p-3 bg-gray-800/50 rounded-lg">
                    <div
                      class="w-16 h-20 bg-gray-700 rounded flex-shrink-0"
                    ></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-4 bg-gray-700 rounded w-3/4"></div>
                      <div class="h-3 bg-gray-700 rounded w-1/2"></div>
                      <div class="h-3 bg-gray-700 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Similar Movies List -->
              <div
                v-else-if="similarMovies && similarMovies.length > 0"
                class="space-y-3"
              >
                <NuxtLink
                  v-for="similarMovie in similarMovies"
                  :key="similarMovie.id"
                  :to="`/movie/${similarMovie.id}`"
                  class="group block p-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-lg transition-all duration-200"
                >
                  <div class="flex space-x-3">
                    <!-- Movie Poster -->
                    <div class="flex-shrink-0">
                      <img
                        v-if="similarMovie.poster_url"
                        :src="similarMovie.poster_url"
                        :alt="similarMovie.title"
                        class="w-16 h-20 object-cover rounded-md"
                      />
                      <div
                        v-else
                        class="w-16 h-20 bg-gray-700 rounded-md flex items-center justify-center"
                      >
                        <span class="text-gray-500 text-xs">No Image</span>
                      </div>
                    </div>

                    <!-- Movie Info -->
                    <div class="flex-1 min-w-0">
                      <!-- Title and Year -->
                      <h3
                        class="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1 text-sm"
                      >
                        {{ similarMovie.title }}
                        <span class="text-gray-400 font-normal">
                          ({{
                            similarMovie.release_date?.split("-")[0] || "N/A"
                          }})
                        </span>
                      </h3>

                      <!-- Rating and Genre -->
                      <div
                        class="flex items-center space-x-3 text-xs text-gray-400 mb-2"
                      >
                        <span class="flex items-center">
                          ⭐
                          {{ similarMovie.vote_average?.toFixed(1) || "N/A" }}
                        </span>
                        <span v-if="similarMovie.genre" class="truncate">
                          {{ similarMovie.genre }}
                        </span>
                      </div>

                      <!-- Similarity Description -->
                      <p
                        v-if="similarMovie.similarityDescription"
                        class="text-xs text-gray-300 leading-relaxed line-clamp-2"
                      >
                        {{ similarMovie.similarityDescription }}
                      </p>
                      <p v-else class="text-xs text-gray-500 italic">
                        Similar to {{ movie.title }} in genre and style.
                      </p>
                    </div>
                  </div>
                </NuxtLink>
              </div>

              <!-- No Similar Movies State -->
              <div v-else class="text-center text-gray-400 py-4">
                <p class="text-sm">No similar movies found</p>
              </div>
            </div>
          </div>
        </div>
      </div>
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

    <!-- Plot Popup Modal -->
    <div
      v-if="showPlotPopup"
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      @click="showPlotPopup = false"
    >
      <div
        class="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        @click.stop
      >
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-white">Plot</h2>
            <button
              @click="showPlotPopup = false"
              class="text-gray-400 hover:text-white transition-colors"
            >
              <span class="text-2xl">×</span>
            </button>
          </div>
          <p class="text-gray-300 leading-relaxed text-lg">
            {{ movie.plot }}
          </p>
        </div>
      </div>
    </div>
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
const showPlotPopup = ref(false);

// Load movie data
const loadMovie = async () => {
  try {
    loading.value = true;
    const movieId = route.params.id;
    const data = await $fetch(`/api/movies/${movieId}`);
    movie.value = data;
    // Check watched status after movie is loaded
    checkWatchedStatus();
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

// Check if movie is watched - now using the isWatched property from movie data
const checkWatchedStatus = () => {
  if (movie.value) {
    isWatched.value = movie.value.isWatched || false;
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

// Toggle plot expansion
const togglePlot = () => {
  isPlotExpanded.value = !isPlotExpanded.value;
};

// Load movie and similar movies when component mounts
onMounted(() => {
  loadMovie();
  loadSimilarMovies();
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

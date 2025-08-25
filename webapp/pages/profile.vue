<template>
  <div class="bg-black text-white min-h-screen">
    <!-- Header -->
    <Header :show-search="true" :show-back-button="true" />

    <!-- Profile Section -->
    <section class="container mx-auto px-4 py-8 pt-24">
      <div class="max-w-4xl mx-auto">
        <!-- Profile Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold mb-2">My Profile</h1>
          <p class="text-gray-400">Manage your watched movies</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div class="bg-gray-900 p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-2">Watched Movies</h3>
            <p class="text-3xl font-bold text-blue-400">
              {{ watchedMovies.length }}
            </p>
          </div>
          <div class="bg-gray-900 p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-2">Average Rating</h3>
            <p class="text-3xl font-bold text-green-400">
              {{ averageRating.toFixed(1) }}
            </p>
          </div>
          <div class="bg-gray-900 p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-2">Favorite Genre</h3>
            <p class="text-3xl font-bold text-purple-400">
              {{ favoriteGenre || "N/A" }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-4 mb-8">
          <button
            @click="showAddMovieModal = true"
            class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Add Movie to Watched
          </button>
          <button
            @click="showRandomMoviesModal = true"
            class="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Add Random Movies
          </button>
          <button
            @click="clearAllWatched"
            class="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Clear All Watched
          </button>
        </div>

        <!-- Watched Movies Grid -->
        <div v-if="watchedMovies.length > 0">
          <h2 class="text-2xl font-bold mb-6">Watched Movies</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div
              v-for="movie in watchedMovies"
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
                <!-- Remove button -->
                <button
                  @click.stop="removeFromWatched(movie.id)"
                  class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from watched"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>
              <div class="mt-2">
                <h4 class="font-semibold text-sm truncate">
                  {{ movie.title }}
                </h4>
                <div class="flex items-center space-x-2 text-xs text-gray-400">
                  <span>{{ movie.release_date }}</span>
                  <span>•</span>
                  <span>⭐ {{ movie.vote_average?.toFixed(1) || "N/A" }}</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  Watched: {{ formatDate(movie.watched_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg
              class="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2"
              ></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">No watched movies yet</h3>
          <p class="text-gray-400 mb-4">
            Start building your movie collection by marking movies as watched.
          </p>
          <button
            @click="showAddMovieModal = true"
            class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Add Your First Movie
          </button>
        </div>
      </div>
    </section>

    <!-- Random Movies Modal -->
    <div
      v-if="showRandomMoviesModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="showRandomMoviesModal = false"
    >
      <div class="bg-gray-900 p-6 rounded-lg max-w-2xl w-full mx-4" @click.stop>
        <h3 class="text-xl font-bold mb-4">Add Random Movies</h3>

        <div class="mb-6">
          <label class="block text-sm font-medium mb-2"
            >Number of movies to add (1-500)</label
          >
          <input
            v-model="randomMovieCount"
            type="number"
            min="1"
            max="500"
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div v-if="randomMovies.length > 0" class="mb-6">
          <h4 class="text-lg font-semibold mb-3">Selected Movies:</h4>
          <div class="max-h-64 overflow-y-auto space-y-2">
            <div
              v-for="movie in randomMovies"
              :key="movie.id"
              class="flex items-center justify-between p-2 bg-gray-800 rounded"
            >
              <div class="flex items-center space-x-3">
                <img
                  v-if="movie.poster_url"
                  :src="movie.poster_url"
                  :alt="movie.title"
                  class="w-8 h-12 object-cover rounded"
                />
                <div
                  v-else
                  class="w-8 h-12 bg-gray-700 rounded flex items-center justify-center"
                >
                  <span class="text-gray-400 text-xs">No Image</span>
                </div>
                <div>
                  <h5 class="font-semibold text-sm">{{ movie.title }}</h5>
                  <p class="text-xs text-gray-400">{{ movie.release_date }}</p>
                </div>
              </div>
              <button
                @click="removeFromRandomSelection(movie.id)"
                class="text-red-400 hover:text-red-300"
                title="Remove from selection"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <div class="flex space-x-3">
            <button
              @click="generateRandomMovies"
              class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold transition-colors"
            >
              Generate Random Movies
            </button>
            <button
              v-if="randomMovies.length > 0"
              @click="addRandomMoviesToWatched"
              class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold transition-colors"
            >
              Add {{ randomMovies.length }} to Watched
            </button>
          </div>
          <button
            @click="showRandomMoviesModal = false"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Add Movie Modal -->
    <div
      v-if="showAddMovieModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="showAddMovieModal = false"
    >
      <div class="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4" @click.stop>
        <h3 class="text-xl font-bold mb-4">Add Movie to Watched</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Search Movies</label>
          <input
            v-model="searchQuery"
            @input="searchMovies"
            type="text"
            placeholder="Search for a movie..."
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <!-- Search Results -->
        <div v-if="searchResults.length > 0" class="max-h-64 overflow-y-auto">
          <div
            v-for="movie in searchResults"
            :key="movie.id"
            @click="addToWatched(movie.id)"
            class="flex items-center space-x-3 p-2 hover:bg-gray-800 rounded cursor-pointer"
          >
            <img
              v-if="movie.poster_url"
              :src="movie.poster_url"
              :alt="movie.title"
              class="w-12 h-16 object-cover rounded"
            />
            <div
              v-else
              class="w-12 h-16 bg-gray-800 rounded flex items-center justify-center"
            >
              <span class="text-gray-400 text-xs">No Image</span>
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-sm">{{ movie.title }}</h4>
              <p class="text-xs text-gray-400">{{ movie.release_date }}</p>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-4">
          <button
            @click="showAddMovieModal = false"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const watchedMovies = ref([]);
const showAddMovieModal = ref(false);
const showRandomMoviesModal = ref(false);
const searchQuery = ref("");
const searchResults = ref([]);
const randomMovieCount = ref(10);
const randomMovies = ref([]);

// Computed properties
const averageRating = computed(() => {
  if (watchedMovies.value.length === 0) return 0;
  const total = watchedMovies.value.reduce(
    (sum, movie) => sum + (movie.vote_average || 0),
    0
  );
  return total / watchedMovies.value.length;
});

const favoriteGenre = computed(() => {
  if (watchedMovies.value.length === 0) return null;
  const genres = watchedMovies.value
    .map((movie) => movie.genre)
    .filter(Boolean);
  const genreCount = {};
  genres.forEach((genre) => {
    genreCount[genre] = (genreCount[genre] || 0) + 1;
  });
  const maxGenre = Object.entries(genreCount).reduce((a, b) =>
    a[1] > b[1] ? a : b
  );
  return maxGenre[0];
});

// Load watched movies
const loadWatchedMovies = async () => {
  try {
    const response = await $fetch("/api/user/watched");
    watchedMovies.value = response.watchedMovies;
  } catch (error) {
    console.error("Error loading watched movies:", error);
  }
};

// Add movie to watched list
const addToWatched = async (movieId) => {
  try {
    await $fetch("/api/user/watched", {
      method: "POST",
      body: { movieId },
    });
    await loadWatchedMovies();
    showAddMovieModal.value = false;
    searchQuery.value = "";
    searchResults.value = [];
  } catch (error) {
    console.error("Error adding movie to watched:", error);
  }
};

// Remove movie from watched list
const removeFromWatched = async (movieId) => {
  try {
    await $fetch("/api/user/watched", {
      method: "DELETE",
      body: { movieId },
    });
    await loadWatchedMovies();
  } catch (error) {
    console.error("Error removing movie from watched:", error);
  }
};

// Clear all watched movies
const clearAllWatched = async () => {
  if (
    !confirm(
      "Are you sure you want to clear all watched movies? This action cannot be undone."
    )
  ) {
    return;
  }

  try {
    await $fetch("/api/user/clear-watched", {
      method: "POST",
    });
    await loadWatchedMovies();
  } catch (error) {
    console.error("Error clearing watched movies:", error);
  }
};

// Search movies
const searchMovies = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }

  try {
    const response = await $fetch(
      `/api/search?q=${encodeURIComponent(searchQuery.value)}`
    );
    searchResults.value = response.movies || [];
  } catch (error) {
    console.error("Error searching movies:", error);
    searchResults.value = [];
  }
};

// Generate random movies
const generateRandomMovies = async () => {
  try {
    const count = Math.max(
      1,
      Math.min(500, parseInt(randomMovieCount.value) || 10)
    );
    const response = await $fetch(`/api/movies/random?count=${count}`);
    randomMovies.value = response.movies;
  } catch (error) {
    console.error("Error generating random movies:", error);
  }
};

// Remove movie from random selection
const removeFromRandomSelection = (movieId) => {
  randomMovies.value = randomMovies.value.filter(
    (movie) => movie.id !== movieId
  );
};

// Add random movies to watched list
const addRandomMoviesToWatched = async () => {
  try {
    // Add each movie to watched list
    for (const movie of randomMovies.value) {
      await $fetch("/api/user/watched", {
        method: "POST",
        body: { movieId: movie.id },
      });
    }

    // Reload watched movies and close modal
    await loadWatchedMovies();
    showRandomMoviesModal.value = false;
    randomMovies.value = [];
    randomMovieCount.value = 10;
  } catch (error) {
    console.error("Error adding random movies to watched:", error);
  }
};

// Navigate to movie page
const goToMovie = (id) => {
  navigateTo(`/movie/${id}`);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Load initial data
onMounted(() => {
  loadWatchedMovies();
});
</script>

<style scoped>
/* Additional styles can be added here if needed */
</style>

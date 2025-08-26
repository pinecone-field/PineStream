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
    <section
      v-if="
        !loadingRecommendations && recommendations && recommendations.length > 0
      "
      class="container mx-auto px-4 py-8"
    >
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-2xl font-bold">Recommended for You</h3>
        <div class="text-sm text-gray-400">
          Based on {{ watchedCount || 0 }} watched movies
        </div>
      </div>

      <!-- Recommendations content with scroll buttons -->
      <div class="relative">
        <!-- Left Arrow -->
        <button
          @click="scrollRecommendations('left')"
          class="absolute -left-12 top-1/2 transform -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          :class="{ 'opacity-50 cursor-not-allowed': !canScrollLeftComputed }"
          :disabled="!canScrollLeftComputed"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
        </button>

        <!-- Right Arrow -->
        <button
          @click="scrollRecommendations('right')"
          class="absolute -right-12 top-1/2 transform -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          :class="{ 'opacity-50 cursor-not-allowed': !canScrollRightComputed }"
          :disabled="!canScrollRightComputed"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            ></path>
          </svg>
        </button>

        <!-- Scrollable content -->
        <div
          ref="recommendationsContainer"
          class="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide"
          style="scroll-behavior: smooth"
        >
          <div
            v-for="movie in recommendations"
            :key="movie.id"
            class="flex-shrink-0 w-64"
          >
            <MovieCard :movie="movie" @click="goToMovie" />
          </div>
        </div>
      </div>
    </section>

    <!-- Recommendations Loading Section -->
    <section
      v-else-if="loadingRecommendations"
      class="container mx-auto px-4 py-8"
    >
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-2xl font-bold">Recommended for You</h3>
        <div class="text-sm text-gray-400">Loading...</div>
      </div>

      <!-- Skeleton loading for recommendations -->
      <div class="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
        <div v-for="i in 6" :key="i" class="flex-shrink-0 w-64">
          <MovieCardSkeleton />
        </div>
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
        v-if="!loadingMovies && pagination.totalPages > 1"
        class="flex justify-center mt-8"
      >
        <div class="flex items-center space-x-2">
          <!-- Previous button -->
          <button
            @click="goToPage(pagination.page - 1)"
            :disabled="pagination.page <= 1"
            class="px-3 py-2 bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
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
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>

          <!-- Page numbers -->
          <div class="flex items-center space-x-1">
            <!-- First page -->
            <button
              v-if="pagination.page > 3"
              @click="goToPage(1)"
              class="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
            >
              1
            </button>

            <!-- Ellipsis -->
            <span v-if="pagination.page > 4" class="px-2 text-gray-400"
              >...</span
            >

            <!-- Previous pages -->
            <button
              v-for="page in getVisiblePages().prev"
              :key="page"
              @click="goToPage(page)"
              class="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
            >
              {{ page }}
            </button>

            <!-- Current page -->
            <button class="px-3 py-2 bg-blue-600 rounded font-semibold">
              {{ pagination.page }}
            </button>

            <!-- Next pages -->
            <button
              v-for="page in getVisiblePages().next"
              :key="page"
              @click="goToPage(page)"
              class="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
            >
              {{ page }}
            </button>

            <!-- Ellipsis -->
            <span
              v-if="pagination.page < pagination.totalPages - 3"
              class="px-2 text-gray-400"
              >...</span
            >

            <!-- Last page -->
            <button
              v-if="pagination.page < pagination.totalPages - 2"
              @click="goToPage(pagination.totalPages)"
              class="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
            >
              {{ pagination.totalPages }}
            </button>
          </div>

          <!-- Next button -->
          <button
            @click="goToPage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.totalPages"
            class="px-3 py-2 bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
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
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- Video Player -->
    <VideoPlayer :show="showVideoPlayer" @close="closeVideoPlayer" />
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
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
const recommendationsContainer = ref(null); // Ref for the scrollable container
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

// Load movies
const loadMovies = async (page = 1) => {
  loadingMovies.value = true;
  try {
    const response = await $fetch(`/api/movies?page=${page}&limit=20`);
    movies.value = response.movies;
    pagination.value = response.pagination;

    // If no movies returned and we're not on page 1, redirect to page 1
    if (movies.value.length === 0 && page > 1) {
      router.push({
        query: {
          ...route.query,
          page: "1",
        },
      });
      return;
    }

    // Set featured movie as the first one
    if (movies.value.length > 0) {
      featuredMovie.value = movies.value[Math.floor(Math.random() * 10)];
    }
  } catch (error) {
    console.error("Error loading movies:", error);
    // On error, redirect to page 1
    if (page > 1) {
      router.push({
        query: {
          ...route.query,
          page: "1",
        },
      });
    }
  } finally {
    loadingMovies.value = false;
  }
};

// Load recommendations
const loadRecommendations = async () => {
  loadingRecommendations.value = true;
  try {
    const response = await $fetch("/api/user/recommendations");

    // Check if this is an API unavailable error
    if (response.error === "API_UNAVAILABLE") {
      // API is not available, set empty recommendations
      recommendations.value = [];
      watchedCount.value = 0;
      return;
    }

    recommendations.value = response.recommendations || [];
    watchedCount.value = response.watchedCount || 0;
  } catch (error) {
    console.error("Error loading recommendations:", error);
    // On error, set empty values
    recommendations.value = [];
    watchedCount.value = 0;
  } finally {
    loadingRecommendations.value = false;
  }
};

// Navigate to specific page with URL update
const goToPage = (page) => {
  if (page >= 1) {
    // Update URL with new page - let the API handle validation
    router.push({
      query: {
        ...route.query,
        page: page.toString(),
      },
    });
  }
};

// Get visible page numbers for pagination
const getVisiblePages = () => {
  const currentPage = pagination.value.page;
  const totalPages = pagination.value.totalPages;
  const prev = [];
  const next = [];

  // Add previous pages (up to 2 before current)
  for (let i = Math.max(2, currentPage - 2); i < currentPage; i++) {
    prev.push(i);
  }

  // Add next pages (up to 2 after current)
  for (
    let i = currentPage + 1;
    i <= Math.min(totalPages - 1, currentPage + 2);
    i++
  ) {
    next.push(i);
  }

  return { prev, next };
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

// Scroll recommendations left or right
const scrollRecommendations = (direction) => {
  if (!recommendationsContainer.value) return;

  const container = recommendationsContainer.value;
  const scrollAmount = 300; // Fixed scroll amount

  if (direction === "left") {
    container.scrollLeft = Math.max(0, container.scrollLeft - scrollAmount);
  } else {
    container.scrollLeft = Math.min(
      container.scrollWidth - container.clientWidth,
      container.scrollLeft + scrollAmount
    );
  }

  // Update scroll states after scrolling
  updateScrollStates();
};

// Update scroll states
const updateScrollStates = () => {
  if (!recommendationsContainer.value) return;

  const container = recommendationsContainer.value;
  canScrollLeft.value = container.scrollLeft > 0;
  canScrollRight.value =
    container.scrollLeft < container.scrollWidth - container.clientWidth - 1;
};

// Watch for scroll events
const setupScrollListener = () => {
  if (recommendationsContainer.value) {
    recommendationsContainer.value.addEventListener(
      "scroll",
      updateScrollStates
    );
  }
};

// Remove debug logging
const canScrollLeftComputed = computed(() => canScrollLeft.value);
const canScrollRightComputed = computed(() => canScrollRight.value);

// Load initial data
onMounted(() => {
  const pageFromUrl = parseInt(route.query.page) || 1;
  loadMovies(pageFromUrl);
  loadRecommendations();
  setupScrollListener(); // Set up scroll listener on mount
});

// Watch for route changes to handle pagination
watch(
  () => route.query.page,
  (newPage) => {
    const page = parseInt(newPage) || 1;
    loadMovies(page);
  }
);

// Watch for recommendations container to set up scroll listener
watch(recommendationsContainer, (newContainer) => {
  if (newContainer) {
    setupScrollListener();
    // Update initial scroll states
    nextTick(() => {
      updateScrollStates();
    });
  }
});
</script>

<style scoped>
/* Styles are now handled by the Header component */
</style>

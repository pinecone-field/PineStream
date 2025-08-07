<template>
  <div class="bg-black text-white min-h-screen">
    <!-- Header -->
    <Header :show-search="true" :show-back-button="true" />

    <!-- Search Results -->
    <section class="container mx-auto px-4 py-8 pt-24">
      <div class="mb-6">
        <h1 class="text-3xl font-bold mb-2">✨ Semantic Search Results</h1>
        <!-- Search Type Indicator -->
        <div class="mb-6">
          <!-- Filter Application Info for Semantic Search -->
          <div
            v-if="
              !loadingSearch &&
              movies.length > 0 &&
              extractedFilters?.hasFilters
            "
            class="mt-2 text-sm text-purple-300"
          >
            <span class="font-medium">💡</span>
            <span
              v-html="
                parseUserMessage(
                  extractedFilters?.userMessage ||
                    'Results are ranked by similarity to your query. Higher percentages indicate better matches.'
                )
              "
            ></span>
          </div>
        </div>
        <p class="text-gray-400" v-if="!loadingSearch">
          The top {{ total }} movies we found for "{{ searchQuery }}"
        </p>
      </div>

      <!-- Skeleton loading for search results -->
      <div
        v-if="loadingSearch"
        class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        <MovieCardSkeleton v-for="i in 12" :key="i" />
      </div>

      <!-- Results Grid -->
      <div
        v-else-if="movies.length > 0"
        class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        <MovieCard
          v-for="movie in movies"
          :key="movie.id"
          :movie="movie"
          @click="goToMovie"
        />
      </div>

      <!-- No Results -->
      <div v-else-if="searchQuery" class="text-center py-12">
        <div class="text-gray-400 text-lg mb-4">
          No movies found for "{{ searchQuery }}"
        </div>
        <p class="text-gray-500">
          Try different keywords or switch to token search for exact matching.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
const route = useRoute();
const movies = ref([]);
const searchQuery = ref("");
const loadingSearch = ref(false);
const total = ref(0);
const extractedFilters = ref(null);

// Format date range for display
const formatDateRange = (dateRange) => {
  if (!dateRange || !dateRange.start || !dateRange.end) return "";

  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);

  // If it's a single year
  if (startDate.getFullYear() === endDate.getFullYear()) {
    return startDate.getFullYear().toString();
  }

  // If it's a decade
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  if (endYear - startYear === 9) {
    return `${startYear}s`;
  }

  // Custom range
  return `${startYear} - ${endYear}`;
};

// Parse user message and convert backticks to styled tags
const parseUserMessage = (message) => {
  if (!message) return "";

  // Split by backticks and create array of text and tags
  const parts = message.split(/(`[^`]+`)/);

  return parts
    .map((part, index) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        // This is a tag - extract the content and style it
        const tagContent = part.slice(1, -1);
        return `<span class="inline-block px-2 py-1 bg-blue-600 text-white text-xs rounded mr-1">${tagContent}</span>`;
      }
      return part;
    })
    .join("");
};

// Load semantic search results
const loadSearchResults = async () => {
  loadingSearch.value = true;
  try {
    const query = route.query.description;
    searchQuery.value = query;

    if (!query) {
      movies.value = [];
      total.value = 0;
      extractedFilters.value = null;
      return;
    }

    const response = await $fetch("/api/search/semantic", {
      method: "POST",
      body: {
        description: query,
        limit: 20,
      },
    });

    movies.value = response.movies || [];
    total.value = response.total || 0;
    extractedFilters.value = response.filters || null;
  } catch (error) {
    console.error("Error loading semantic search results:", error);
    movies.value = [];
    total.value = 0;
    extractedFilters.value = null;
  } finally {
    loadingSearch.value = false;
  }
};

// Navigate to movie page
const goToMovie = (id) => {
  navigateTo(`/movie/${id}`);
};

// Load initial data
onMounted(() => {
  loadSearchResults();
});

// Watch for route changes
watch(
  () => route.query.description,
  () => {
    loadSearchResults();
  }
);
</script>

<template>
  <div class="bg-black text-white min-h-screen">
    <!-- Header -->
    <Header :show-search="true" :show-back-button="true" />

    <!-- Search Results -->
    <div class="container mx-auto px-4 py-8 pt-24">
      <!-- Search Query Display -->
      <div v-if="searchQuery" class="mb-6">
        <h1 class="text-3xl font-bold mb-2">✨ Semantic Search Results</h1>
        <p class="text-gray-400 mb-4" v-if="total > 0">
          The top {{ total }} movies we found for "{{ searchQuery }}"
        </p>

        <!-- Filter Application Info -->
        <div
          v-if="!loading && extractedInsight"
          class="mb-6 p-4 bg-purple-900/20 border border-purple-600/30 rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <div class="text-purple-400 text-xl">💡</div>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-semibold text-purple-400">
                  {{
                    extractedInsight.hasFilters
                      ? "Smart Filters Applied"
                      : "Query Analysis"
                  }}
                </h3>
                <button
                  @click="showFilterDetails = !showFilterDetails"
                  class="text-purple-400 hover:text-purple-300 transition-colors p-1 rounded-full hover:bg-purple-600/20"
                  :title="showFilterDetails ? 'Hide details' : 'Show details'"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      v-if="!showFilterDetails"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p
                class="text-purple-200 mb-3"
                v-html="
                  parseUserMessage(
                    extractedInsight?.userMessage ||
                      'Results are ranked by similarity to your query. Higher percentages indicate better matches.'
                  )
                "
              ></p>

              <!-- Expandable Details Section -->
              <div
                v-show="showFilterDetails"
                class="mt-4 p-3 bg-purple-900/30 border border-purple-600/20 rounded-lg"
              >
                <h4 class="text-sm font-medium text-purple-300 mb-2">
                  LLM Analysis Details:
                </h4>
                <div class="space-y-2 text-xs">
                  <div
                    v-if="
                      extractedInsight.genres &&
                      extractedInsight.genres.length > 0
                    "
                    class="flex items-center space-x-2"
                  >
                    <span class="text-purple-400 font-medium">Genres:</span>
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="genre in extractedInsight.genres"
                        :key="genre"
                        class="px-2 py-1 bg-purple-600/50 text-white rounded text-xs"
                      >
                        {{ genre }}
                      </span>
                    </div>
                  </div>
                  <div
                    v-if="
                      extractedInsight.dateRange?.start ||
                      extractedInsight.dateRange?.end
                    "
                    class="flex items-center space-x-2"
                  >
                    <span class="text-purple-400 font-medium">Date Range:</span>
                    <span class="text-purple-200">
                      {{ extractedInsight.dateRange.start || "No start" }} to
                      {{ extractedInsight.dateRange.end || "No end" }}
                    </span>
                  </div>
                  <div
                    v-if="extractedInsight.denseQuery"
                    class="flex items-center space-x-2"
                  >
                    <span class="text-purple-400 font-medium"
                      >Dense Query:</span
                    >
                    <span class="text-purple-200 font-mono">{{
                      extractedInsight.denseQuery
                    }}</span>
                  </div>
                  <div
                    v-if="extractedInsight.sparseQuery"
                    class="flex items-center space-x-2"
                  >
                    <span class="text-purple-400 font-medium"
                      >Sparse Query:</span
                    >
                    <span class="text-purple-200 font-mono">{{
                      extractedInsight.sparseQuery
                    }}</span>
                  </div>
                  <div
                    v-if="!extractedInsight.hasFilters"
                    class="text-purple-300 italic"
                  >
                    No specific filters were detected from your query.
                  </div>
                </div>

                <!-- Raw JSON Response -->
                <details class="mt-3">
                  <summary
                    class="text-xs text-purple-400 hover:text-purple-300 cursor-pointer font-medium"
                  >
                    Raw LLM Response (JSON)
                  </summary>
                  <pre
                    class="mt-2 p-2 bg-black/50 border border-purple-600/20 rounded text-xs text-purple-200 overflow-x-auto"
                    >{{ JSON.stringify(extractedInsight, null, 2) }}</pre
                  >
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="!loading && searchResults && searchResults.length > 0"
        class="space-y-6"
      >
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MovieCard
            v-for="movie in searchResults"
            :key="movie.id"
            :movie="movie"
            @click="goToMovie"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="space-y-6">
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MovieCardSkeleton v-for="i in 6" :key="i" />
        </div>
      </div>

      <!-- No Results State -->
      <div
        v-else-if="!loading && searchResults && searchResults.length === 0"
        class="text-center py-12"
      >
        <div class="text-gray-400">
          <p class="text-lg mb-2">No movies found matching your search</p>
          <p class="text-sm">
            Try adjusting your search terms or browse movies by genre
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const searchResults = ref([]);
const searchQuery = ref("");
const loading = ref(false);
const total = ref(0);
const extractedInsight = ref(null);
const showFilterDetails = ref(false);

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
        return `<span class="inline-block px-2 py-1 bg-purple-600 text-white text-xs rounded mr-1">${tagContent}</span>`;
      }
      return part;
    })
    .join("");
};

// Load semantic search results
const loadSearchResults = async () => {
  loading.value = true;
  showFilterDetails.value = false; // Reset details panel for new search

  try {
    const query = route.query.description;
    searchQuery.value = query;

    if (!query) {
      searchResults.value = [];
      total.value = 0;
      extractedInsight.value = null;
      return;
    }

    const response = await $fetch("/api/search/semantic", {
      method: "POST",
      body: {
        description: query,
        limit: 20,
      },
    });

    // Check if this is an API unavailable error
    if (response.error === "API_UNAVAILABLE") {
      // API is not available, set empty results
      searchResults.value = [];
      total.value = 0;
      extractedInsight.value = null;
      return;
    }

    searchResults.value = response.movies || [];
    total.value = response.total || 0;
    extractedInsight.value = response.insight || null;
  } catch (error) {
    console.error("Error loading semantic search results:", error);
    searchResults.value = [];
    total.value = 0;
    extractedInsight.value = null;
  } finally {
    loading.value = false;
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

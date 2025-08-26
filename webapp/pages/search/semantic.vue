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
          v-if="!loading && extractedFilters?.hasFilters"
          class="mb-6 p-4 bg-purple-900/20 border border-purple-600/30 rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <div class="text-purple-400 text-xl">💡</div>
            <div>
              <h3 class="text-lg font-semibold text-purple-400 mb-2">
                Smart Filters Applied
              </h3>
              <p
                class="text-purple-200 mb-3"
                v-html="
                  parseUserMessage(
                    extractedFilters?.userMessage ||
                      'Results are ranked by similarity to your query. Higher percentages indicate better matches.'
                  )
                "
              ></p>
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
const extractedFilters = ref(null);

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

  try {
    const query = route.query.description;
    searchQuery.value = query;

    if (!query) {
      searchResults.value = [];
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

    // Check if this is an API unavailable error
    if (response.error === "API_UNAVAILABLE") {
      // API is not available, set empty results
      searchResults.value = [];
      total.value = 0;
      extractedFilters.value = null;
      return;
    }

    searchResults.value = response.movies || [];
    total.value = response.total || 0;
    extractedFilters.value = response.filters || null;
  } catch (error) {
    console.error("Error loading semantic search results:", error);
    searchResults.value = [];
    total.value = 0;
    extractedFilters.value = null;
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

<template>
  <div class="bg-black text-white min-h-screen">
    <!-- Header -->
    <Header :show-search="true" :show-back-button="true" />

    <!-- Search Results -->
    <section class="container mx-auto px-4 py-8 pt-24">
      <div class="mb-6">
        <h1 class="text-3xl font-bold mb-2">
          <span>
            {{ isSemanticSearch ? "✨ Semantic " : "🔍 Token " }}
          </span>
          Search Results
        </h1>
        <!-- Search Type Indicator -->
        <div class="mb-6">
          <!-- Similarity Score Info for Semantic Search -->
          <div
            v-if="isSemanticSearch && movies.length > 0"
            class="mt-2 text-sm text-purple-300"
          >
            <span class="font-medium">💡</span> Results are ranked by similarity
            to your query. Higher percentages indicate better matches.
          </div>
        </div>
        <p class="text-gray-400">
          The top {{ pagination.total }} movies we found for "{{ searchQuery }}"
        </p>
      </div>

      <!-- Results Grid -->
      <div
        v-if="movies.length > 0"
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
          Try different keywords or switch to semantic search for more flexible
          matching.
        </p>
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
const route = useRoute();
const movies = ref([]);
const searchQuery = ref("");
const isSemanticSearch = ref(false);
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
});

// Load search results
const loadSearchResults = async (page = 1) => {
  try {
    const query = route.query.q || route.query.description;
    const searchType = route.query.type || "token";

    searchQuery.value = query;
    isSemanticSearch.value = searchType === "semantic";

    let endpoint = "/api/search";
    let params = { q: query, page, limit: 20 };

    let response;
    if (isSemanticSearch.value) {
      // Use POST for semantic search to handle long queries
      response = await $fetch("/api/search/semantic", {
        method: "POST",
        body: {
          description: query,
          page,
          limit: 20,
        },
      });
    } else {
      // Use GET for token search
      response = await $fetch(endpoint, { params });
    }
    movies.value = response.movies || [];
    pagination.value = response.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };
  } catch (error) {
    console.error("Error loading search results:", error);
  }
};

// Load specific page
const loadPage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    loadSearchResults(page);
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
  () => route.query,
  () => {
    loadSearchResults();
  },
  { immediate: true }
);
</script>

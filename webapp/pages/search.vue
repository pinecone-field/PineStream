<template>
  <div class="bg-black text-white min-h-screen">
    <!-- Header -->
    <Header :show-search="true" :show-back-button="true" />

    <!-- Search Results -->
    <section class="container mx-auto px-4 py-8 pt-24">
      <div class="mb-6">
        <h1 class="text-3xl font-bold mb-2">Search Results</h1>
        <p class="text-gray-400">
          {{ pagination.total }} movies found for "{{ searchQuery }}"
        </p>
      </div>

      <!-- Search Type Indicator -->
      <div class="mb-6">
        <span
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
          :class="
            isExtendedSearch
              ? 'bg-purple-900 text-purple-200'
              : 'bg-blue-900 text-blue-200'
          "
        >
          {{ isExtendedSearch ? "✨ Extended Search" : "🔍 Token Search" }}
        </span>
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
          Try different keywords or switch to extended search for more flexible
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
const isExtendedSearch = ref(false);
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
    isExtendedSearch.value = searchType === "extended";

    let endpoint = "/api/search";
    let params = { q: query, page, limit: 20 };

    if (isExtendedSearch.value) {
      endpoint = "/api/search/extended";
      params = { description: query, page, limit: 20 };
    }

    const response = await $fetch(endpoint, { params });
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

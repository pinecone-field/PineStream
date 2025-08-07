<template>
  <div class="bg-black text-white min-h-screen">
    <!-- Header -->
    <Header :show-search="true" :show-back-button="true" />

    <!-- Search Results -->
    <section class="container mx-auto px-4 py-8 pt-24">
      <div class="mb-6">
        <h1 class="text-3xl font-bold mb-2">
          <span>🔍 Token</span> Search Results
        </h1>
        <p class="text-gray-400">
          The top {{ pagination.total }} movies we found for "{{ searchQuery }}"
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
          Try different keywords or switch to semantic search for more flexible
          matching.
        </p>
      </div>

      <!-- Pagination -->
      <div
        v-if="!loadingSearch && pagination.totalPages > 1"
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
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const movies = ref([]);
const searchQuery = ref("");
const loadingSearch = ref(false);
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
});

// Load token search results
const loadSearchResults = async (page = 1) => {
  loadingSearch.value = true;
  try {
    const query = route.query.q;
    searchQuery.value = query;

    if (!query) {
      movies.value = [];
      pagination.value = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      };
      return;
    }

    const response = await $fetch("/api/search", {
      params: { q: query, page, limit: 20 },
    });

    movies.value = response.movies || [];
    pagination.value = response.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };

    // If no movies returned and we're not on page 1, redirect to page 1
    if (movies.value.length === 0 && page > 1) {
      console.log(
        `No search results found on page ${page}, redirecting to page 1`
      );
      router.push({
        query: {
          ...route.query,
          page: "1",
        },
      });
      return;
    }
  } catch (error) {
    console.error("Error loading token search results:", error);
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
    loadingSearch.value = false;
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

// Load initial data
onMounted(() => {
  const pageFromUrl = parseInt(route.query.page) || 1;
  loadSearchResults(pageFromUrl);
});

// Watch for route changes
watch(
  () => route.query,
  (newQuery) => {
    const page = parseInt(newQuery.page) || 1;
    loadSearchResults(page);
  },
  { immediate: true }
);
</script>

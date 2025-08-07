<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="
      isScrolled
        ? 'bg-black/95 backdrop-blur-sm'
        : 'bg-gradient-to-b from-black/80 to-transparent'
    "
  >
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center space-x-2">
          <img src="/logo.png" alt="PineStream" class="w-8 h-8" />
          <span class="text-2xl font-bold text-red-600">PineStream</span>
        </NuxtLink>

        <!-- Search Bar (only show on home page) -->
        <div
          v-if="showSearch"
          class="relative flex-1 max-w-md mx-4"
          ref="searchContainer"
        >
          <div class="relative">
            <input
              v-model="searchQuery"
              @input="handleSearch"
              @focus="showSearchResults = true"
              @keydown.enter="handleEnterPress"
              type="text"
              placeholder="Search movies..."
              class="w-full bg-black/50 border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
            />
            <button
              @click="openSemanticSearch"
              class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              title="Open semantic search"
            >
              ✨
            </button>
          </div>

          <div
            v-if="showSearchResults && searchResults.length > 0"
            class="absolute top-full left-0 right-0 bg-black/95 border border-gray-600 rounded mt-1 max-h-96 z-50 flex flex-col"
          >
            <div class="overflow-y-auto flex-1">
              <div
                v-for="movie in searchResults"
                :key="movie.id"
                @click="goToMovie(movie.id)"
                class="p-3 hover:bg-gray-800 cursor-pointer flex items-center space-x-3"
              >
                <img
                  v-if="movie.poster_url"
                  :src="movie.poster_url"
                  :alt="movie.title"
                  class="w-12 h-18 object-cover rounded flex-shrink-0"
                />
                <div
                  v-else
                  class="w-12 h-18 bg-gray-700 rounded flex items-center justify-center flex-shrink-0"
                >
                  <span class="text-xs text-gray-400">No Image</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold truncate">{{ movie.title }}</div>
                  <div class="text-sm text-gray-400 truncate">
                    {{ movie.release_date }} • ⭐
                    {{ movie.vote_average?.toFixed(1) || "N/A" }}
                  </div>
                  <div
                    v-if="movie.overview"
                    class="text-xs text-gray-500 line-clamp-2"
                  >
                    {{ movie.overview }}
                  </div>
                </div>
              </div>
            </div>
            <div
              v-if="searchResults.length === 0 && searchQuery"
              class="p-3 text-gray-400 text-center"
            >
              No movies found
            </div>
            <div
              v-if="searchResults.length > 0"
              class="border-t border-gray-600 flex-shrink-0"
            >
              <button
                @click="goToSearchResults"
                class="w-full p-3 text-center text-blue-400 hover:bg-gray-800 cursor-pointer"
              >
                View All Results ({{ searchResults.length }})
              </button>
            </div>
          </div>
        </div>

        <!-- Back button (only show on movie detail page) -->
        <button
          v-if="showBackButton"
          @click="goBack"
          class="text-white hover:text-gray-300"
        >
          ← Back
        </button>

        <!-- Navigation Links -->
        <div class="flex items-center space-x-4">
          <!-- Admin Link -->
          <NuxtLink
            to="/admin"
            class="text-white hover:text-gray-300 flex items-center space-x-2"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              ></path>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
            </svg>
            <span class="hidden sm:inline">Admin</span>
          </NuxtLink>

          <!-- Profile Link -->
          <NuxtLink
            to="/profile"
            class="text-white hover:text-gray-300 flex items-center space-x-2"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              ></path>
            </svg>
            <span class="hidden sm:inline">Profile</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </header>

  <!-- Semantic Search Modal - rendered outside header to avoid positioning issues -->
  <Teleport to="body">
    <SemanticSearchModal
      :is-open="showSemanticSearchModal"
      @close="showSemanticSearchModal = false"
      @search="handleSemanticSearch"
    />
  </Teleport>
</template>

<script setup>
// Props to control header behavior
const props = defineProps({
  showSearch: {
    type: Boolean,
    default: true,
  },
  showBackButton: {
    type: Boolean,
    default: false,
  },
});

// Scroll detection
const isScrolled = ref(false);

// Handle scroll events
const handleScroll = () => {
  isScrolled.value = window.scrollY > 10;
};

// Handle click outside search results
const handleClickOutside = (event) => {
  if (searchContainer.value && !searchContainer.value.contains(event.target)) {
    showSearchResults.value = false;
  }
};

// Add scroll listener on mount
onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  document.addEventListener("click", handleClickOutside);
});

// Remove scroll listener on unmount
onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  document.removeEventListener("click", handleClickOutside);
});

// Search functionality
const searchQuery = ref("");
const searchResults = ref([]);
const showSearchResults = ref(false);
const searchTimeout = ref(null);
const searchContainer = ref(null);
const showSemanticSearchModal = ref(false);

const openSemanticSearch = () => {
  showSemanticSearchModal.value = true;
};

const handleSemanticSearch = (description) => {
  navigateTo({ path: "/search/semantic", query: { description } });
};

const handleSearch = () => {
  // Clear previous timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  // Set new timeout for debounced search
  searchTimeout.value = setTimeout(async () => {
    if (!searchQuery.value.trim()) {
      searchResults.value = [];
      return;
    }

    try {
      const response = await $fetch("/api/search", {
        params: { q: searchQuery.value },
      });
      searchResults.value = response.movies || [];
    } catch (error) {
      console.error("Search error:", error);
      searchResults.value = [];
    }
  }, 300); // 300ms debounce
};

const goToMovie = (id) => {
  navigateTo(`/movie/${id}`);
};

const handleEnterPress = () => {
  if (searchQuery.value.trim()) {
    goToSearchResults();
  }
};

const goToSearchResults = () => {
  if (!searchQuery.value.trim()) return;

  showSearchResults.value = false;
  navigateTo({ path: "/search/token", query: { q: searchQuery.value } });
};

const goBack = () => {
  navigateTo("/");
};
</script>

<style scoped>
/* Custom scrollbar for search results */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #1f1f1f;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #666;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #888;
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

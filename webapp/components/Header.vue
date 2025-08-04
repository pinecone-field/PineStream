<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent"
  >
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center space-x-2">
          <img src="/logo.png" alt="PineStream" class="w-8 h-8" />
          <span class="text-2xl font-bold text-red-600">PineStream</span>
        </NuxtLink>

        <!-- Search Bar (only show on home page) -->
        <div v-if="showSearch" class="relative">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="Search movies..."
            class="bg-black/50 border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
          />
          <div
            v-if="searchResults.length > 0"
            class="absolute top-full left-0 right-0 bg-black/95 border border-gray-600 rounded mt-1 max-h-96 overflow-y-auto"
          >
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
                class="w-12 h-18 object-cover rounded"
              />
              <div>
                <div class="font-semibold">{{ movie.title }}</div>
                <div class="text-sm text-gray-400">
                  {{ movie.release_date }}
                </div>
              </div>
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
      </div>
    </div>
  </header>
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

// Search functionality
const searchQuery = ref("");
const searchResults = ref([]);

const handleSearch = () => {
  // TODO: Implement search
  searchResults.value = [];
};

const goToMovie = (id) => {
  navigateTo(`/movie/${id}`);
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
</style>

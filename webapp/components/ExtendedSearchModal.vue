<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    @click="closeModal"
  >
    <div
      class="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden"
      @click.stop
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 border-b border-gray-700"
      >
        <div>
          <h2 class="text-xl font-bold text-white">Extended Search</h2>
          <p class="text-gray-400 text-sm mt-1">
            Describe what you're looking for in detail
          </p>
        </div>
        <button
          @click="closeModal"
          class="text-gray-400 hover:text-white transition-colors"
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
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div class="mb-4">
          <label
            for="search-description"
            class="block text-sm font-medium text-gray-300 mb-2"
          >
            Describe your search
          </label>
          <textarea
            id="search-description"
            v-model="searchDescription"
            @keydown.enter.exact.prevent="handleSearch"
            placeholder="e.g., I'm looking for movies about space exploration with a romantic subplot, preferably from the 2000s..."
            class="w-full h-32 bg-gray-800 border border-gray-600 rounded px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500 resize-none"
          ></textarea>
        </div>

        <!-- Examples -->
        <div class="mb-6">
          <h3 class="text-sm font-medium text-gray-300 mb-2">Examples:</h3>
          <div class="space-y-2">
            <button
              v-for="example in examples"
              :key="example"
              @click="searchDescription = example"
              class="block w-full text-left text-sm text-gray-400 hover:text-white p-2 rounded hover:bg-gray-800 transition-colors"
            >
              "{{ example }}"
            </button>
          </div>
        </div>

        <!-- Search Button -->
        <div class="flex justify-end space-x-3">
          <button
            @click="closeModal"
            class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleSearch"
            :disabled="!searchDescription.trim()"
            class="px-6 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "search"]);

const searchDescription = ref("");
const previousQuery = ref("");

const examples = [
  "Movies about space exploration with a romantic subplot",
  "Action movies from the 90s with car chases",
  "Comedies about family relationships and coming of age",
  "Sci-fi movies with time travel and mind-bending plots",
  "Dramas about artists or musicians overcoming obstacles",
  "I watched a movie about a guy who gets stuck in a time loop, I think it was from the 90s or early 2000s, and he keeps reliving the same day over and over",
];

const closeModal = () => {
  emit("close");
};

const handleSearch = () => {
  if (searchDescription.value.trim()) {
    previousQuery.value = searchDescription.value.trim();
    emit("search", previousQuery.value);
    closeModal();
  }
};

// Restore previous query when modal opens
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      searchDescription.value = previousQuery.value;
    }
  }
);
</script>

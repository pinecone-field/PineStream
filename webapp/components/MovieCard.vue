<template>
  <div
    class="group cursor-pointer transition-transform hover:scale-105"
    @click="handleClick"
  >
    <div class="relative">
      <img
        v-if="movie.poster_url"
        :src="movie.poster_url"
        :alt="movie.title"
        class="w-full h-64 object-cover rounded"
      />
      <div
        v-else
        class="w-full h-64 bg-gray-800 rounded flex items-center justify-center"
      >
        <span class="text-gray-400">No Image</span>
      </div>
      <div
        class="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors rounded"
      ></div>

      <!-- Watched indicator -->
      <div
        v-if="isWatched"
        class="absolute top-2 left-2 bg-green-600 text-white p-1 rounded-full"
        title="Watched"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          ></path>
        </svg>
      </div>

      <!-- Quick action buttons -->
      <div
        class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <button
          @click.stop="toggleWatched"
          :class="
            isWatched
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-800 hover:bg-gray-700'
          "
          class="text-white p-2 rounded-full"
          :title="isWatched ? 'Remove from watched' : 'Mark as watched'"
        >
          <svg
            v-if="isWatched"
            class="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <svg
            v-else
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            ></path>
          </svg>
        </button>
      </div>
    </div>
    <div class="mt-2">
      <h4 class="font-semibold text-sm truncate">{{ movie.title }}</h4>
      <div class="flex items-center space-x-2 text-xs text-gray-400">
        <span>{{ movie.release_date }}</span>
        <span>•</span>
        <span>⭐ {{ movie.vote_average?.toFixed(1) || "N/A" }}</span>
      </div>
      <div v-if="movie.genre" class="text-xs text-gray-500 truncate">
        {{ movie.genre }}
      </div>
      <!-- Similarity Score for Semantic Search -->
      <div
        v-if="movie.similarityScore !== undefined"
        class="text-xs text-purple-400 mt-1"
      >
        <span class="font-medium">Similarity:</span>
        {{ (movie.similarityScore * 100).toFixed(1) }}%
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  movie: {
    type: Object,
    required: true,
  },
  showWatchedStatus: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["click", "watched-toggle"]);

const isWatched = ref(false);

// Check if movie is watched
const checkWatchedStatus = async () => {
  if (!props.showWatchedStatus) return;

  try {
    const response = await $fetch("/api/user/watched");
    const watchedMovies = response.watchedMovies;
    isWatched.value = watchedMovies.some(
      (watched) => watched.id === props.movie.id
    );
  } catch (error) {
    console.error("Error checking watched status:", error);
  }
};

// Toggle watched status
const toggleWatched = async (event) => {
  event.stopPropagation();

  try {
    if (isWatched.value) {
      // Remove from watched
      await $fetch("/api/user/watched", {
        method: "DELETE",
        body: { movieId: props.movie.id },
      });
    } else {
      // Add to watched
      await $fetch("/api/user/watched", {
        method: "POST",
        body: { movieId: props.movie.id },
      });
    }
    isWatched.value = !isWatched.value;
    emit("watched-toggle", {
      movieId: props.movie.id,
      isWatched: isWatched.value,
    });
  } catch (error) {
    console.error("Error toggling watched status:", error);
  }
};

// Handle card click
const handleClick = () => {
  emit("click", props.movie.id);
};

// Check watched status on mount
onMounted(() => {
  checkWatchedStatus();
});

// Watch for movie changes
watch(
  () => props.movie.id,
  () => {
    checkWatchedStatus();
  }
);
</script>

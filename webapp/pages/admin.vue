<template>
  <div class="admin-page">
    <div class="container mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Admin Panel</h1>
        <NuxtLink
          to="/"
          class="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          <span>Return to Site</span>
        </NuxtLink>
      </div>

      <!-- Skeleton loading for generate buttons -->
      <div
        v-if="loadingGenerateButtons"
        class="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <GenerateButtonSkeleton />
        <GenerateButtonSkeleton />
      </div>

      <!-- Generate buttons content -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Generate Dense Embeddings -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-700">
            Generate Dense Embeddings
          </h2>
          <p class="text-gray-600 mb-4">
            Generate dense embeddings for all movies in the database. This
            process may take some time.
          </p>

          <button
            @click="generateDenseEmbeddings"
            :disabled="isGeneratingDense || !isPineconeAvailable"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            <span v-if="!isGeneratingDense">Generate Dense Embeddings</span>
            <span v-else>Processing...</span>
          </button>

          <!-- Progress Bar for Dense Embeddings -->
          <div
            v-if="
              isPineconeAvailable &&
              denseProgress &&
              denseProgress.isRunning &&
              denseProgress.total > 0
            "
            class="mt-4"
          >
            <div class="flex justify-between text-sm text-gray-600 mb-2">
              <span
                >Progress: {{ denseProgress.processed || 0 }} /
                {{ denseProgress.total || 0 }} movies</span
              >
              <span>
                {{
                  denseProgress.total > 0
                    ? Math.round(
                        (denseProgress.processed / denseProgress.total) * 100
                      )
                    : 0
                }}%
              </span>
            </div>

            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div
                class="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                :style="{
                  width:
                    (denseProgress.total > 0
                      ? Math.round(
                          (denseProgress.processed / denseProgress.total) * 100
                        )
                      : 0) + '%',
                }"
              ></div>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              Estimated time remaining:
              {{ formatTimeRemaining(denseTimeRemaining) }}
            </div>
          </div>
          <div
            v-if="isPineconeAvailable && denseResult"
            class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
          >
            <div class="font-semibold">{{ denseResult }}</div>
            <div v-if="denseCompletedTime" class="mt-2 text-sm">
              <div>Processing time: {{ denseCompletedTime }}</div>
            </div>
          </div>
          <div
            v-if="isPineconeAvailable && denseError"
            class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
          >
            {{ denseError }}
          </div>
        </div>

        <!-- Generate Sparse Embeddings -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-700">
            Generate Sparse Embeddings
          </h2>
          <p class="text-gray-600 mb-4">
            Generate sparse embeddings for all movies in the database. This
            process may take some time.
          </p>

          <button
            @click="generateSparseEmbeddings"
            :disabled="isGeneratingSparse || !isPineconeAvailable"
            class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            <span v-if="!isGeneratingSparse">Generate Sparse Embeddings</span>
            <span v-else>Processing...</span>
          </button>

          <!-- Progress Bar for Sparse Embeddings -->
          <div
            v-if="
              isPineconeAvailable &&
              sparseProgress &&
              sparseProgress.isRunning &&
              sparseProgress.total > 0
            "
            class="mt-4"
          >
            <div class="flex justify-between text-sm text-gray-600 mb-2">
              <span
                >Progress: {{ sparseProgress.processed || 0 }} /
                {{ sparseProgress.total || 0 }} movies</span
              >
              <span>
                {{
                  sparseProgress.total > 0
                    ? Math.round(
                        (sparseProgress.processed / sparseProgress.total) * 100
                      )
                    : 0
                }}%
              </span>
            </div>

            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div
                class="bg-green-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                :style="{
                  width:
                    (sparseProgress.total > 0
                      ? Math.round(
                          (sparseProgress.processed / sparseProgress.total) *
                            100
                        )
                      : 0) + '%',
                }"
              ></div>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              Estimated time remaining:
              {{ formatTimeRemaining(sparseTimeRemaining) }}
            </div>
          </div>
          <div
            v-if="isPineconeAvailable && sparseResult"
            class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
          >
            <div class="font-semibold">{{ sparseResult }}</div>
            <div v-if="sparseCompletedTime" class="mt-2 text-sm">
              <div>Processing time: {{ sparseCompletedTime }}</div>
            </div>
          </div>
          <div
            v-if="isPineconeAvailable && sparseError"
            class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
          >
            {{ sparseError }}
          </div>
        </div>
      </div>

      <!-- Database Stats -->
      <div class="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4 text-gray-700">
          Database Statistics
        </h2>

        <!-- Skeleton loading for stats -->
        <StatsSkeleton v-if="loadingStats" />

        <!-- Stats content -->
        <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">
              {{ (dbStats && dbStats.totalMovies) || 0 }}
            </div>
            <div class="text-sm text-gray-600">Total Movies</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">
              {{ (dbStats && dbStats.watchedMovies) || 0 }}
            </div>
            <div class="text-sm text-gray-600">Watched Movies</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">
              {{
                dbStats && dbStats.denseEmbeddings !== null
                  ? dbStats.denseEmbeddings
                  : "N/A"
              }}
            </div>
            <div class="text-sm text-gray-600">Dense Embeddings</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">
              {{
                dbStats && dbStats.sparseEmbeddings !== null
                  ? dbStats.sparseEmbeddings
                  : "N/A"
              }}
            </div>
            <div class="text-sm text-gray-600">Sparse Embeddings</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

// Default progress state for SSR safety
const defaultProgress = {
  isRunning: false,
  processed: 0,
  total: 0,
  startTime: 0,
};

// Reactive refs for progress state (SSR-safe)
const denseProgress = ref(defaultProgress);
const sparseProgress = ref(defaultProgress);

// Ensure refs are always defined
if (!denseProgress.value) {
  denseProgress.value = defaultProgress;
}
if (!sparseProgress.value) {
  sparseProgress.value = defaultProgress;
}

// No longer need composable functions - using simple polling

// Computed time remaining based on current progress
const denseTimeRemaining = computed(() => {
  return calculateTimeRemaining(denseProgress.value);
});

const sparseTimeRemaining = computed(() => {
  return calculateTimeRemaining(sparseProgress.value);
});

const isGeneratingDense = ref(false);
const isGeneratingSparse = ref(false);
const denseResult = ref("");
const sparseResult = ref("");
const denseError = ref("");
const sparseError = ref("");
const denseCompletedTime = ref("");
const sparseCompletedTime = ref("");
const isPineconeAvailable = ref(false);

// Initialize dbStats with safe defaults for SSR
const dbStats = ref({
  totalMovies: 0,
  watchedMovies: 0,
  denseEmbeddings: 0,
  sparseEmbeddings: 0,
});
const loadingStats = ref(false);
const loadingGenerateButtons = ref(true);

// Utility functions
const formatTimeRemaining = (seconds) => {
  if (!seconds || seconds <= 0) return "Calculating...";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600)
    return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
};

const calculateTimeRemaining = (progressInfo) => {
  if (!progressInfo.isRunning || progressInfo.processed === 0) return 0;

  const elapsed = (Date.now() - progressInfo.startTime) / 1000;

  // Need at least 2 seconds and some progress to calculate meaningful rate
  if (elapsed < 2 || progressInfo.processed === 0) return 0;

  const rate = progressInfo.processed / elapsed;
  const remaining = progressInfo.total - progressInfo.processed;

  return remaining / rate;
};

// Single polling for both progress updates
let progressInterval = null;
let lastSuccessfulPoll = Date.now();
const POLLING_TIMEOUT = 10000; // 10 seconds timeout

const startProgressPolling = () => {
  if (progressInterval) clearInterval(progressInterval);

  // Reset the timeout when starting polling
  lastSuccessfulPoll = Date.now();

  progressInterval = setInterval(async () => {
    // Check if we've exceeded the timeout before making the request
    const timeSinceLastSuccess = Date.now() - lastSuccessfulPoll;
    if (timeSinceLastSuccess > POLLING_TIMEOUT) {
      console.warn(
        `Polling timeout exceeded (${POLLING_TIMEOUT}ms), stopping polling`
      );
      stopProgressPolling();
      return;
    }

    try {
      const response = await $fetch("/api/admin/progress");

      // Update last successful poll time
      lastSuccessfulPoll = Date.now();

      // Handle dense progress - simple direct mapping
      const denseProgressData = response.dense;
      denseProgress.value = {
        isRunning: denseProgressData.isRunning,
        processed: denseProgressData.processed,
        total: denseProgressData.total,
        startTime: denseProgressData.startTime,
      };

      // If dense generation just completed, show result
      if (
        !denseProgressData.isRunning &&
        denseProgressData.message &&
        isGeneratingDense.value
      ) {
        denseResult.value = denseProgressData.message;
        const processingTime = (
          (Date.now() - denseProgressData.startTime) /
          1000
        ).toFixed(1);
        denseCompletedTime.value = `${processingTime}s`;
        isGeneratingDense.value = false;
        await loadDatabaseStats();
      }

      // Handle sparse progress - simple direct mapping
      const sparseProgressData = response.sparse;
      sparseProgress.value = {
        isRunning: sparseProgressData.isRunning,
        processed: sparseProgressData.processed,
        total: sparseProgressData.total,
        startTime: sparseProgressData.startTime,
      };

      // If sparse generation just completed, show result
      if (
        !sparseProgressData.isRunning &&
        sparseProgressData.message &&
        isGeneratingSparse.value
      ) {
        sparseResult.value = sparseProgressData.message;
        const processingTime = (
          (Date.now() - sparseProgressData.startTime) /
          1000
        ).toFixed(1);
        sparseCompletedTime.value = `${processingTime}s`;
        isGeneratingSparse.value = false;
        await loadDatabaseStats();
      }

      // Stop polling if neither is running
      if (!denseProgressData.isRunning && !sparseProgressData.isRunning) {
        stopProgressPolling();
      }
    } catch (error) {
      console.error("Error polling progress:", error);

      // Check if we've exceeded the timeout
      const timeSinceLastSuccess = Date.now() - lastSuccessfulPoll;
      if (timeSinceLastSuccess > POLLING_TIMEOUT) {
        console.warn(
          `Polling timeout exceeded (${POLLING_TIMEOUT}ms), stopping polling`
        );
        stopProgressPolling();
      }

      // On error, assume nothing is running
      denseProgress.value.isRunning = false;
      sparseProgress.value.isRunning = false;
      isGeneratingDense.value = false;
      isGeneratingSparse.value = false;
    }
  }, 1000); // Poll every second
};

const stopProgressPolling = () => {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
};

const generateDenseEmbeddings = async () => {
  isGeneratingDense.value = true;
  denseResult.value = "";
  denseError.value = "";
  denseCompletedTime.value = "";

  try {
    // Start progress polling
    startProgressPolling();

    // Start generation (this will run in background)
    $fetch("/api/admin/generate-dense-embeddings", {
      method: "POST",
    })
      .then((result) => {
        // Final result handling is done by polling
      })
      .catch((error) => {
        console.error("Generation failed:", error);
        denseError.value =
          error.data?.message || "Failed to generate dense embeddings";
        isGeneratingDense.value = false;
      });
  } catch (error) {
    console.error("Error starting generation:", error);
    denseError.value = error.data?.message || "Failed to start generation";
    isGeneratingDense.value = false;
  }
};

// No longer need persistent state initialization - polling handles this

const generateSparseEmbeddings = async () => {
  isGeneratingSparse.value = true;
  sparseResult.value = "";
  sparseError.value = "";
  sparseCompletedTime.value = "";

  try {
    // Start progress polling (handles both dense and sparse)
    startProgressPolling();

    // Start generation (this will run in background)
    $fetch("/api/admin/generate-sparse-embeddings", {
      method: "POST",
    })
      .then((result) => {
        // Final result handling is done by polling
      })
      .catch((error) => {
        console.error("Sparse generation failed:", error);
        sparseError.value =
          error.data?.message || "Failed to generate sparse embeddings";
        isGeneratingSparse.value = false;
      });
  } catch (error) {
    console.error("Error starting sparse generation:", error);
    sparseError.value = error.data?.message || "Failed to start generation";
    isGeneratingSparse.value = false;
  }
};

// Load initial database stats
const loadDatabaseStats = async () => {
  loadingStats.value = true;
  try {
    const response = await $fetch("/api/admin/stats");
    dbStats.value = response;
    isPineconeAvailable.value = response.isPineconeAvailable;
  } catch (error) {
    console.error("Error loading database stats:", error);
    // Fallback to default values if API fails
    dbStats.value = {
      totalMovies: 0,
      watchedMovies: 0,
      denseEmbeddings: null,
      sparseEmbeddings: null,
    };
    isPineconeAvailable.value = false;
  } finally {
    loadingStats.value = false;
  }
};

// Load stats on page mount
onMounted(async () => {
  await loadDatabaseStats();

  // Check if generation is already running on page load
  try {
    const response = await $fetch("/api/admin/progress");

    if (response.dense.isRunning) {
      isGeneratingDense.value = true;
    }

    if (response.sparse.isRunning) {
      isGeneratingSparse.value = true;
    }

    // Start polling if either is running
    if (response.dense.isRunning || response.sparse.isRunning) {
      startProgressPolling();
    }
  } catch (error) {
    console.warn("Could not check initial progress:", error);
  } finally {
    // Hide skeleton loading after checking initial state
    loadingGenerateButtons.value = false;
  }
});

// Cleanup polling on unmount
onUnmounted(() => {
  stopProgressPolling();
});

// Set page title
useHead({
  title: "Admin Panel - PineStream",
});
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background-color: #f8fafc;
}
</style>

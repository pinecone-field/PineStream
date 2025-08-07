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

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            :disabled="isGeneratingDense"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            <span v-if="!isGeneratingDense">Generate Dense Embeddings</span>
            <span v-else>Processing...</span>
          </button>

          <!-- Progress Bar for Dense Embeddings -->
          <div
            v-if="
              denseProgress &&
              denseProgress.isGenerating &&
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
            v-if="denseResult"
            class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
          >
            <div class="font-semibold">{{ denseResult }}</div>
            <div v-if="denseCompletedTime" class="mt-2 text-sm">
              <div>Processing time: {{ denseCompletedTime }}</div>
            </div>
          </div>
          <div
            v-if="denseError"
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
            :disabled="isGeneratingSparse"
            class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            <span v-if="!isGeneratingSparse">Generate Sparse Embeddings</span>
            <span v-else>Processing...</span>
          </button>

          <!-- Progress Bar for Sparse Embeddings -->
          <div
            v-if="
              sparseProgress &&
              sparseProgress.isGenerating &&
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
            v-if="sparseResult"
            class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
          >
            <div class="font-semibold">{{ sparseResult }}</div>
            <div v-if="sparseCompletedTime" class="mt-2 text-sm">
              <div>Processing time: {{ sparseCompletedTime }}</div>
            </div>
          </div>
          <div
            v-if="sparseError"
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
              {{ (dbStats && dbStats.denseEmbeddings) || 0 }}
            </div>
            <div class="text-sm text-gray-600">Dense Embeddings</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">
              {{ (dbStats && dbStats.sparseEmbeddings) || 0 }}
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
  isGenerating: false,
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

// Initialize dbStats with safe defaults for SSR
const dbStats = ref({
  totalMovies: 0,
  watchedMovies: 0,
  denseEmbeddings: 0,
  sparseEmbeddings: 0,
});
const loadingStats = ref(false);

// Utility functions
const formatTimeRemaining = (seconds) => {
  if (!seconds || seconds <= 0) return "Calculating...";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600)
    return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
};

const calculateTimeRemaining = (progressInfo) => {
  if (!progressInfo.isGenerating || progressInfo.processed === 0) return 0;

  const elapsed = (Date.now() - progressInfo.startTime) / 1000;

  // Need at least 2 seconds and some progress to calculate meaningful rate
  if (elapsed < 2 || progressInfo.processed === 0) return 0;

  const rate = progressInfo.processed / elapsed;
  const remaining = progressInfo.total - progressInfo.processed;

  return remaining / rate;
};

// Single polling for both progress updates
let progressInterval = null;

const startProgressPolling = () => {
  if (progressInterval) clearInterval(progressInterval);

  progressInterval = setInterval(async () => {
    try {
      const response = await $fetch("/api/admin/progress");

      // Handle dense progress
      const denseProgressData = response.dense;
      if (denseProgressData.isRunning) {
        // Update dense progress state
        denseProgress.value = {
          isGenerating: true,
          processed: denseProgressData.processed,
          total: denseProgressData.total,
          startTime: denseProgressData.startTime,
        };

        // Debug logging
        console.log("Dense progress update:", {
          processed: denseProgressData.processed,
          total: denseProgressData.total,
          startTime: denseProgressData.startTime,
          elapsed: (Date.now() - denseProgressData.startTime) / 1000,
        });
      } else if (denseProgress.value.isGenerating) {
        // Dense generation completed
        denseProgress.value = {
          isGenerating: false,
          processed: denseProgressData.processed,
          total: denseProgressData.total,
          startTime: denseProgressData.startTime,
        };

        if (denseProgressData.message) {
          denseResult.value = denseProgressData.message;
          // Calculate processing time from startTime
          const processingTime = (
            (Date.now() - denseProgressData.startTime) /
            1000
          ).toFixed(1);
          denseCompletedTime.value = `${processingTime}s`;
        }

        isGeneratingDense.value = false;
        await loadDatabaseStats();
      }

      // Handle sparse progress
      const sparseProgressData = response.sparse;
      if (sparseProgressData.isRunning) {
        // Update sparse progress state
        sparseProgress.value = {
          isGenerating: true,
          processed: sparseProgressData.processed,
          total: sparseProgressData.total,
          startTime: sparseProgressData.startTime,
        };

        // Debug logging
        console.log("Sparse progress update:", {
          processed: sparseProgressData.processed,
          total: sparseProgressData.total,
          startTime: sparseProgressData.startTime,
          elapsed: (Date.now() - sparseProgressData.startTime) / 1000,
        });
      } else if (sparseProgress.value.isGenerating) {
        // Sparse generation completed
        sparseProgress.value = {
          isGenerating: false,
          processed: sparseProgressData.processed,
          total: sparseProgressData.total,
          startTime: sparseProgressData.startTime,
        };

        if (sparseProgressData.message) {
          sparseResult.value = sparseProgressData.message;
          // Calculate processing time from startTime
          const processingTime = (
            (Date.now() - sparseProgressData.startTime) /
            1000
          ).toFixed(1);
          sparseCompletedTime.value = `${processingTime}s`;
        }

        isGeneratingSparse.value = false;
        await loadDatabaseStats();
      }

      // Stop polling if neither is running
      if (
        !denseProgressData.isRunning &&
        !sparseProgressData.isRunning &&
        !denseProgress.value.isGenerating &&
        !sparseProgress.value.isGenerating
      ) {
        stopProgressPolling();
      }
    } catch (error) {
      console.error("Error polling progress:", error);
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
        console.log("Generation completed:", result);
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
        console.log("Sparse generation completed:", result);
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
  } catch (error) {
    console.error("Error loading database stats:", error);
    // Fallback to default values if API fails
    dbStats.value = {
      totalMovies: 0,
      watchedMovies: 0,
      denseEmbeddings: 0,
      sparseEmbeddings: 0,
    };
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

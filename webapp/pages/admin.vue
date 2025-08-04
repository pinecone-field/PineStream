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
            <span
              v-if="isGeneratingDense"
              class="flex items-center justify-center"
            >
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating...
            </span>
            <span v-else>Generate Dense Embeddings</span>
          </button>
          <div
            v-if="denseResult"
            class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
          >
            <div class="font-semibold">{{ denseResult }}</div>
            <div v-if="denseDetails" class="mt-2 text-sm">
              <div>Movies processed: {{ denseDetails.moviesProcessed }}</div>
              <div>
                Embeddings generated: {{ denseDetails.embeddingsGenerated }}
              </div>
              <div v-if="denseDetails.errors > 0" class="text-red-600">
                Errors: {{ denseDetails.errors }}
              </div>
              <div>Processing time: {{ denseDetails.processingTime }}</div>
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
            <span
              v-if="isGeneratingSparse"
              class="flex items-center justify-center"
            >
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating...
            </span>
            <span v-else>Generate Sparse Embeddings</span>
          </button>
          <div
            v-if="sparseResult"
            class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
          >
            <div class="font-semibold">{{ sparseResult }}</div>
            <div v-if="sparseDetails" class="mt-2 text-sm">
              <div>Movies processed: {{ sparseDetails.moviesProcessed }}</div>
              <div>
                Embeddings generated: {{ sparseDetails.embeddingsGenerated }}
              </div>
              <div v-if="sparseDetails.errors > 0" class="text-red-600">
                Errors: {{ sparseDetails.errors }}
              </div>
              <div>Processing time: {{ sparseDetails.processingTime }}</div>
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
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">
              {{ dbStats.totalMovies || 0 }}
            </div>
            <div class="text-sm text-gray-600">Total Movies</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">
              {{ dbStats.watchedMovies || 0 }}
            </div>
            <div class="text-sm text-gray-600">Watched Movies</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">
              {{ dbStats.denseEmbeddings || 0 }}
            </div>
            <div class="text-sm text-gray-600">Dense Embeddings</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">
              {{ dbStats.sparseEmbeddings || 0 }}
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

const isGeneratingDense = ref(false);
const isGeneratingSparse = ref(false);
const denseResult = ref("");
const sparseResult = ref("");
const denseError = ref("");
const sparseError = ref("");
const denseDetails = ref(null);
const sparseDetails = ref(null);
const dbStats = ref({
  totalMovies: 0,
  watchedMovies: 0,
  denseEmbeddings: 0,
  sparseEmbeddings: 0,
});

const generateDenseEmbeddings = async () => {
  isGeneratingDense.value = true;
  denseResult.value = "";
  denseError.value = "";
  denseDetails.value = null;

  try {
    const response = await $fetch("/api/admin/generate-dense-embeddings", {
      method: "POST",
    });
    denseResult.value =
      response.message || "Dense embeddings generated successfully!";
    denseDetails.value = response.details;

    // Refresh database stats to get updated embedding counts
    await loadDatabaseStats();
  } catch (error) {
    console.error("Error generating dense embeddings:", error);
    denseError.value =
      error.data?.message || "Failed to generate dense embeddings";
  } finally {
    isGeneratingDense.value = false;
  }
};

const generateSparseEmbeddings = async () => {
  isGeneratingSparse.value = true;
  sparseResult.value = "";
  sparseError.value = "";
  sparseDetails.value = null;

  try {
    const response = await $fetch("/api/admin/generate-sparse-embeddings", {
      method: "POST",
    });
    sparseResult.value =
      response.message || "Sparse embeddings generated successfully!";
    sparseDetails.value = response.details;

    // Refresh database stats to get updated embedding counts
    await loadDatabaseStats();
  } catch (error) {
    console.error("Error generating sparse embeddings:", error);
    sparseError.value =
      error.data?.message || "Failed to generate sparse embeddings";
  } finally {
    isGeneratingSparse.value = false;
  }
};

// Load initial database stats
const loadDatabaseStats = async () => {
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
  }
};

// Load stats on page mount
onMounted(() => {
  loadDatabaseStats();
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

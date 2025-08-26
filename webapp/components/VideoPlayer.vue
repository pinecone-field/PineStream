<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black z-50 flex items-center justify-center"
    @click="close"
  >
    <div class="relative w-full h-full max-w-6xl max-h-[90vh]">
      <!-- Close button -->
      <button
        @click="close"
        class="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
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

      <!-- Video player -->
      <video
        ref="videoPlayer"
        class="w-full h-full object-contain"
        controls
        preload="metadata"
        playsinline
        webkit-playsinline
        x5-playsinline
        x5-video-player-type="h5"
        x5-video-player-fullscreen="true"
        @click.stop
        @error="handleVideoError"
        @loadeddata="handleVideoLoaded"
        @canplay="handleCanPlay"
        @waiting="handleWaiting"
        @playing="handlePlaying"
        @pause="handlePause"
        @ended="handleEnded"
      >
        <source src="/movie.mov" type="video/quicktime" />
        <source src="/movie.mov" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <!-- Loading state -->
      <div
        v-if="isLoading"
        class="absolute inset-0 bg-black/50 flex items-center justify-center"
      >
        <div class="text-white text-center">
          <div
            class="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"
          ></div>
          <p>Loading video...</p>
        </div>
      </div>

      <!-- Error state -->
      <div
        v-if="videoError"
        class="absolute inset-0 bg-black/80 flex items-center justify-center"
      >
        <div class="text-white text-center max-w-md mx-auto p-6">
          <div class="text-red-400 text-6xl mb-4">⚠️</div>
          <h3 class="text-xl font-semibold mb-2">Video Playback Issue</h3>
          <p class="text-gray-300 mb-4">
            The video cannot be played. This may be due to browser restrictions
            or media format issues.
          </p>
          <div class="space-y-3">
            <button
              @click="retryVideo"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              Try Again
            </button>
            <button
              @click="downloadVideo"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors ml-2"
            >
              Download Video
            </button>
            <button
              v-if="isInIframeRef"
              @click="openInNewTab"
              class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors ml-2"
            >
              Open in New Tab
            </button>
          </div>
          <div
            v-if="isInIframeRef"
            class="mt-4 p-3 bg-gray-800 rounded text-sm"
          >
            <p class="text-gray-300">
              <strong>iFrame Detected:</strong> Video playback in embedded
              environments is often restricted by browsers for security reasons.
            </p>
            <div class="mt-2 text-xs text-gray-400">
              <p><strong>Tips for iFrame video playback:</strong></p>
              <ul class="list-disc list-inside mt-1 space-y-1">
                <li>
                  Ensure you're using a modern browser (Chrome, Firefox, Safari,
                  Edge)
                </li>
                <li>Try refreshing the page and clicking play again</li>
                <li>
                  Check if your browser allows autoplay in embedded content
                </li>
                <li>Use the "Open in New Tab" option for best compatibility</li>
              </ul>
            </div>
          </div>
          <p class="text-xs text-gray-400 mt-4">
            If the issue persists, try opening the app in a new tab or
            refreshing the page.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { isInIframe, getEnvironmentInfo } from "~/utils/iframe-utils";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const videoPlayer = ref(null);
const isLoading = ref(true);
const videoError = ref(false);
const isInIframeRef = ref(false);

// Check if running in iFrame on mount
onMounted(async () => {
  isInIframeRef.value = isInIframe();

  // Log environment info for debugging
  if (isInIframeRef.value) {
    console.log("VideoPlayer: Running in iFrame environment");
    console.log("Environment info:", getEnvironmentInfo());
  }
});

// Auto-play video when player opens
const autoPlayVideo = async () => {
  if (!videoPlayer.value) return;

  try {
    // Wait for the video to be ready
    await nextTick();

    // Try to play the video automatically
    await videoPlayer.value.play();
    console.log("Video auto-played successfully");
  } catch (error) {
    console.log("Auto-play failed, user will need to click play:", error);
    // Don't show error - just let user click play manually
  }
};

// Handle video loading
const handleVideoLoaded = () => {
  console.log("Video data loaded successfully");
  isLoading.value = false;

  // Try to auto-play when video is loaded
  autoPlayVideo();
};

// Handle when video can start playing
const handleCanPlay = () => {
  console.log("Video can start playing");
  isLoading.value = false;

  // Try to auto-play when video is ready
  autoPlayVideo();
};

// Handle when video is waiting for data
const handleWaiting = () => {
  console.log("Video is waiting for data");
  isLoading.value = true;
};

// Handle when video starts playing
const handlePlaying = () => {
  console.log("Video started playing");
  isLoading.value = false;
};

// Handle when video is paused
const handlePause = () => {
  console.log("Video paused");
};

// Handle when video ends
const handleEnded = () => {
  console.log("Video ended");
};

// Handle video errors with more detail
const handleVideoError = (event) => {
  const video = event.target;
  const error = video.error;

  console.error("Video error occurred:", {
    error: error,
    code: error ? error.code : "unknown",
    message: error ? error.message : "unknown error",
    event: event,
  });

  isLoading.value = false;
  videoError.value = true;

  // Log specific error details
  if (error) {
    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        console.error("Video playback was aborted");
        break;
      case MediaError.MEDIA_ERR_NETWORK:
        console.error("Network error occurred while loading video");
        break;
      case MediaError.MEDIA_ERR_DECODE:
        console.error("Video decoding error");
        break;
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        console.error("Video source not supported");
        break;
      default:
        console.error("Unknown video error");
    }
  }
};

// Retry video playback
const retryVideo = () => {
  videoError.value = false;
  isLoading.value = true;

  // Reset video element
  if (videoPlayer.value) {
    videoPlayer.value.load();
  }
};

// Download video as fallback
const downloadVideo = () => {
  const link = document.createElement("a");
  link.href = "/movie.mov";
  link.download = "movie.mov";
  link.click();
};

// Open in new tab (useful for iFrame users)
const openInNewTab = () => {
  window.open(window.location.href, "_blank");
};

// Close video player
const close = () => {
  if (videoPlayer.value) {
    videoPlayer.value.pause();
  }
  isLoading.value = true;
  videoError.value = false;
  emit("close");
};

// Watch for show changes to auto-play when player opens
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      isLoading.value = true;
      videoError.value = false;

      // Try to auto-play after a short delay to ensure video element is ready
      nextTick(() => {
        setTimeout(() => {
          autoPlayVideo();
        }, 100);
      });
    }
  }
);
</script>

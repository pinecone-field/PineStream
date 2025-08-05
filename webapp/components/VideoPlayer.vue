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
        autoplay
        @click.stop
      >
        <source src="/movie.mov" type="video/quicktime" />
        Your browser does not support the video tag.
      </video>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const videoPlayer = ref(null);

// Close video player
const close = () => {
  if (videoPlayer.value) {
    videoPlayer.value.pause();
  }
  emit("close");
};
</script>

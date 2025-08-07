<template>
  <div class="animate-pulse">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="text-center" v-for="i in 4" :key="i">
        <div class="h-8 bg-gray-300 rounded mb-2"></div>
        <div class="h-4 bg-gray-300 rounded w-20 mx-auto"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No props or logic needed for skeleton component
</script> 
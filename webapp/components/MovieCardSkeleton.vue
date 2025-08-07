<template>
  <div class="animate-pulse">
    <div class="relative">
      <!-- Skeleton for movie poster -->
      <div class="w-full h-64 bg-gray-700 rounded"></div>
      
      <!-- Skeleton for watched indicator -->
      <div class="absolute top-2 left-2 w-6 h-6 bg-gray-600 rounded-full"></div>
      
      <!-- Skeleton for action button -->
      <div class="absolute top-2 right-2 w-8 h-8 bg-gray-600 rounded-full"></div>
    </div>
    
    <div class="mt-2">
      <!-- Skeleton for movie title -->
      <div class="h-4 bg-gray-700 rounded mb-2"></div>
      
      <!-- Skeleton for movie details -->
      <div class="flex items-center space-x-2 mb-1">
        <div class="h-3 bg-gray-700 rounded w-16"></div>
        <div class="h-3 bg-gray-700 rounded w-2"></div>
        <div class="h-3 bg-gray-700 rounded w-12"></div>
      </div>
      
      <!-- Skeleton for genre -->
      <div class="h-3 bg-gray-700 rounded w-20"></div>
    </div>
  </div>
</template>

<script setup>
// No props or logic needed for skeleton component
</script> 
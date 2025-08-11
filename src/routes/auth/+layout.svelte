<script lang="ts">
  import PublicHeader from "$lib/components/PublicHeader.svelte";
  let { children } = $props();
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <PublicHeader />
  <div class="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-10">
    {@render children?.()}
  </div>
</div>



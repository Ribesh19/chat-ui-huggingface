<script lang="ts">
  import PublicHeader from "$lib/components/PublicHeader.svelte";
  import ToolSidebar from "$lib/components/chat/ToolSidebar.svelte";
  let { children } = $props();
  let active = $state("Tutor Me");
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <PublicHeader />
  <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-0 px-4 sm:px-6 lg:px-8 py-6">
    <ToolSidebar {active} />
    <main class="min-h-[60vh]">
      {@render children?.()}
    </main>
  </div>
</div>



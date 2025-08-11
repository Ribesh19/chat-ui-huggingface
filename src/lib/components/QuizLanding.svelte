<script lang="ts">
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import { getContext } from "svelte";
  import PublicHeader from "$lib/components/PublicHeader.svelte";

  interface Props {
    title: string;
    description: string;
    Icon: any;
    bullets: string[];
    startPrompt: string;
  }

  let { title, description, Icon, bullets, startPrompt }: Props = $props();
  const publicConfig = getContext("publicConfig");

  function startNow() {
    const params = new URLSearchParams({ q: startPrompt });
    goto(`${base}/chat?${params.toString()}`);
  }
</script>

<svelte:head>
  <title>{title} - {publicConfig.PUBLIC_APP_NAME}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <PublicHeader />

  <section class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="flex items-start gap-4">
        <div class="inline-flex items-center justify-center rounded-full bg-white/20 size-12">
          <Icon class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-3xl md:text-4xl font-bold">{title}</h1>
          <p class="mt-2 text-blue-100 max-w-3xl">{description}</p>
        </div>
      </div>
      <div class="mt-6">
        <button onclick={startNow} class="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-gray-100">
          Start now
        </button>
        <a href="{base}/revision" class="ml-3 inline-block px-6 py-3 border border-white/60 rounded-lg hover:bg-white/10">Back to Revision</a>
      </div>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {#each bullets as b}
        <div class="rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/70 backdrop-blur p-4 text-gray-800 dark:text-gray-200">
          {b}
        </div>
      {/each}
    </div>
  </section>
</div>



<script lang="ts">
  import { base } from "$app/paths";
  import PublicHeader from "$lib/components/PublicHeader.svelte";
  import CarbonUserMultiple from "~icons/carbon/user-multiple";
  import CarbonCollaborate from "~icons/carbon/collaborate";
  import CarbonCalendar from "~icons/carbon/calendar";
  import CarbonChartBar from "~icons/carbon/chart-bar";

  const cards = [
    { title: "Create Classroom", desc: "Set up a classroom space and invite students.", icon: CarbonUserMultiple, href: `${base}/contest-play` },
    { title: "Collaborative Sessions", desc: "Host interactive study sessions with AI guidance.", icon: CarbonCollaborate, href: `${base}/group-battle` },
    { title: "Schedule Practice", desc: "Plan daily challenges and assignments.", icon: CarbonCalendar, href: `${base}/quiz-play/daily-quiz-dashboard` },
    { title: "Monitor Progress", desc: "Track performance and learning trends.", icon: CarbonChartBar, href: `${base}/revision` },
  ];
</script>

<svelte:head>
  <title>Classroom - Previsely</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <PublicHeader />
  <section class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-3xl md:text-4xl font-bold">Classroom</h1>
      <p class="mt-2 text-blue-100 max-w-2xl">Create collaborative learning spaces, schedule practice, and monitor progress — all enhanced by AI.</p>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each cards as c}
        <a href={c.href} class="group rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/70 backdrop-blur p-6 hover:shadow-md transition-all">
          <div class="mb-4 inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 size-10">
            <svelte:component this={c.icon} class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{c.title}</h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{c.desc}</p>
          <div class="mt-3 text-sm text-blue-600 dark:text-blue-300">Open →</div>
        </a>
      {/each}
    </div>
  </section>
</div>



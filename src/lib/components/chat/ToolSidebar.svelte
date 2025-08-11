<script lang="ts">
  import { base } from "$app/paths";
  import CarbonAi from "~icons/carbon/machine-learning-model";
  import CarbonBook from "~icons/carbon/book";
  import CarbonFlash from "~icons/carbon/flash";
  import CarbonIdea from "~icons/carbon/idea";
  import CarbonApplicationMobile from "~icons/carbon/application-mobile";
  import CarbonFunction from "~icons/carbon/function";
  import CarbonRow from "~icons/carbon/row";
  import CarbonRotate from "~icons/carbon/rotate";

  type Tool = { name: string; href: string; icon: any; description?: string };

  export let active = "Tutor Me" as string;

  const tools: Tool[] = [
    { name: "Tutor Me", href: `${base}/tutor-me`, icon: CarbonAi },
    { name: "Interactive Learning", href: `${base}/tutor-me/interactive`, icon: CarbonFunction },
    { name: "Homework Help", href: `${base}/tutor-me/homework`, icon: CarbonApplicationMobile },
    { name: "Flashcard Question", href: `${base}/tutor-me/flashcard-question`, icon: CarbonFlash },
    { name: "Flashcard Revision", href: `${base}/tutor-me/flashcard-revision`, icon: CarbonBook },
    { name: "Real Life Application", href: `${base}/tutor-me/real-life`, icon: CarbonIdea },
    { name: "Formula Sheet", href: `${base}/tutor-me/formula-sheet`, icon: CarbonRow },
  ];
</script>

<aside class="border-r border-gray-200/60 dark:border-gray-800/60 bg-white/80 dark:bg-gray-900/70 backdrop-blur w-full max-w-[280px] p-3">
  <nav class="space-y-1">
    {#each tools as tool}
      <a
        href={tool.href}
        class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium {active === tool.name ? 'bg-blue-100/70 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800'}"
      >
        <svelte:component this={tool.icon} class="w-4 h-4" />
        {tool.name}
      </a>
    {/each}
  </nav>
</aside>



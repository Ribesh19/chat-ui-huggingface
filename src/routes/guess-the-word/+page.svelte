<script lang="ts">
  import QuizLanding from "$lib/components/QuizLanding.svelte";
  import CarbonTextBold from "~icons/carbon/text-bold";

  const bullets = [
    "Vocabulary enhancement",
    "AI-curated challenges",
    "Exam performance focus",
  ];
</script>

<QuizLanding
  title="Vocabulary Building"
  description="Enhance your vocabulary with AI-curated word challenges."
  Icon={CarbonTextBold}
  {bullets}
  startPrompt="Build my vocabulary"
/>


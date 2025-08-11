<script lang="ts">
  import QuizLanding from "$lib/components/QuizLanding.svelte";
  import CarbonBook from "~icons/carbon/book";

  const bullets = [
    "Personalized English practice with AI-tailored options",
    "Comprehension, grammar, vocabulary and writing",
    "Instant feedback and progress tracking",
  ];
</script>

<QuizLanding
  title="English (Quiz Zone)"
  description="Choose your personalized starting point for practice with AI-tailored options to suit your needs."
  Icon={CarbonBook}
  {bullets}
  startPrompt="Start English practice"
/>



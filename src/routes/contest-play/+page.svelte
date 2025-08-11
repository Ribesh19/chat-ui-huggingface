<script lang="ts">
  import QuizLanding from "$lib/components/QuizLanding.svelte";
  import CarbonUserMultiple from "~icons/carbon/user-multiple";

  const bullets = [
    "Collaborative learning",
    "AI-generated quizzes",
    "Peer interaction",
  ];
</script>

<QuizLanding
  title="Peer Practice Hub"
  description="Practice alongside others with AI-generated quizzes."
  Icon={CarbonUserMultiple}
  {bullets}
  startPrompt="Start peer practice"
/>


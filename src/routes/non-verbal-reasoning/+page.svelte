<script lang="ts">
  import QuizLanding from "$lib/components/QuizLanding.svelte";
  import CarbonChartBubble from "~icons/carbon/chart-bubble";

  const bullets = [
    "Visual reasoning challenges",
    "Grammar school preparation",
    "AI-adapted difficulty",
  ];
</script>

<QuizLanding
  title="Non-Verbal Reasoning"
  description="Master non-verbal reasoning with AI-adapted visual challenges."
  Icon={CarbonChartBubble}
  {bullets}
  startPrompt="Practice non-verbal reasoning"
/>



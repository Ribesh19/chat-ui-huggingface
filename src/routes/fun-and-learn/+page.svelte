<script lang="ts">
  import QuizLanding from "$lib/components/QuizLanding.svelte";
  import CarbonTextAlignLeft from "~icons/carbon/text-align-left";

  const bullets = [
    "English comprehension focus",
    "Supportive AI exercises",
    "Accessible learning approach",
  ];
</script>

<QuizLanding
  title="Comprehension Practice"
  description="Build comprehension skills with supportive AI exercises."
  Icon={CarbonTextAlignLeft}
  {bullets}
  startPrompt="Practice reading comprehension"
/>



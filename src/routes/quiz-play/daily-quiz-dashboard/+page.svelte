<script lang="ts">
  import QuizLanding from "$lib/components/QuizLanding.svelte";
  import CarbonCalendar from "~icons/carbon/calendar";

  const bullets = [
    "Daily AI-generated quizzes",
    "Instant feedback system",
    "Progress tracking",
  ];
</script>

<QuizLanding
  title="Daily Challenge"
  description="Tackle a new AI-crafted quiz daily to strengthen your skills."
  Icon={CarbonCalendar}
  {bullets}
  startPrompt="Start daily challenge"
/>



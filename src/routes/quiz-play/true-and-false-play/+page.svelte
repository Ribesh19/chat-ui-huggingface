<script lang="ts">
  import QuizLanding from "$lib/components/QuizLanding.svelte";
  import CarbonCheckmark from "~icons/carbon/checkmark";

  const bullets = [
    "True/False format",
    "Quick revision sessions",
    "AI-generated questions",
  ];
</script>

<QuizLanding
  title="Quick Knowledge Check"
  description="Test your knowledge with fast AI-generated true/false questions, perfect for quick revision."
  Icon={CarbonCheckmark}
  {bullets}
  startPrompt="Give me a quick knowledge check"
/>



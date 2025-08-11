<script lang="ts">
  import QuizLanding from "$lib/components/QuizLanding.svelte";
  import CarbonMicrophone from "~icons/carbon/microphone";

  const bullets = [
    "Audio-based learning",
    "Listening skills development",
    "Mobile-friendly format",
  ];
</script>

<QuizLanding
  title="Audio Questions"
  description="Improve your listening skills with AI-delivered audio questions."
  Icon={CarbonMicrophone}
  {bullets}
  startPrompt="Start audio questions practice"
/>


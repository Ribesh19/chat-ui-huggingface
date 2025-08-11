<script lang="ts">
  import QuizLanding from "$lib/components/QuizLanding.svelte";
  import CarbonUserProfile from "~icons/carbon/user-profile";

  const bullets = [
    "Self-paced learning",
    "AI-customized challenges",
    "Confidence building",
  ];
</script>

<QuizLanding
  title="Self-Assessment"
  description="Set your own pace with AI-customized challenges."
  Icon={CarbonUserProfile}
  {bullets}
  startPrompt="Run a self assessment"
/>


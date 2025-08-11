<script lang="ts">
  import QuizLanding from "$lib/components/QuizLanding.svelte";
  import CarbonCertificate from "~icons/carbon/certificate";

  const bullets = [
    "Exam simulation",
    "Performance insights",
    "Real exam preparation",
  ];
</script>

<QuizLanding
  title="Exam Style Simulations"
  description="Prepare with AI-simulated exams and actionable insights."
  Icon={CarbonCertificate}
  {bullets}
  startPrompt="Start an exam simulation"
/>


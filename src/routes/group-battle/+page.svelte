<script lang="ts">
  import QuizLanding from "$lib/components/QuizLanding.svelte";
  import CarbonCollaborate from "~icons/carbon/collaborate";

  const bullets = [
    "Group practice sessions",
    "AI-tailored content",
    "SATs/GCSE preparation",
  ];
</script>

<QuizLanding
  title="Group Study"
  description="Join friends for AI-tailored group practice."
  Icon={CarbonCollaborate}
  {bullets}
  startPrompt="Start a group study session"
/>


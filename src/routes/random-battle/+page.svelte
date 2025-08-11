<script lang="ts">
  import QuizLanding from "$lib/components/QuizLanding.svelte";
  import CarbonUserRole from "~icons/carbon/user-role";

  const bullets = [
    "Personalized AI feedback",
    "Dedicated tutor experience",
    "Individual attention",
  ];
</script>

<QuizLanding
  title="One-to-One Prep"
  description="Get personalized AI feedback as if guided by a dedicated tutor."
  Icon={CarbonUserRole}
  {bullets}
  startPrompt="One-to-one prep session"
/>


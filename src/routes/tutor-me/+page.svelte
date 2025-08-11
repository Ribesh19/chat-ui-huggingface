<script lang="ts">
  import ChatWindow from "$lib/components/chat/ChatWindow.svelte";
  import { usePublicConfig } from "$lib/utils/PublicConfig.svelte";
  import { findCurrentModel } from "$lib/utils/models";
  import { useSettingsStore } from "$lib/stores/settings";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";

  let { data } = $props();
  const publicConfig = usePublicConfig();
  const settings = useSettingsStore();

  let currentModel = $derived(
    findCurrentModel(
      [...data.models, ...data.oldModels],
      !$settings.assistants.includes($settings.activeModel)
        ? $settings.activeModel
        : data.assistant?.modelId
    )
  );
</script>

<svelte:head>
  <title>{publicConfig.PUBLIC_APP_NAME} - Tutor Me</title>
</svelte:head>

<ChatWindow assistant={data.assistant} {currentModel} models={data.models} />



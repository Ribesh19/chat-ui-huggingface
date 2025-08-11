<script lang="ts">
	import { usePublicConfig } from "$lib/utils/PublicConfig.svelte";

	const publicConfig = usePublicConfig();

	interface Props {
		classNames?: string;
	}

	let { classNames = "" }: Props = $props();
</script>

{#if publicConfig.PUBLIC_APP_ASSETS === "chatui"}
    <!-- Previsely P Mark -->
    <svg
        height="30"
        width="30"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        class={classNames}
        fill="none"
    >
        <rect width="24" height="24" rx="6" class="fill-blue-600 dark:fill-blue-500" />
        <path d="M8 17V7h6a4 4 0 1 1 0 8H8z" fill="white"/>
        <rect x="10" y="9" width="4" height="2" rx="1" class="fill-blue-600" />
        <rect x="10" y="13" width="2" height="2" rx="1" class="fill-blue-600" />
    </svg>
{:else}
    <img
        class={classNames}
        alt="{publicConfig.PUBLIC_APP_NAME} logo"
        src="{publicConfig.assetPath}/logo.svg"
    />
{/if}

<script lang="ts">
	import { goto } from "$app/navigation";
	import { base } from "$app/paths";
	import { page } from "$app/state";
	import { usePublicConfig } from "$lib/utils/PublicConfig.svelte";

	const publicConfig = usePublicConfig();

	import ChatWindow from "$lib/components/chat/ChatWindow.svelte";
	import { ERROR_MESSAGES, error } from "$lib/stores/errors";
	import { pendingMessage } from "$lib/stores/pendingMessage";
	import { useSettingsStore } from "$lib/stores/settings.js";
	import { findCurrentModel } from "$lib/utils/models";
	import { onMount } from "svelte";

	let { data } = $props();
	let loading = $state(false);
	let files: File[] = $state([]);

	const settings = useSettingsStore();

	async function createConversation(message: string) {
		try {
			loading = true;

			// check if $settings.activeModel is a valid model
			// else check if it's an assistant, and use that model
			// else use the first model

			const validModels = data.models.map((model) => model.id);

			let model;
			if (validModels.includes($settings.activeModel)) {
				model = $settings.activeModel;
			} else {
				if (data.assistant?.modelId && validModels.includes(data.assistant.modelId)) {
					model = data.assistant.modelId;
				} else {
					model = data.models[0].id;
				}
			}
			const res = await fetch(`${base}/conversation`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model,
					preprompt: $settings.customPrompts[$settings.activeModel],
					assistantId: data.assistant?._id,
				}),
			});

			if (!res.ok) {
				const errorMessage = (await res.json()).message || ERROR_MESSAGES.default;
				error.set(errorMessage);
				console.error("Error while creating conversation: ", errorMessage);
				return;
			}

			const { conversationId } = await res.json();

			// Ugly hack to use a store as temp storage, feel free to improve ^^
			pendingMessage.set({
				content: message,
				files,
			});

			// invalidateAll to update list of conversations
			await goto(`${base}/conversation/${conversationId}`, { invalidateAll: true });
		} catch (err) {
			error.set((err as Error).message || ERROR_MESSAGES.default);
			console.error(err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		// check if there's a ?q query param with a message
		const query = page.url.searchParams.get("q");
		if (query) createConversation(query);
	});

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
	<title>AI Tutor · {publicConfig.PUBLIC_APP_NAME}</title>
</svelte:head>

<section class="aitutor-theme min-h-full w-full">
	<!-- Hero / Header -->
	<div class="aitutor-hero mx-auto w-full max-w-4xl px-5 pt-6 sm:pt-8">
		<div class="brand-card">
			<div class="brand-left">
				<div class="brand-icon" aria-hidden="true">🎓</div>
				<div class="brand-text">
					<h1 class="brand-title">AI Tutor</h1>
					<p class="brand-subtitle">Personalized learning assistance. Ask, learn, and iterate.</p>
				</div>
			</div>
			<div class="brand-right">
				<span class="pill">{currentModel.displayName}</span>
				{#if data.assistant}
					<span class="pill subtle">Assistant</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Chat -->
	<div class="mx-auto w-full max-w-4xl px-3 sm:px-5 pb-6 sm:pb-10">
		<div class="chat-window-shell">
			<ChatWindow
			on:message={(ev) => createConversation(ev.detail)}
			{loading}
			assistant={data.assistant}
			{currentModel}
			models={data.models}
			bind:files
		/>
		</div>
	</div>
</section>

<style lang="postcss">
	/* Route-scoped theme wrapper */
	.aitutor-theme {
		@apply relative;
		background: radial-gradient(1200px 600px at 10% -10%, rgba(99, 102, 241, 0.12), transparent),
			radial-gradient(900px 500px at 90% -10%, rgba(16, 185, 129, 0.12), transparent);
	}

	/* Hero */
	.aitutor-hero .brand-card {
		@apply flex items-center justify-between rounded-2xl border bg-white/70 p-4 backdrop-blur-md shadow-sm dark:border-gray-800 dark:bg-gray-900/60;
	}
	.aitutor-hero .brand-left {
		@apply flex items-center gap-3;
	}
	.aitutor-hero .brand-icon {
		@apply grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white text-xl shadow;
	}
	.aitutor-hero .brand-text {
		@apply flex flex-col;
	}
	.aitutor-hero .brand-title {
		@apply text-xl font-semibold tracking-tight sm:text-2xl;
	}
	.aitutor-hero .brand-subtitle {
		@apply text-sm text-gray-600 dark:text-gray-300;
	}
	.aitutor-hero .brand-right {
		@apply flex items-center gap-2;
	}
	.aitutor-hero .pill {
		@apply inline-flex items-center rounded-full border border-indigo-300/60 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-700/60 dark:bg-indigo-900/40 dark:text-indigo-200;
	}
	.aitutor-hero .pill.subtle {
		@apply border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-200;
	}

	/* Subtle overrides inside ChatWindow limited to this route */
	/* Reset negative z-index from ChatWindow root within this route so content is interactive */
	:global(.chat-window-shell > div) {
		position: relative;
		z-index: 0;
		pointer-events: auto;
	}
	.aitutor-theme :global(form[aria-label*="file dropzone"]) {
		@apply border-indigo-200/60 bg-white/70 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/70;
	}
	.aitutor-theme :global(button[name="submit"]) {
		@apply border-0 shadow-md ring-1 ring-indigo-500/30;
		background: linear-gradient(135deg, #6366f1 0%, #10b981 100%);
		color: white;
	}
	.aitutor-theme :global(button[name="submit"]:hover:enabled) {
		filter: brightness(1.05);
	}
	.aitutor-theme :global(.active-model) {
		@apply !border-emerald-500 !bg-emerald-500/10 hover:!bg-emerald-500/20;
	}
	/* Pasted content glow tint */
	.aitutor-theme :global(.paste-glow) {
		box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.6);
	}
</style>

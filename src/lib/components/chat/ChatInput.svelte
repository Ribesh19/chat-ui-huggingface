<script lang="ts">
	import { createEventDispatcher, onMount, tick } from "svelte";

	import HoverTooltip from "$lib/components/HoverTooltip.svelte";
	import IconInternet from "$lib/components/icons/IconInternet.svelte";
	import IconImageGen from "$lib/components/icons/IconImageGen.svelte";
	import IconPaperclip from "$lib/components/icons/IconPaperclip.svelte";
	import { useSettingsStore } from "$lib/stores/settings";
	import { webSearchParameters } from "$lib/stores/webSearchParameters";
	import {
		documentParserToolId,
		fetchUrlToolId,
		imageGenToolId,
		webSearchToolId,
	} from "$lib/utils/toolIds";
	import type { Assistant } from "$lib/types/Assistant";
	import { page } from "$app/state";
	import type { ToolFront } from "$lib/types/Tool";
	import ToolLogo from "../ToolLogo.svelte";
	import { goto } from "$app/navigation";
	import { base } from "$app/paths";
	import IconAdd from "~icons/carbon/add";
	import { captureScreen } from "$lib/utils/screenshot";
	import IconScreenshot from "../icons/IconScreenshot.svelte";
	import { loginModalOpen } from "$lib/stores/loginModal";
	import MathKeypad from "../math/MathKeypad.svelte";
	import MathQuillLoader from "../math/MathQuillLoader.svelte";

	import { isVirtualKeyboard } from "$lib/utils/isVirtualKeyboard";
	interface Props {
		files?: File[];
		mimeTypes?: string[];
		value?: string;
		placeholder?: string;
		loading?: boolean;
		disabled?: boolean;
		assistant?: Assistant | undefined;
		modelHasTools?: boolean;
		modelIsMultimodal?: boolean;
		children?: import("svelte").Snippet;
		onPaste?: (e: ClipboardEvent) => void;
		focused?: boolean;
		enableMathMode?: boolean;
	}

	let {
		files = $bindable([]),
		mimeTypes = [],
		value = $bindable(""),
		placeholder = "",
		loading = false,
		disabled = false,
		assistant = undefined,
		modelHasTools = false,
		modelIsMultimodal = false,
		children,
		onPaste,
		focused = $bindable(false),
		enableMathMode = false,
	}: Props = $props();

	const onFileChange = async (e: Event) => {
		if (!e.target) return;
		const target = e.target as HTMLInputElement;
		files = [...files, ...(target.files ?? [])];

		if (files.some((file) => file.type.startsWith("application/"))) {
			await settings.instantSet({
				tools: [...($settings.tools ?? []), documentParserToolId],
			});
		}
	};

	let textareaElement: HTMLTextAreaElement | undefined = $state();
	let isCompositionOn = $state(false);
	
	// Math input state
	let showMathKeypad = $state(false);
	let mathMode = $state(false);
	let mathFieldRef = { current: null as any };
	let mathQuillReady = $state(false);
	let mathFieldElement: HTMLDivElement;

	const dispatch = createEventDispatcher<{ submit: void }>();

	onMount(() => {
		if (!isVirtualKeyboard()) {
			textareaElement?.focus();
		}
		function onFormSubmit() {
			adjustTextareaHeight();
		}

		const formEl = textareaElement?.closest("form");
		formEl?.addEventListener("submit", onFormSubmit);
		return () => {
			formEl?.removeEventListener("submit", onFormSubmit);
		};
	});

	function adjustTextareaHeight() {
		if (!textareaElement) {
			return;
		}

		textareaElement.style.height = "auto";
		textareaElement.style.height = `${textareaElement.scrollHeight}px`;

		if (textareaElement.selectionStart === textareaElement.value.length) {
			textareaElement.scrollTop = textareaElement.scrollHeight;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (
			event.key === "Enter" &&
			!event.shiftKey &&
			!isCompositionOn &&
			!isVirtualKeyboard() &&
			value.trim() !== ""
		) {
			event.preventDefault();
			adjustTextareaHeight();
			tick();
			dispatch("submit");
			
			// Clear math field after submission if in math mode
			if (mathMode && mathFieldRef.current) {
				mathFieldRef.current.latex('');
			}
		}
	}

	const settings = useSettingsStore();

	// tool section

	let webSearchIsOn = $derived(
		modelHasTools
			? ($settings.tools?.includes(webSearchToolId) ?? false) ||
					($settings.tools?.includes(fetchUrlToolId) ?? false)
			: $webSearchParameters.useSearch
	);
	let imageGenIsOn = $derived($settings.tools?.includes(imageGenToolId) ?? false);

	let documentParserIsOn = $derived(
		modelHasTools && files.length > 0 && files.some((file) => file.type.startsWith("application/"))
	);

	let extraTools = $derived(
		page.data.tools
			.filter((t: ToolFront) => $settings.tools?.includes(t._id))
			.filter(
				(t: ToolFront) =>
					![documentParserToolId, imageGenToolId, webSearchToolId, fetchUrlToolId].includes(t._id)
			) satisfies ToolFront[]
	);

	let showWebSearch = $derived(!assistant);
	let showImageGen = $derived(modelHasTools && !assistant);
	let showFileUpload = $derived((modelIsMultimodal || modelHasTools) && mimeTypes.length > 0);
	let showExtraTools = $derived(modelHasTools && !assistant);
	let showMathTool = $derived(true); // Always show math tool

	let showNoTools = $derived(false); // Always show tools section to include math

	// Math functions
	function toggleMathKeypad() {
		if (!showMathKeypad) {
			// Opening keypad - switch to math mode
			showMathKeypad = true;
			switchToMathMode();
		} else {
			// Closing keypad - stay in math mode, just hide keypad
			showMathKeypad = false;
		}
	}

	function switchToMathMode() {
		mathMode = true;
		
		// Initialize MathQuill when the field element is available
		setTimeout(() => {
			if (typeof window !== 'undefined' && mathFieldElement && (window as any).MathQuill) {
				const MQ = (window as any).MathQuill.getInterface(2);
				
				mathFieldRef.current = MQ.MathField(mathFieldElement, {
					spaceBehavesLikeTab: true,
					handlers: {
						edit: () => {
							// Update the value when math content changes
							if (mathFieldRef.current) {
								const latex = mathFieldRef.current.latex();
								// Wrap in math delimiters for proper rendering
								value = latex ? `$${latex}$` : '';
							}
						},
						enter: () => {
							// Handle enter key - submit form
							dispatch('submit');
							
							// Clear math field after submission
							if (mathFieldRef.current) {
								mathFieldRef.current.latex('');
							}
						}
					}
				});
				
				// Set initial content from textarea
				if (textareaElement && mathFieldRef.current) {
					const currentValue = textareaElement.value || '';
					// Unwrap math delimiters if present
					const unwrapped = currentValue.replace(/^\$(.+)\$$/, '$1');
					mathFieldRef.current.latex(unwrapped);
				}
				
				mathFieldRef.current.focus();
				mathQuillReady = true;
			}
		}, 10);
	}

	function exitMathMode() {
		if (mathFieldRef.current) {
			const latex = mathFieldRef.current.latex();
			// Wrap in math delimiters for proper rendering
			const wrappedLatex = latex ? `$${latex}$` : '';
			value = wrappedLatex;
			if (textareaElement) {
				textareaElement.value = wrappedLatex;
			}
		}
		
		mathMode = false;
		showMathKeypad = false;
		
		// Focus back to textarea
		setTimeout(() => {
			if (textareaElement) {
				textareaElement.focus();
			}
		}, 100);
	}

	function handleMathQuillMount(mq: any) {
		mathQuillReady = true;
		mathFieldRef.current = mq;
	}
	
	// Auto-enable math mode when requested from parent
	$effect(() => {
		if (enableMathMode && !mathMode) {
			console.log('Auto-enabling math mode for LaTeX input');
			switchToMathMode();
		}
	});
</script>

<MathQuillLoader>
<div class="flex min-h-full flex-1 flex-col" onpaste={onPaste}>
	<textarea
		rows="1"
		tabindex="0"
		inputmode="text"
		class="scrollbar-custom max-h-[4lh] w-full resize-none overflow-y-auto overflow-x-hidden border-0 bg-transparent px-2.5 py-2.5 outline-none focus:ring-0 focus-visible:ring-0 sm:px-3"
		class:text-gray-400={disabled}
		bind:value
		bind:this={textareaElement}
		onkeydown={handleKeydown}
		oncompositionstart={() => (isCompositionOn = true)}
		oncompositionend={() => (isCompositionOn = false)}
		oninput={adjustTextareaHeight}
		onbeforeinput={(ev) => {
			if (page.data.loginRequired) {
				ev.preventDefault();
				$loginModalOpen = true;
			}
		}}
		{placeholder}
		{disabled}
		onfocus={() => (focused = true)}
		onblur={() => (focused = false)}
		style:display={mathMode ? 'none' : 'block'}
	></textarea>
	
	<!-- Math Field (when in math mode) -->
	{#if mathMode}
		<div class="math-field-container">
			<button
				class="exit-math-button"
				onclick={exitMathMode}
				title="Exit Math Mode"
			>
				×
			</button>
			<div
				class="math-field-wrapper"
				bind:this={mathFieldElement}
			></div>
		</div>
	{/if}

	{#if !showNoTools}
		<div
			class={[
				"scrollbar-custom -ml-0.5 flex max-w-[calc(100%-40px)] flex-wrap items-center justify-start gap-2.5 px-3 pb-2.5 pt-1.5 text-gray-500 dark:text-gray-400 max-md:flex-nowrap max-md:overflow-x-auto sm:gap-2",
			]}
		>
			{#if showWebSearch}
				<HoverTooltip
					label="Search the web"
					position="top"
					TooltipClassNames="text-xs !text-left !w-auto whitespace-nowrap !py-1 !mb-0 max-sm:hidden {webSearchIsOn
						? 'hidden'
						: ''}"
				>
					<button
						class="base-tool"
						class:active-tool={webSearchIsOn}
						disabled={loading}
						onclick={async (e) => {
							e.preventDefault();
							if (modelHasTools) {
								if (webSearchIsOn) {
									await settings.instantSet({
										tools: ($settings.tools ?? []).filter(
											(t) => t !== webSearchToolId && t !== fetchUrlToolId
										),
									});
								} else {
									await settings.instantSet({
										tools: [...($settings.tools ?? []), webSearchToolId, fetchUrlToolId],
									});
								}
							} else {
								$webSearchParameters.useSearch = !webSearchIsOn;
							}
						}}
					>
						<IconInternet classNames="text-xl" />
						{#if webSearchIsOn}
							Search
						{/if}
					</button>
				</HoverTooltip>
			{/if}
			{#if showImageGen}
				<HoverTooltip
					label="Generate	images"
					position="top"
					TooltipClassNames="text-xs !text-left !w-auto whitespace-nowrap !py-1 !mb-0 max-sm:hidden {imageGenIsOn
						? 'hidden'
						: ''}"
				>
					<button
						class="base-tool"
						class:active-tool={imageGenIsOn}
						disabled={loading}
						onclick={async (e) => {
							e.preventDefault();
							if (modelHasTools) {
								if (imageGenIsOn) {
									await settings.instantSet({
										tools: ($settings.tools ?? []).filter((t) => t !== imageGenToolId),
									});
								} else {
									await settings.instantSet({
										tools: [...($settings.tools ?? []), imageGenToolId],
									});
								}
							}
						}}
					>
						<IconImageGen classNames="text-xl" />
						{#if imageGenIsOn}
							Image Gen
						{/if}
					</button>
				</HoverTooltip>
			{/if}
			{#if showFileUpload}
				{@const mimeTypesString = mimeTypes
					.map((m) => {
						// if the mime type ends in *, grab the first part so image/* becomes image
						if (m.endsWith("*")) {
							return m.split("/")[0];
						}
						// otherwise, return the second part for example application/pdf becomes pdf
						return m.split("/")[1];
					})
					.join(", ")}
				<div class="flex items-center">
					<HoverTooltip
						label={mimeTypesString.includes("*")
							? "Upload any file"
							: `Upload ${mimeTypesString} files`}
						position="top"
						TooltipClassNames="text-xs !text-left !w-auto whitespace-nowrap !py-1 !mb-0 max-sm:hidden"
					>
						<label class="base-tool relative" class:active-tool={documentParserIsOn}>
							<input
								disabled={loading}
								class="absolute hidden size-0"
								aria-label="Upload file"
								type="file"
								onchange={onFileChange}
								accept={mimeTypes.join(",")}
							/>
							<IconPaperclip classNames="text-xl" />
							{#if documentParserIsOn}
								Document Parser
							{/if}
						</label>
					</HoverTooltip>
				</div>
				{#if mimeTypes.includes("image/*")}
					<HoverTooltip
						label="Capture screenshot"
						position="top"
						TooltipClassNames="text-xs !text-left !w-auto whitespace-nowrap !py-1 !mb-0 max-sm:hidden"
					>
						<button
							class="base-tool"
							onclick={async (e) => {
								e.preventDefault();
								const screenshot = await captureScreen();

								// Convert base64 to blob
								const base64Response = await fetch(screenshot);
								const blob = await base64Response.blob();

								// Create a File object from the blob
								const file = new File([blob], "screenshot.png", { type: "image/png" });

								files = [...files, file];
							}}
						>
							<IconScreenshot classNames="text-xl" />
						</button>
					</HoverTooltip>
				{/if}
			{/if}
			
			{#if showMathTool}
				<!-- Math Keypad Tool Button -->
				<HoverTooltip
					label="Math keypad"
					position="top"
					TooltipClassNames="text-xs !text-left !w-auto whitespace-nowrap !py-1 !mb-0 max-sm:hidden {showMathKeypad
						? 'hidden'
						: ''}"
				>
					<button
						class="base-tool"
						class:active-tool={showMathKeypad}
						disabled={loading}
						onclick={(e) => {
							e.preventDefault();
							toggleMathKeypad();
						}}
					>
						∑
						{#if showMathKeypad}
							Math
						{/if}
					</button>
				</HoverTooltip>
			{/if}
			
			{#if showExtraTools}
				{#each extraTools as tool}
					<button
						class="active-tool base-tool"
						disabled={loading}
						onclick={async (e) => {
							e.preventDefault();
							goto(`${base}/tools/${tool._id}`);
						}}
					>
						{#key tool.icon + tool.color}
							<ToolLogo icon={tool.icon} color={tool.color} size="xs" />
						{/key}
						{tool.displayName}
					</button>
				{/each}
				<HoverTooltip
					label="Browse more tools"
					position="right"
					TooltipClassNames="text-xs !text-left !w-auto whitespace-nowrap !py-1 max-sm:hidden"
				>
					<a
						class="base-tool flex !size-[20px] items-center justify-center rounded-full border !border-gray-200 !bg-white !transition-none dark:!border-gray-500 dark:!bg-transparent"
						href={`${base}/tools`}
						title="Browse more tools"
					>
						<IconAdd class="text-sm" />
					</a>
				</HoverTooltip>
			{/if}
		</div>
	{/if}
	
	<!-- Math Keypad Popover -->
	{#if showMathKeypad}
		<div class="math-keypad-wrapper">
			<MathKeypad
				onInsert={({ type, symbol }) => {
					console.log('Math keypad insert:', type, symbol, 'mathMode:', mathMode, 'mathFieldRef:', mathFieldRef.current);
					
					if (mathMode && mathFieldRef.current) {
						// Insert into MathQuill field
						const mq = mathFieldRef.current;
						
						if (type === 'backspace') {
							mq.keystroke('Backspace');
						} else if (type === 'insert') {
							// Special handling for different symbols
							if (/^\d$/.test(symbol)) {
								// Numbers
								mq.write(symbol);
							} else if (symbol === '.') {
								// Decimal point
								mq.write('.');
							} else if (symbol === '\\frac{}{}') {
								// Fraction
								mq.cmd('\\frac');
							} else if (symbol === '{}\\frac{}{}') {
								// Mixed fraction
								mq.write('{}');
								mq.cmd('\\frac');
							} else if (symbol === '\\sqrt{}') {
								// Square root
								mq.cmd('\\sqrt');
							} else if (symbol === '^2') {
								// x²
								mq.cmd('^');
								mq.write('2');
							} else if (symbol === '^{}') {
								// x^n
								mq.cmd('^');
							} else if (symbol.startsWith('\\')) {
								// LaTeX commands
								mq.cmd(symbol);
							} else {
								// Regular symbols
								mq.write(symbol);
							}
						}
						
						mq.focus();
					} else {
						// Insert into regular textarea if not in math mode
						if (textareaElement) {
							const start = textareaElement.selectionStart;
							const end = textareaElement.selectionEnd;
							const text = textareaElement.value;
							
							if (type === 'backspace') {
								if (start > 0) {
									const newValue = text.slice(0, start - 1) + text.slice(end);
									textareaElement.value = newValue;
									value = newValue;
									textareaElement.setSelectionRange(start - 1, start - 1);
								}
							} else {
								const newValue = text.slice(0, start) + symbol + text.slice(end);
								textareaElement.value = newValue;
								value = newValue;
								textareaElement.setSelectionRange(start + symbol.length, start + symbol.length);
							}
							
							textareaElement.focus();
							adjustTextareaHeight();
						}
					}
				}}
				onClose={() => {
					console.log('Closing math keypad');
					showMathKeypad = false;
				}}
			/>
		</div>
	{/if}
	
	{@render children?.()}
</div>
</MathQuillLoader>

<style lang="postcss">
	:global(pre),
	:global(textarea) {
		font-family: inherit;
		box-sizing: border-box;
		line-height: 1.5;
		font-size: 16px;
	}

	.math-field-container {
		position: relative;
		width: 100%;
		min-height: 3rem;
		padding: 0.75rem 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		background-color: #f9fafb;
		margin-bottom: 0.5rem;
	}

	.exit-math-button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		border: none;
		background-color: #ef4444;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		line-height: 1;
		z-index: 10;
		transition: background-color 0.2s;
	}

	.exit-math-button:hover {
		background-color: #dc2626;
	}

	.math-field-wrapper {
		width: 100%;
		min-height: 2rem;
	}

	/* MathQuill field styles */
	:global(.math-field-wrapper .mq-editable-field) {
		width: 100% !important;
		border: none !important;
		box-shadow: none !important;
		padding: 0.5rem !important;
		background-color: transparent !important;
		border-radius: 0.5rem;
		min-height: 2rem;
		font-size: 16px !important;
	}
	
	:global(.math-field-wrapper .mq-editable-field.mq-focused) {
		box-shadow: none !important;
		border: none !important;
		outline: none !important;
		background-color: rgba(59, 130, 246, 0.05) !important;
	}
	
	:global(.math-field-wrapper .mq-root-block) {
		padding: 0.5rem !important;
	}
	
	:global(.math-field-wrapper .mq-cursor) {
		border-left: 2px solid #3b82f6 !important;
	}

	/* Dark mode support */
	:global(.dark) .math-field-container {
		background-color: #1f2937;
		border-color: #374151;
	}

	:global(.dark) .math-field-container .mq-editable-field {
		color: #f9fafb !important;
	}

	/* Math Keypad positioning - let it appear above like original design */
	.math-keypad-wrapper {
		position: relative;
		width: 100%;
		height: 0; /* Don't take up space */
	}

	.math-keypad-wrapper :global(.keypad-container) {
		/* Position above the tools area */
		position: absolute !important;
		right: 0 !important;
		bottom: calc(100% + 16px) !important; /* Above the tools with some spacing */
		z-index: 1000 !important;
	}
</style>

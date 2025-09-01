<script lang="ts">
  import type { Message } from "$lib/types/Message";
  import { createEventDispatcher, tick } from "svelte";
  import { page } from "$app/state";
  import { base } from "$app/paths";
  
  import ChatInput from "../chat/ChatInput.svelte";
  import ChatMessage from "../chat/ChatMessage.svelte";
  import ChatIntroduction from "../chat/ChatIntroduction.svelte";
  import StopGeneratingBtn from "../StopGeneratingBtn.svelte";
  import RetryBtn from "../RetryBtn.svelte";
  import ContinueBtn from "../ContinueBtn.svelte";
  import ScrollToBottomBtn from "../ScrollToBottomBtn.svelte";
  import { snapScrollToBottom } from "$lib/actions/snapScrollToBottom";
  import { useSettingsStore } from "$lib/stores/settings";
  import type { Model } from "$lib/types/Model";
  import type { ToolFront } from "$lib/types/Tool";
  import FileDropzone from "$lib/components/chat/FileDropzone.svelte";
  import UploadedFile from "$lib/components/chat/UploadedFile.svelte";
  import file2base64 from "$lib/utils/file2base64";
  import type { MessageFile } from "$lib/types/Message";
  import { fly } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import EosIconsLoading from "~icons/eos-icons/loading";
  import CarbonBookmark from "~icons/carbon/bookmark";
  
  interface Props {
    messages?: Message[];
    loading?: boolean;
    pending?: boolean;
    currentModel: Model;
    models: Model[];
    preprompt?: string;
    files?: File[];
    selectedPdfText?: string;
    pdfContext?: string[];
  }

  let {
    messages = [],
    loading = false,
    pending = false,
    currentModel,
    models,
    preprompt = undefined,
    files = $bindable([]),
    selectedPdfText = $bindable(''),
    pdfContext = [],
  }: Props = $props();

  let message: string = $state("");
  let chatContainer: HTMLElement | undefined = $state();
  let editMsdgId: Message["id"] | null = $state(null);
  let onDrag = $state(false);
  let lastTarget: EventTarget | null = null;
  let focused = $state(false);
  let pastedLongContent = $state(false);
  let enableMathMode = $state(false);

  const dispatch = createEventDispatcher<{
    message: string;
    stop: void;
    retry: { id: Message["id"]; content?: string };
    continue: { id: Message["id"] };
  }>();

  const settings = useSettingsStore();

  const handleSubmit = () => {
    if (loading) return;
    
    // Include PDF context if available
    let fullMessage = message;
    if (pdfContext.length > 0) {
      const contextText = pdfContext
        .map(ctx => `[Page ${ctx.page}]: "${ctx.text}"`)
        .join('\n\n');
      fullMessage = `Context from PDF:\n${contextText}\n\nQuestion: ${message}`;
    }
    
    dispatch("message", fullMessage);
    message = "";
    // Clear PDF context after sending
    pdfContext = [];
  };

  // Add selected PDF text to message input
  $effect(() => {
    if (selectedPdfText) {
      // Check if the selected text is pure LaTeX (math expression)
      const isLatex = /^\\\((.*)\\\)$|^\\\[(.*)\\\]$|^\$\$(.*)\$\$$|^\$([^$]*)\$$/g.test(selectedPdfText.trim());
      
      if (isLatex) {
        // For LaTeX expressions, wrap them in $ for proper rendering
        // Convert \(...\) to $...$ for compatibility with our math input
        let mathExpression = selectedPdfText.trim();
        if (mathExpression.startsWith('\\(') && mathExpression.endsWith('\\)')) {
          // Extract the inner LaTeX and wrap in $
          mathExpression = '$' + mathExpression.slice(2, -2) + '$';
        } else if (mathExpression.startsWith('\\[') && mathExpression.endsWith('\\]')) {
          // Extract the inner LaTeX and wrap in $$
          mathExpression = '$$' + mathExpression.slice(2, -2) + '$$';
        }
        
        if (message) {
          message = `${message}\n\n${mathExpression}`;
        } else {
          message = mathExpression;
        }
        
        // Auto-enable math mode for LaTeX input
        enableMathMode = true;
        // Reset after a brief moment to allow re-triggering
        setTimeout(() => {
          enableMathMode = false;
        }, 100);
      } else {
        // For regular text, use the original format
        if (message) {
          message = `${message}\n\n"${selectedPdfText}"`;
        } else {
          message = `Regarding this text from the PDF: "${selectedPdfText}"\n\n`;
        }
      }
      selectedPdfText = '';
    }
  });

  async function scrollToBottom() {
    await tick();
    if (!chatContainer) return;
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  let lastMessage = $derived(messages.at(-1) as Message);
  let lastIsError = $derived(
    lastMessage &&
      !loading &&
      (lastMessage.from === "user" ||
        lastMessage.updates?.findIndex((u) => u.type === "status" && u.status === "error") !== -1)
  );

  let sources = $derived(
    files?.map<Promise<MessageFile>>((file) =>
      file2base64(file).then((value) => ({
        type: "base64",
        value,
        mime: file.type,
        name: file.name,
      }))
    )
  );

  const onDragEnter = (e: DragEvent) => {
    lastTarget = e.target;
    onDrag = true;
  };

  const onDragLeave = (e: DragEvent) => {
    if (e.target === lastTarget) {
      onDrag = false;
    }
  };

  const onPaste = (e: ClipboardEvent) => {
    const textContent = e.clipboardData?.getData("text");

    if (!$settings.directPaste && textContent && textContent.length >= 3984) {
      e.preventDefault();
      pastedLongContent = true;
      setTimeout(() => {
        pastedLongContent = false;
      }, 1000);
      const pastedFile = new File([textContent], "Pasted Content", {
        type: "application/vnd.chatui.clipboard",
      });

      files = [...files, pastedFile];
    }

    if (!e.clipboardData) return;

    const pastedFiles = Array.from(e.clipboardData.files);
    if (pastedFiles.length !== 0) {
      e.preventDefault();
      files = [...files, ...pastedFiles];
    }
  };

  let mimeTypesFromActiveTools = $derived(
    page.data.tools
      .filter((tool: ToolFront) => {
        if (currentModel.tools) {
          return $settings?.tools?.includes(tool._id) ?? tool.isOnByDefault;
        }
        return false;
      })
      .flatMap((tool: ToolFront) => tool.mimeTypes ?? [])
  );

  let activeMimeTypes = $derived(
    Array.from(
      new Set([
        ...mimeTypesFromActiveTools,
        ...(currentModel.tools ? ["application/pdf"] : []),
        ...(currentModel.multimodal
          ? (currentModel.multimodalAcceptedMimetypes ?? ["image/*"])
          : []),
      ])
    )
  );

  let isFileUploadEnabled = $derived(activeMimeTypes.length > 0);

  // Auto-scroll on new user message
  $effect(() => {
    if (lastMessage && lastMessage.from === "user") {
      scrollToBottom();
    }
  });
</script>

<svelte:window
  ondragenter={onDragEnter}
  ondragleave={onDragLeave}
  ondragover={(e) => {
    e.preventDefault();
  }}
  ondrop={(e) => {
    e.preventDefault();
    onDrag = false;
  }}
/>

<div class="flex flex-col h-full bg-white dark:bg-gray-900">
  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
    <div class="flex items-center gap-2">
      <CarbonBookmark class="w-5 h-5 text-blue-600 dark:text-blue-400" />
      <h2 class="font-semibold text-gray-900 dark:text-white">Study Assistant</h2>
    </div>
    <div class="text-sm text-gray-500 dark:text-gray-400">
      {currentModel.displayName}
    </div>
  </div>

  <!-- Chat Messages -->
  <div
    class="flex-1 overflow-y-auto scrollbar-custom"
    use:snapScrollToBottom={messages.map((msg) => msg.content)}
    bind:this={chatContainer}
  >
    <div class="mx-auto flex h-full max-w-3xl flex-col gap-6 px-5 pt-6 pb-32">
      {#if messages.length > 0}
        {#each messages as msg, idx (msg.id)}
          <ChatMessage
            {loading}
            message={msg}
            isAuthor={true}
            readOnly={false}
            isLast={idx === messages.length - 1}
            bind:editMsdgId
            on:retry
            on:vote
            on:continue
          />
        {/each}
      {:else if pending}
        <ChatMessage
          loading={true}
          message={{
            id: "0-0-0-0-0",
            content: "",
            from: "assistant",
            children: [],
          }}
          isAuthor={true}
          readOnly={false}
        />
      {:else}
        <div class="flex flex-col items-center justify-center h-full text-center">
          <div class="max-w-md mx-auto">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Welcome to Classroom Study
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Select text from your PDF to discuss it, or ask questions about the material.
            </p>
            <div class="grid grid-cols-1 gap-2 text-left">
              <button
                class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                onclick={() => dispatch("message", "Can you summarize the key concepts from this document?")}
              >
                📚 Summarize key concepts
              </button>
              <button
                class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                onclick={() => dispatch("message", "Generate practice questions based on this material")}
              >
                ✏️ Generate practice questions
              </button>
              <button
                class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                onclick={() => dispatch("message", "Explain the main topics in simple terms")}
              >
                💡 Explain in simple terms
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <ScrollToBottomBtn
      class="fixed bottom-24 right-8"
      scrollNode={chatContainer}
    />
  </div>

  <!-- PDF Context Indicator -->
  {#if pdfContext.length > 0}
    <div class="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
      <div class="text-xs text-blue-700 dark:text-blue-300">
        📎 {pdfContext.length} PDF excerpt{pdfContext.length > 1 ? 's' : ''} attached to next message
      </div>
    </div>
  {/if}

  <!-- File Upload Area -->
  {#if sources?.length && !loading}
    <div class="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
      <div
        in:fly|local={sources.length === 1 ? { y: -20, easing: cubicInOut } : undefined}
        class="flex flex-row flex-wrap gap-2"
      >
        {#each sources as source, index}
          {#await source then src}
            <UploadedFile
              file={src}
              on:close={() => {
                files = files.filter((_, i) => i !== index);
              }}
            />
          {/await}
        {/each}
      </div>
    </div>
  {/if}

  <!-- Input Area -->
  <div class="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
    {#if loading}
      <div class="flex justify-center">
        <StopGeneratingBtn onClick={() => dispatch("stop")} />
      </div>
    {:else if lastIsError}
      <div class="flex justify-center">
        <RetryBtn
          onClick={() => {
            if (lastMessage && lastMessage.ancestors) {
              dispatch("retry", { id: lastMessage.id });
            }
          }}
        />
      </div>
    {:else if messages && lastMessage && lastMessage.interrupted}
      <div class="flex justify-center">
        <ContinueBtn
          onClick={() => {
            if (lastMessage && lastMessage.ancestors) {
              dispatch("continue", { id: lastMessage?.id });
            }
          }}
        />
      </div>
    {/if}

    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      class="relative"
    >
      {#if onDrag && isFileUploadEnabled}
        <FileDropzone bind:files bind:onDrag mimeTypes={activeMimeTypes} />
      {:else}
        <div class="relative flex items-center">
          <div
            class="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
            class:paste-glow={pastedLongContent}
          >
            {#if lastIsError}
              <ChatInput value="Sorry, something went wrong. Please try again." disabled={true} />
            {:else}
              <ChatInput
                placeholder="Ask about the PDF content..."
                {loading}
                bind:value={message}
                bind:files
                mimeTypes={activeMimeTypes}
                on:submit={handleSubmit}
                {onPaste}
                disabled={lastIsError}
                modelHasTools={currentModel.tools}
                modelIsMultimodal={currentModel.multimodal}
                bind:focused
                {enableMathMode}
              />
            {/if}
          </div>

          {#if loading}
            <button
              disabled
              class="absolute right-2 bottom-2 p-2 text-gray-400"
            >
              <EosIconsLoading />
            </button>
          {:else}
            <button
              class="absolute right-2 bottom-2 p-1.5 rounded-full bg-blue-600 text-white enabled:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!message}
              type="submit"
              aria-label="Send message"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          {/if}
        </div>
      {/if}
    </form>
  </div>
</div>

<style>
  .paste-glow {
    animation: glow 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  @keyframes glow {
    0% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.8);
    }
    50% {
      box-shadow: 0 0 20px 4px rgba(59, 130, 246, 0.6);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
  }
</style>
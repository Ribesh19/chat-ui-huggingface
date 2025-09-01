<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { browser } from "$app/environment";
  import { ERROR_MESSAGES, error } from "$lib/stores/errors";
  import { pendingMessage } from "$lib/stores/pendingMessage";
  import { useSettingsStore } from "$lib/stores/settings";
  import { findCurrentModel } from "$lib/utils/models";
  import InteractivePDFViewer from "$lib/components/classroom/InteractivePDFViewer.svelte";
  import DocumentViewer from "$lib/components/classroom/DocumentViewer.svelte";
  import ClassroomChat from "$lib/components/classroom/ClassroomChat.svelte";
  import type { Message } from "$lib/types/Message";
  import CarbonDocument from "~icons/carbon/document";
  import CarbonUpload from "~icons/carbon/upload";
  
  let { data } = $props();
  
  // States
  let messages = $state<Message[]>([]);
  let loading = $state(false);
  let pending = $state(false);
  let files = $state<File[]>([]);
  let selectedText = $state('');
  let textContext = $state<string[]>([]);
  let documentUrl = $state('');
  let documentFile = $state<File | null>(null);
  let documentContent = $state('');
  let documentFormat = $state<'markdown' | 'html' | 'text' | 'pdf'>('text');
  let conversationId = $state<string | null>(null);
  let lastMessageId = $state<string | null>(null);
  let fileInput: HTMLInputElement;
  
  const settings = useSettingsStore();

  // Current model derived from settings
  let currentModel = $derived(
    findCurrentModel(
      [...data.models, ...data.oldModels],
      $settings.activeModel
    )
  );

  // Handle file upload with multiple formats
  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    documentFile = file;
    
    // Determine format based on file type
    if (file.type === 'application/pdf') {
      documentFormat = 'pdf';
      documentUrl = URL.createObjectURL(file);
    } else if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
      documentFormat = 'markdown';
      documentContent = await file.text();
    } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
      documentFormat = 'html';
      documentContent = await file.text();
    } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      documentFormat = 'text';
      documentContent = await file.text();
    } else {
      error.set('Unsupported file format. Please use PDF, Markdown (.md), HTML (.html), or Text (.txt) files.');
      return;
    }
  }

  // Handle text selection from document
  function handleTextSelected(event: CustomEvent<{ text: string }>) {
    const { text } = event.detail;
    
    // Add to context for next message
    textContext = [...textContext, text];
    
    // Also add to chat input
    selectedText = text;
  }


  // Send message and stay on the same page with simple streaming
  async function sendMessage(content: string) {
    try {
      loading = true;
      pending = true;

      // Include document context in the message
      let fullMessage = content;
      if (textContext.length > 0) {
        const contextText = textContext
          .map((text, index) => `[Reference ${index + 1}]: "${text}"`)
          .join('\n\n');
        fullMessage = `Context from document:\n${contextText}\n\nQuestion: ${content}`;
      }

      // Immediately add user message to display
      const userMessage: Message = {
        id: crypto.randomUUID(),
        from: 'user',
        content: fullMessage,
        children: [],
        ancestors: [],
        files: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        updates: []
      };
      messages = [...messages, userMessage];

      // Add empty assistant message for loading state
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        from: 'assistant',
        content: '',
        children: [],
        ancestors: [userMessage.id],
        files: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        updates: []
      };
      messages = [...messages, assistantMessage];

      // Ensure we have a conversation
      await ensureConversation();
      
      if (!conversationId) {
        throw new Error('Failed to create conversation');
      }

      // Clear context
      textContext = [];

      // Create FormData exactly like fetchMessageUpdates does
      const form = new FormData();
      
      // Build options object, include parent message id if available
      const opts: any = {
        inputs: fullMessage,
        is_retry: false,
        is_continue: false,
        web_search: false,
        tools: $settings.tools || [],
      };

      // Add parent message id if we have one (for proper threading)
      if (lastMessageId) {
        opts.id = lastMessageId;
        console.log('Using parent message ID:', lastMessageId);
      } else {
        console.log('First message - no parent ID needed');
      }
      
      // Don't use message threading for classroom chat - keep it simple
      console.log('Sending message without threading for classroom chat');
      
      const optsJSON = JSON.stringify(opts);
      console.log('Sending message options:', opts);
      console.log('FormData JSON string:', optsJSON);

      // Add files if any - convert to base64 files first
      if (files.length > 0) {
        const base64Files = await Promise.all(
          files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            return {
              type: "base64" as const,
              value: base64,
              mime: file.type,
              name: file.name,
            };
          })
        );

        base64Files.forEach((file) => {
          const name = file.type + ";" + file.name;
          form.append("files", new File([file.value], name, { type: file.mime }));
        });
      }

      form.append("data", optsJSON);

      // Send to conversation endpoint
      const res = await fetch(`${base}/conversation/${conversationId}`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to send message');
      }

      // Stream the response and update the assistant message
      await streamResponse(res, assistantMessage);

      // Clear files
      files = [];
      console.log('Message sending completed successfully');

    } catch (err) {
      console.error('Send message error:', err);
      error.set((err as Error).message || ERROR_MESSAGES.default);
      
      // Remove the messages we added on error (last user and assistant)
      messages = messages.slice(0, -2);
    } finally {
      loading = false;
      pending = false;
      console.log('Set loading and pending to false');
    }
  }

  // Update lastMessageId from server state
  async function updateLastMessageId() {
    if (!conversationId) return;
    
    try {
      const convRes = await fetch(`${base}/api/v2/conversations/${conversationId}`, {
        method: 'GET'
      });
      
      if (convRes.ok) {
        const convData = await convRes.json();
        const conversation = convData.json || convData;
        
        // Get the last message ID from the server
        if (conversation.messages && conversation.messages.length > 0) {
          const lastServerMessage = conversation.messages[conversation.messages.length - 1];
          lastMessageId = lastServerMessage.id;
          console.log('Updated lastMessageId from server:', lastMessageId);
        }
      }
    } catch (err) {
      console.warn('Failed to update lastMessageId:', err);
    }
  }

  // Create conversation if needed
  async function ensureConversation() {
    if (conversationId) return;

    const validModels = data.models.map((model) => model.id);
    let model = validModels.includes($settings.activeModel) 
      ? $settings.activeModel 
      : data.models[0].id;

    try {
      const res = await fetch(`${base}/conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          preprompt: `You are a helpful study assistant. You have access to a document that the student is studying. 
          Help them understand the content, answer questions, and provide explanations. 
          When referring to specific content, provide clear explanations and context.
          ${$settings.customPrompts[$settings.activeModel] || ''}`,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Conversation creation error:', errorText);
        throw new Error(`Failed to create conversation: ${res.status} ${res.statusText}`);
      }

      const result = await res.json();
      conversationId = result.conversationId;
      console.log('Created conversation:', conversationId);
      
      // Fetch the conversation to get the system message ID
      const convRes = await fetch(`${base}/api/v2/conversations/${conversationId}`, {
        method: 'GET'
      });
      
      if (convRes.ok) {
        const convData = await convRes.json();
        console.log('Fetched conversation data:', convData);
        // Handle the response format - it has json property
        const conversation = convData.json || convData;
        console.log('Parsed conversation:', conversation);
        console.log('Messages array:', conversation.messages);
        // Use the rootMessageId from the conversation
        if (conversation.rootMessageId) {
          lastMessageId = conversation.rootMessageId;
          console.log('Set lastMessageId to rootMessageId:', lastMessageId);
        } else if (conversation.messages && conversation.messages.length > 0) {
          console.log('First message:', conversation.messages[0]);
          lastMessageId = conversation.messages[0].id;
          console.log('Set lastMessageId to system message:', lastMessageId);
        } else {
          console.log('No messages found in conversation');
        }
      } else {
        console.error('Failed to fetch conversation:', convRes.status, convRes.statusText);
        const errorText = await convRes.text();
        console.error('Conversation fetch error:', errorText);
      }
    } catch (err) {
      console.error('ensureConversation error:', err);
      throw err;
    }
  }

  // Stream the response with incremental updates
  async function streamResponse(response: Response, assistantMessage: Message) {
    if (!response.body) {
      console.error('No response body for streaming');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    let contentBuffer = '';
    let lastUpdateTime = new Date();
    const updateDebounceMs = 50; // Similar to main chat

    try {
      console.log('Starting to stream response...');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Streaming completed');
          // Flush any remaining buffer
          if (contentBuffer) {
            const updatedMessage = { ...assistantMessage, content: assistantMessage.content + contentBuffer };
            messages = messages.map(msg => msg.id === assistantMessage.id ? updatedMessage : msg);
            Object.assign(assistantMessage, updatedMessage);
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              console.log('Received stream data:', data);
              
              if (data.type === 'stream' && data.token) {
                // Remove null characters padding
                const cleanToken = data.token.replace(/\0/g, '');
                if (cleanToken) {
                  // Stop loading indicator on first token
                  if (pending) {
                    pending = false;
                  }
                  
                  // Add to buffer for debounced updates
                  contentBuffer += cleanToken;
                  
                  // Check if enough time has passed for an update
                  const currentTime = new Date();
                  if (currentTime.getTime() - lastUpdateTime.getTime() > updateDebounceMs) {
                    // Update the assistant message with accumulated content
                    const updatedMessage = { ...assistantMessage, content: assistantMessage.content + contentBuffer };
                    messages = messages.map(msg => msg.id === assistantMessage.id ? updatedMessage : msg);
                    Object.assign(assistantMessage, updatedMessage);
                    
                    contentBuffer = '';
                    lastUpdateTime = currentTime;
                  }
                }
              } else if (data.type === 'finalAnswer') {
                console.log('Received final answer:', data.text);
                // Update with final complete content
                const updatedMessage = { ...assistantMessage, content: data.text };
                messages = messages.map(msg => msg.id === assistantMessage.id ? updatedMessage : msg);
                Object.assign(assistantMessage, updatedMessage);
              } else if (data.type === 'status' && data.status === 'error') {
                console.error('Stream error:', data.message);
                error.set(data.message || 'An error occurred');
                return;
              }
            } catch (e) {
              console.warn('Failed to parse stream line:', line, e);
            }
          }
        }
      }
    } catch (streamError) {
      console.error('Streaming error:', streamError);
      error.set('Failed to stream response');
    } finally {
      reader.releaseLock();
      loading = false;
      pending = false;
      
      // After streaming completes, fetch the conversation to get the real message IDs
      await updateLastMessageId();
    }
  }

  // Handle stop generation
  function stopGeneration() {
    if (conversationId) {
      fetch(`${base}/conversation/${conversationId}/stop-generating`, { method: "POST" })
        .catch(console.error);
    }
    loading = false;
  }

  // Handle retry
  async function retryMessage(event: CustomEvent<{ id: Message["id"]; content?: string }>) {
    const { id, content } = event.detail;
    const messageIndex = messages.findIndex(m => m.id === id);
    
    if (messageIndex >= 0) {
      // Remove this message and all after it
      messages = messages.slice(0, messageIndex);
      
      // Resend the message
      await sendMessage(content || messages[messageIndex - 1]?.content || '');
    }
  }

  // Handle continue
  async function continueMessage(event: CustomEvent<{ id: Message["id"] }>) {
    const lastMessage = messages.at(-1);
    if (lastMessage?.from === 'assistant') {
      await sendMessage('Continue from where you left off.');
    }
  }

</script>

<svelte:head>
  <title>Classroom Study - Interactive Learning</title>
</svelte:head>

<div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
  <!-- Header -->
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div class="px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <a href="{base}/classroom" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          ← Back
        </a>
        <div class="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <CarbonDocument class="w-5 h-5" />
          Classroom Study
        </h1>
      </div>
      
      {#if !documentFile}
        <button
          onclick={() => fileInput?.click()}
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <CarbonUpload class="w-4 h-4" />
          Upload Document
        </button>
        <input
          bind:this={fileInput}
          type="file"
          accept=".pdf,.md,.html,.txt,text/plain,text/markdown,text/html,application/pdf"
          onchange={handleFileUpload}
          class="hidden"
        />
      {:else}
        <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <CarbonDocument class="w-4 h-4" />
          {documentFile.name}
          <span class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded uppercase">
            {documentFormat}
          </span>
        </div>
      {/if}
    </div>
  </header>

  <!-- Main Content -->
  <div class="flex-1 flex overflow-hidden">
    {#if documentFile}
      <!-- Split View -->
      <div class="flex-1 flex">
        <!-- Document Viewer (Left) -->
        <div class="w-1/2 border-r border-gray-200 dark:border-gray-700">
          {#if documentFormat === 'pdf'}
            {#if browser}
              <InteractivePDFViewer 
                pdfUrl={documentUrl}
                on:textSelected={handleTextSelected}
                on:highlightAdded={(e) => console.log('Highlight added:', e.detail)}
              />
            {:else}
              <div class="flex items-center justify-center h-full">
                <div class="text-center">
                  <p class="text-gray-600 dark:text-gray-400">Loading PDF viewer...</p>
                </div>
              </div>
            {/if}
          {:else}
            <DocumentViewer 
              content={documentContent}
              format={documentFormat}
              title={documentFile.name}
              on:textSelected={handleTextSelected}
              on:highlightAdded={(e) => console.log('Highlight added:', e.detail)}
            />
          {/if}
        </div>

        <!-- Chat Panel (Right) -->
        <div class="w-1/2">
          <ClassroomChat
            {messages}
            {loading}
            {pending}
            {currentModel}
            models={data.models}
            bind:files
            bind:selectedPdfText={selectedText}
            bind:pdfContext={textContext}
            on:message={(e) => sendMessage(e.detail)}
            on:stop={stopGeneration}
            on:retry={retryMessage}
            on:continue={continueMessage}
          />
        </div>
      </div>
    {:else}
      <!-- Empty State -->
      <div class="flex-1 flex items-center justify-center">
        <div class="text-center max-w-md">
          <div class="mb-6">
            <div class="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <CarbonDocument class="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Start Your Study Session
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Upload a document to begin an interactive study session with AI assistance. Supports PDF, Markdown, HTML, and Text files.
          </p>
          <button
            onclick={() => fileInput?.click()}
            class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <CarbonUpload class="w-5 h-5" />
            Upload Document
          </button>
          <input
            bind:this={fileInput}
            type="file"
            accept=".pdf,.md,.html,.txt,text/plain,text/markdown,text/html,application/pdf"
            onchange={handleFileUpload}
            class="hidden"
          />
          
          <div class="mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p class="font-medium mb-2">Features:</p>
            <ul class="text-left space-y-1 max-w-xs mx-auto">
              <li>• Support for PDF, Markdown, HTML, and Text files</li>
              <li>• Highlight and discuss specific passages</li>
              <li>• Ask questions about the content</li>
              <li>• Get summaries and explanations</li>
              <li>• Generate practice questions</li>
              <li>• Perfect text selection (non-PDF formats)</li>
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
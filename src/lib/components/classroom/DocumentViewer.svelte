<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import DOMPurify from 'dompurify';
  import { processTokensSync, type Token } from '$lib/utils/marked';
  import type { WebSearchSource } from '$lib/types/WebSearch';
  import 'katex/dist/katex.min.css';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import CarbonChat from '~icons/carbon/chat';
  import CarbonDocument from '~icons/carbon/document';
  import CarbonHighlight from '~icons/carbon/text-highlight';
  import CarbonZoomIn from '~icons/carbon/zoom-in';
  import CarbonZoomOut from '~icons/carbon/zoom-out';
  import CarbonZoomReset from '~icons/carbon/zoom-reset';

  interface Props {
    content: string;
    format: 'markdown' | 'html' | 'text' | 'pdf';
    title?: string;
  }

  let { content, format, title = 'Study Material' }: Props = $props();

  let contentContainer: HTMLDivElement;
  let selectedText = $state('');
  let highlights = $state<Array<{
    id: string;
    text: string;
    range: Range;
    element?: HTMLElement;
  }>>([]);
  let showSelectionPopup = $state(false);
  let popupPosition = $state({ x: 0, y: 0 });
  let fontSize = $state(16);

  const dispatch = createEventDispatcher<{
    textSelected: { text: string };
    highlightAdded: { text: string, id: string };
  }>();

  // Store original content for LaTeX preservation
  let originalContent = $state(content);
  
  // Update original content when content prop changes
  $effect(() => {
    originalContent = content;
  });
  
  // Process content with KaTeX math support
  let formattedContent = $derived(() => {
    switch (format) {
      case 'markdown':
        // Use the same KaTeX-enabled markdown processor as main chat
        const processedTokens = processTokensSync(content, []);
        
        // Convert tokens to HTML string, preserving LaTeX sources
        const htmlParts = processedTokens.map(token => {
          if (token.type === 'code') {
            // For code blocks, we'll render them inline since we can't use Svelte components in derived HTML
            return `<pre><code class="language-${token.lang}">${token.code}</code></pre>`;
          } else {
            return token.html;
          }
        });
        
        let rawHtml = htmlParts.join('');
        
        // Before sanitizing, preserve LaTeX sources in the HTML by wrapping KaTeX elements
        rawHtml = rawHtml.replace(
          /<span class="katex">(.+?)<\/span>/g, 
          (match, katexContent) => {
            // Find the original LaTeX in the source content that corresponds to this KaTeX
            return match; // Keep the KaTeX as-is for now, we'll handle extraction differently
          }
        );
        
        // Sanitize HTML for security, allowing KaTeX classes and styles and data attributes
        return DOMPurify.sanitize(rawHtml, {
          ADD_ATTR: ['target', 'rel', 'class', 'style', 'data-latex'],
          ADD_TAGS: ['style'],
          ALLOW_DATA_ATTR: true
        });
      
      case 'html':
        return DOMPurify.sanitize(content);
      
      case 'text':
        // Convert plain text to HTML with paragraph breaks
        return content
          .split(/\n\n+/)
          .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
          .join('');
      
      default:
        return content;
    }
  });

  onMount(() => {
    // Add event listeners for text selection
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
    };
  });

  // Extract original LaTeX from selection
  function getOriginalTextFromSelection(selection: Selection): string {
    if (!selection.rangeCount) return '';
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // If selection contains KaTeX elements, try to recover original LaTeX
    if (contentContainer?.contains(container)) {
      const selectedText = selection.toString().trim();
      
      // Try to map back to original LaTeX if format is markdown
      if (format === 'markdown') {
        // Simple approach: extract numbers from selected text and find matching LaTeX
        const selectedNumbers = selectedText.match(/\d+\.?\d*/g) || [];
        console.log('Extracted numbers from selection:', selectedNumbers);
        
        if (selectedNumbers.length >= 3) { // If we have multiple numbers, likely a math expression
          // Find LaTeX expressions in original content
          const latexRegex = /\\\((.*?)\\\)|\\\[(.*?)\\\]|\$\$(.*?)\$\$|\$([^$]*)\$/g;
          const latexMatches = [...originalContent.matchAll(latexRegex)];
          
          // Look for LaTeX that contains all the numbers we found
          for (const match of latexMatches) {
            const latexSource = match[0];
            const latexNumbers = latexSource.match(/\d+\.?\d*/g) || [];
            
            // Check if this LaTeX contains most of our numbers
            const matchingNumbers = selectedNumbers.filter(num => latexNumbers.includes(num));
            if (matchingNumbers.length >= Math.min(3, selectedNumbers.length)) {
              console.log('Direct number match found:', latexSource, 'matching numbers:', matchingNumbers);
              return latexSource;
            }
          }
        }
        
        return recoverOriginalLatex(selectedText, range);
      }
      
      return selectedText;
    }
    
    return '';
  }
  
  // Function to recover original LaTeX from selected rendered content
  function recoverOriginalLatex(selectedText: string, range: Range): string {
    try {
      // Get all elements in the selection
      const walker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: function(node) {
            if (range.intersectsNode(node)) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          }
        }
      );
      
      let result = selectedText;
      let node;
      const latexElements: HTMLElement[] = [];
      
      // Find all KaTeX elements in the selection
      while (node = walker.nextNode()) {
        if (node instanceof HTMLElement && node.classList.contains('katex')) {
          latexElements.push(node);
        }
      }
      
      // If we found KaTeX elements, try to recover original LaTeX
      if (latexElements.length > 0) {
        // Find LaTeX expressions in original content - comprehensive regex
        const latexRegex = /\\\((.*?)\\\)|\\\[(.*?)\\\]|\$\$(.*?)\$\$|\$([^$]*)\$/g;
        const latexMatches = [...originalContent.matchAll(latexRegex)];
        
        console.log('Found KaTeX elements:', latexElements.length);
        console.log('Found LaTeX matches in original:', latexMatches.length);
        
        // For each KaTeX element, try to find corresponding original LaTeX
        for (const katexEl of latexElements) {
          const renderedText = katexEl.textContent || '';
          console.log('KaTeX rendered text:', JSON.stringify(renderedText));
          
          // Try to find a matching LaTeX expression
          // This is a heuristic approach - we look for LaTeX that might render to similar text
          for (const match of latexMatches) {
            const latexSource = match[0];
            console.log('Checking LaTeX source:', latexSource);
            
            // Simple heuristic: if the LaTeX contains similar numbers/operators as rendered text
            if (containsSimilarContent(renderedText, latexSource)) {
              console.log('Found matching LaTeX:', latexSource, 'for rendered:', renderedText);
              // Replace the rendered math text with original LaTeX in the result
              const katexText = katexEl.textContent || '';
              if (result.includes(katexText)) {
                result = result.replace(katexText, latexSource);
                console.log('Replaced in result:', result);
                break;
              }
            }
          }
        }
      }
      
      return result;
    } catch (e) {
      console.warn('Failed to recover original LaTeX:', e);
      return selectedText;
    }
  }
  
  // Helper function to check if rendered text might come from a LaTeX source
  function containsSimilarContent(renderedText: string, latexSource: string): boolean {
    console.log('Comparing rendered:', JSON.stringify(renderedText), 'with LaTeX:', latexSource);
    
    // Extract numbers, operators, and specific characters from both
    const getTokens = (text: string) => {
      const matches = text.match(/[\d+\-*/=.()×÷]/g) || [];
      // Also get sequences of digits with decimals
      const numbers = text.match(/\d+\.?\d*/g) || [];
      return [...matches, ...numbers];
    };
    
    const renderedTokens = getTokens(renderedText);
    const latexTokens = getTokens(latexSource);
    
    console.log('Rendered tokens:', renderedTokens);
    console.log('LaTeX tokens:', latexTokens);
    
    // If more than 60% of tokens match, consider it a match
    if (renderedTokens.length === 0 && latexTokens.length === 0) return false;
    
    const matchingTokens = renderedTokens.filter(token => latexTokens.includes(token)).length;
    const maxTokens = Math.max(renderedTokens.length, latexTokens.length);
    
    const similarity = maxTokens > 0 ? (matchingTokens / maxTokens) : 0;
    console.log('Similarity score:', similarity, 'matching tokens:', matchingTokens, 'max tokens:', maxTokens);
    
    return similarity > 0.6;
  }

  function handleTextSelection(event: MouseEvent | TouchEvent) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      showSelectionPopup = false;
      return;
    }

    if (!contentContainer?.contains(selection.anchorNode)) {
      showSelectionPopup = false;
      return;
    }

    // Use the enhanced text extraction that preserves LaTeX
    const selected = getOriginalTextFromSelection(selection);
    if (!selected) {
      showSelectionPopup = false;
      return;
    }

    selectedText = selected;
    
    // Get selection coordinates for popup
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    popupPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    };
    
    showSelectionPopup = true;
  }

  function addToChat() {
    if (!selectedText) return;
    
    dispatch('textSelected', { text: selectedText });
    
    // Create highlight
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const highlightId = `highlight-${Date.now()}`;
      
      // Create highlight span
      const highlightSpan = document.createElement('mark');
      highlightSpan.className = 'text-highlight';
      highlightSpan.dataset.highlightId = highlightId;
      
      try {
        range.surroundContents(highlightSpan);
        
        highlights = [...highlights, {
          id: highlightId,
          text: selectedText,
          range: range.cloneRange(),
          element: highlightSpan
        }];
        
        dispatch('highlightAdded', { text: selectedText, id: highlightId });
      } catch (e) {
        // If surroundContents fails (e.g., selection spans multiple elements)
        // Extract and wrap contents manually
        const contents = range.extractContents();
        highlightSpan.appendChild(contents);
        range.insertNode(highlightSpan);
        
        highlights = [...highlights, {
          id: highlightId,
          text: selectedText,
          range: range.cloneRange(),
          element: highlightSpan
        }];
        
        dispatch('highlightAdded', { text: selectedText, id: highlightId });
      }
    }
    
    // Clear selection
    selection?.removeAllRanges();
    selectedText = '';
    showSelectionPopup = false;
  }

  function removeHighlight(id: string) {
    const highlight = highlights.find(h => h.id === id);
    if (highlight?.element) {
      // Replace highlight element with its text content
      const parent = highlight.element.parentNode;
      if (parent) {
        const text = document.createTextNode(highlight.element.textContent || '');
        parent.replaceChild(text, highlight.element);
      }
    }
    highlights = highlights.filter(h => h.id !== id);
  }

  function adjustFontSize(delta: number) {
    fontSize = Math.max(12, Math.min(24, fontSize + delta));
  }

  function resetFontSize() {
    fontSize = 16;
  }
</script>

<div class="flex flex-col h-full bg-white dark:bg-gray-900">
  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
    <div class="flex items-center gap-2">
      <CarbonDocument class="w-5 h-5 text-blue-600 dark:text-blue-400" />
      <h2 class="font-semibold text-gray-900 dark:text-white">{title}</h2>
    </div>
    
    <!-- Font Size Controls -->
    <div class="flex items-center gap-2">
      <button
        onclick={() => adjustFontSize(-2)}
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Decrease font size"
      >
        <CarbonZoomOut class="w-4 h-4" />
      </button>
      
      <button
        onclick={resetFontSize}
        class="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Reset font size"
      >
        {fontSize}px
      </button>
      
      <button
        onclick={() => adjustFontSize(2)}
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Increase font size"
      >
        <CarbonZoomIn class="w-4 h-4" />
      </button>
    </div>
  </div>

  <!-- Content Area -->
  <div class="flex-1 overflow-auto">
    <div 
      bind:this={contentContainer}
      class="prose prose-lg dark:prose-invert max-w-none px-8 py-6 select-text"
      style="font-size: {fontSize}px; line-height: 1.6;"
    >
      {#if format === 'pdf'}
        <!-- Keep PDF viewer as fallback -->
        <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
          <p class="text-yellow-800 dark:text-yellow-200">
            PDF format detected. For better text selection, consider using Markdown or HTML format.
          </p>
        </div>
      {/if}
      
      <!-- Render formatted content with math support -->
      {@html formattedContent()}
    </div>
  </div>

  <!-- Highlights Sidebar -->
  {#if highlights.length > 0}
    <div class="absolute right-4 top-20 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-h-96 overflow-y-auto">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-1">
          <CarbonHighlight class="w-4 h-4" />
          Highlights ({highlights.length})
        </h3>
      </div>
      
      <div class="space-y-2">
        {#each highlights as highlight}
          <div class="group relative p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
            <p class="text-gray-700 dark:text-gray-300 pr-6 line-clamp-3">
              "{highlight.text}"
            </p>
            <button
              onclick={() => removeHighlight(highlight.id)}
              class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              aria-label="Remove highlight"
            >
              ×
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Selection Popup -->
  {#if showSelectionPopup && selectedText}
    <div 
      class="fixed z-50 transform -translate-x-1/2 -translate-y-full"
      style="left: {popupPosition.x}px; top: {popupPosition.y}px;"
    >
      <div class="bg-gray-900 text-white rounded-lg shadow-xl p-2 flex items-center gap-2">
        <span class="text-xs max-w-[200px] truncate">
          "{selectedText}"
        </span>
        <button
          onclick={addToChat}
          class="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium"
        >
          <CarbonChat class="w-3 h-3" />
          Add to Chat
        </button>
      </div>
      <div class="absolute left-1/2 transform -translate-x-1/2 top-full">
        <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900"></div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Ensure text is selectable */
  .select-text {
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
  }

  /* Highlight styles */
  :global(.text-highlight) {
    background-color: rgba(254, 240, 138, 0.5);
    padding: 0 2px;
    border-radius: 2px;
    transition: background-color 0.2s;
  }

  :global(.text-highlight:hover) {
    background-color: rgba(254, 240, 138, 0.8);
  }

  /* Dark mode highlight */
  :global(.dark .text-highlight) {
    background-color: rgba(254, 240, 138, 0.2);
  }

  :global(.dark .text-highlight:hover) {
    background-color: rgba(254, 240, 138, 0.3);
  }

  /* Line clamp utility */
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Prose customization for better readability */
  .prose :global(h1),
  .prose :global(h2),
  .prose :global(h3) {
    position: relative;
    scroll-margin-top: 80px;
  }

  .prose :global(p) {
    margin-bottom: 1em;
  }

  .prose :global(ul),
  .prose :global(ol) {
    padding-left: 1.5em;
  }

  .prose :global(blockquote) {
    border-left: 4px solid #e5e7eb;
    padding-left: 1em;
    margin-left: 0;
    font-style: italic;
  }

  :global(.dark) .prose :global(blockquote) {
    border-left-color: #4b5563;
  }

  .prose :global(code) {
    background-color: #f3f4f6;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875em;
  }

  :global(.dark) .prose :global(code) {
    background-color: #374151;
  }

  .prose :global(pre) {
    background-color: #1f2937;
    color: #f9fafb;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
  }

  /* KaTeX math rendering styles */
  .prose :global(.katex) {
    font-size: 1em;
  }

  .prose :global(.katex-display) {
    margin: 1em 0;
    text-align: center;
  }

  .prose :global(.katex-display > .katex) {
    display: block;
    white-space: nowrap;
    overflow-x: auto;
  }

  /* Make math expressions selectable like regular text */
  .prose :global(.katex) {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
  }

  .prose :global(.katex *) {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
  }
</style>
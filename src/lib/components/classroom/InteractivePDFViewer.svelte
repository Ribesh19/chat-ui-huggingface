<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import * as pdfjsLib from 'pdfjs-dist';
  import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
  // Import the worker as a URL
  import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
  import CarbonAdd from '~icons/carbon/add';
  import CarbonSubtract from '~icons/carbon/subtract';
  import CarbonFitToScreen from '~icons/carbon/fit-to-screen';
  import CarbonChevronLeft from '~icons/carbon/chevron-left';
  import CarbonChevronRight from '~icons/carbon/chevron-right';
  import CarbonChat from '~icons/carbon/chat';

  interface Props {
    pdfUrl: string;
    initialPage?: number;
  }

  let { pdfUrl, initialPage = 1 }: Props = $props();

  let pdfDoc: PDFDocumentProxy | null = $state(null);
  let currentPage = $state(initialPage);
  let totalPages = $state(0);
  let scale = $state(1.5);
  let canvas: HTMLCanvasElement;
  let textLayer: HTMLDivElement;
  let pdfContainer: HTMLDivElement;
  let selectedText = $state('');
  let highlights = $state<Array<{id: string, page: number, text: string, rects: DOMRect[]}>>([]);
  let isSelecting = $state(false);
  let renderTask: any = null;
  let isRendering = $state(false);

  const dispatch = createEventDispatcher<{
    textSelected: { text: string, page: number };
    highlightAdded: { text: string, page: number };
  }>();

  // Configure PDF.js worker
  onMount(() => {
    // Use the locally imported worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
    if (pdfUrl) {
      loadPdf();
    }
  });

  // Cleanup on unmount
  onDestroy(() => {
    if (renderTask) {
      renderTask.cancel();
    }
    if (pdfDoc) {
      pdfDoc.destroy();
    }
  });

  async function loadPdf() {
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      pdfDoc = await loadingTask.promise;
      totalPages = pdfDoc.numPages;
      await renderPage(currentPage);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }

  async function renderPage(pageNum: number) {
    if (!pdfDoc || isRendering) return;

    // Cancel any existing render task
    if (renderTask) {
      try {
        await renderTask.cancel();
      } catch (e) {
        // Ignore cancellation errors
      }
      renderTask = null;
    }

    isRendering = true;

    try {
      const page: PDFPageProxy = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Set canvas dimensions
      const context = canvas.getContext('2d');
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      renderTask = page.render(renderContext);
      await renderTask.promise;
      renderTask = null;

      // Render text layer for selection
      await renderTextLayer(page, viewport);
      
      // Re-apply highlights for current page
      applyHighlights();
    } catch (error) {
      if (error.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', error);
      }
    } finally {
      isRendering = false;
    }
  }

  async function renderTextLayer(page: PDFPageProxy, viewport: any) {
    // Clear previous text layer
    textLayer.innerHTML = '';
    
    // Get text content
    const textContent = await page.getTextContent();
    
    // Set text layer dimensions
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;
    
    // Create text fragments
    textContent.items.forEach((item: any) => {
      if (!item.str) return;
      
      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const span = document.createElement('span');
      span.textContent = item.str;
      span.style.position = 'absolute';
      span.style.left = `${tx[4]}px`;
      span.style.top = `${viewport.height - tx[5] - item.height}px`;
      span.style.fontSize = `${Math.abs(tx[0])}px`;
      span.style.fontFamily = item.fontName || 'sans-serif';
      span.style.transform = `scaleX(${tx[0] / Math.abs(tx[0])})`;
      
      textLayer.appendChild(span);
    });
  }

  function handleTextSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const selected = selection.toString().trim();
    if (selected) {
      selectedText = selected;
      isSelecting = true;
    }
  }

  function addToChat() {
    if (selectedText) {
      dispatch('textSelected', { text: selectedText, page: currentPage });
      
      // Add to highlights
      const highlightId = `highlight-${Date.now()}`;
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rects = Array.from(range.getClientRects());
        
        highlights = [...highlights, {
          id: highlightId,
          page: currentPage,
          text: selectedText,
          rects: rects
        }];
      }
      
      // Clear selection
      selection?.removeAllRanges();
      selectedText = '';
      isSelecting = false;
      
      // Re-render to show highlight
      applyHighlights();
    }
  }

  function applyHighlights() {
    // Remove existing highlight elements
    const existingHighlights = pdfContainer?.querySelectorAll('.pdf-highlight');
    existingHighlights?.forEach(el => el.remove());
    
    // Add highlights for current page
    highlights
      .filter(h => h.page === currentPage)
      .forEach(highlight => {
        highlight.rects.forEach(rect => {
          const highlightDiv = document.createElement('div');
          highlightDiv.className = 'pdf-highlight';
          highlightDiv.style.position = 'absolute';
          highlightDiv.style.left = `${rect.left}px`;
          highlightDiv.style.top = `${rect.top}px`;
          highlightDiv.style.width = `${rect.width}px`;
          highlightDiv.style.height = `${rect.height}px`;
          highlightDiv.style.backgroundColor = 'rgba(255, 235, 59, 0.4)';
          highlightDiv.style.pointerEvents = 'none';
          highlightDiv.style.mixBlendMode = 'multiply';
          
          pdfContainer?.appendChild(highlightDiv);
        });
      });
  }

  function changePage(delta: number) {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
      currentPage = newPage;
      renderPage(currentPage);
    }
  }

  function changeScale(delta: number) {
    const newScale = Math.max(0.5, Math.min(3, scale + delta));
    scale = newScale;
    renderPage(currentPage);
  }

  function fitToScreen() {
    if (!canvas || !pdfContainer) return;
    const containerWidth = pdfContainer.clientWidth - 40;
    const currentWidth = canvas.width;
    scale = (containerWidth / currentWidth) * scale;
    renderPage(currentPage);
  }

</script>

<div class="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
  <!-- PDF Controls -->
  <div class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div class="flex items-center gap-2">
      <button
        onclick={() => changePage(-1)}
        disabled={currentPage <= 1}
        class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <CarbonChevronLeft />
      </button>
      
      <span class="text-sm font-medium px-2">
        Page {currentPage} / {totalPages}
      </span>
      
      <button
        onclick={() => changePage(1)}
        disabled={currentPage >= totalPages}
        class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <CarbonChevronRight />
      </button>
    </div>

    <div class="flex items-center gap-2">
      <button
        onclick={() => changeScale(-0.25)}
        class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Zoom out"
      >
        <CarbonSubtract />
      </button>
      
      <span class="text-sm font-medium px-2 min-w-[60px] text-center">
        {Math.round(scale * 100)}%
      </span>
      
      <button
        onclick={() => changeScale(0.25)}
        class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Zoom in"
      >
        <CarbonAdd />
      </button>
      
      <button
        onclick={fitToScreen}
        class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Fit to screen"
      >
        <CarbonFitToScreen />
      </button>
    </div>
  </div>

  <!-- PDF Viewer -->
  <div 
    bind:this={pdfContainer}
    class="flex-1 overflow-auto relative bg-gray-100 dark:bg-gray-950"
  >
    <div class="relative mx-auto my-4" style="width: fit-content;">
      <canvas
        bind:this={canvas}
        class="shadow-lg relative"
        style="display: block;"
      />
      <div
        bind:this={textLayer}
        class="text-layer"
        onmouseup={handleTextSelection}
        ontouchend={handleTextSelection}
      />
    </div>
  </div>

  <!-- Selection Popup -->
  {#if isSelecting && selectedText}
    <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center gap-2">
        <span class="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
          "{selectedText}"
        </span>
        <button
          onclick={addToChat}
          class="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          <CarbonChat class="w-4 h-4" />
          Add to Chat
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Text layer styles for proper text selection */
  .text-layer {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    line-height: 1;
    z-index: 2;
  }

  .text-layer :global(span) {
    color: transparent;
    position: absolute;
    white-space: pre;
    cursor: text;
    transform-origin: 0% 0%;
  }

  /* Show selection with visible highlight */
  .text-layer :global(span)::selection {
    background: rgba(0, 100, 200, 0.3);
  }

  .text-layer :global(span)::-moz-selection {
    background: rgba(0, 100, 200, 0.3);
  }

  /* Make sure canvas doesn't interfere with selection */
  canvas {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    pointer-events: none;
  }
  
  /* Make text layer interactive */
  .text-layer {
    pointer-events: auto;
  }
  
  :global(.pdf-highlight) {
    transition: background-color 0.3s ease;
    pointer-events: none;
  }
  
  :global(.pdf-highlight:hover) {
    background-color: rgba(255, 235, 59, 0.6) !important;
  }
</style>
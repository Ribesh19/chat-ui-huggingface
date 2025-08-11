<script lang="ts">
  import { onMount } from 'svelte';
  import katex from 'katex';

  interface Props {
    content: string;
    inline?: boolean;
  }

  let { content, inline = false }: Props = $props();
  let mathElement: HTMLElement;

  onMount(() => {
    renderMath();
  });

  $effect(() => {
    renderMath();
  });

  function renderMath() {
    if (!mathElement) return;
    
    try {
      // Process the content to handle different math notation formats
      let processedContent = content;
      
      // Handle inline math with \( ... \) or $ ... $
      processedContent = processedContent.replace(/\\\((.*?)\\\)/g, (match, math) => {
        try {
          return katex.renderToString(math, { displayMode: false });
        } catch (err) {
          console.warn('KaTeX rendering error for inline math:', err);
          return match;
        }
      });
      
      // Handle display math with \[ ... \] or $$ ... $$
      processedContent = processedContent.replace(/\\\[(.*?)\\\]/g, (match, math) => {
        try {
          return katex.renderToString(math, { displayMode: true });
        } catch (err) {
          console.warn('KaTeX rendering error for display math:', err);
          return match;
        }
      });
      
      // Handle span with math-tex class - be more flexible with the format
      processedContent = processedContent.replace(/<span[^>]*class="math-tex"[^>]*>\\?\((.*?)\\?\)<\/span>/g, (match, math) => {
        try {
          return katex.renderToString(math, { displayMode: false });
        } catch (err) {
          console.warn('KaTeX rendering error for math-tex span:', err, 'Original:', match);
          return match;
        }
      });
      
      // Handle dollar sign notation $ ... $
      if (!processedContent.includes('<span class="katex">')) {
        processedContent = processedContent.replace(/\$([^$]+)\$/g, (match, math) => {
          try {
            return katex.renderToString(math, { displayMode: false });
          } catch (err) {
            console.warn('KaTeX rendering error for $ notation:', err);
            return match;
          }
        });
      }
      
      mathElement.innerHTML = processedContent;
    } catch (error) {
      console.error('Math rendering error:', error);
      mathElement.innerHTML = content; // Fallback to original content
    }
  }
</script>

<div bind:this={mathElement} class="math-content">
  {content}
</div>

<style>
  :global(.katex) {
    font-size: 1.1em;
  }
  
  :global(.katex-display) {
    margin: 1em 0;
    text-align: center;
  }
  
  .math-content :global(.katex .frac-line) {
    border-bottom-width: 0.04em;
  }
  
  .math-content :global(.katex .frac) {
    vertical-align: 0.05em;
  }
</style>
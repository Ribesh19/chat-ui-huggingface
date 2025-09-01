<script lang="ts">
  import { onMount } from 'svelte';
  
  let loaded = $state(false);
  
  onMount(() => {
    // Only load if not already available
    if (typeof window !== 'undefined' && (window as any).MathQuill) {
      loaded = true;
      return;
    }

    // Load jQuery first if not available
    if (typeof window !== 'undefined' && !(window as any).jQuery) {
      const jQueryScript = document.createElement('script');
      jQueryScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js';
      jQueryScript.async = true;
      jQueryScript.onload = loadMathQuill;
      document.body.appendChild(jQueryScript);
    } else {
      loadMathQuill();
    }

    // Load MathQuill
    function loadMathQuill() {
      const mathQuillCSS = document.createElement('link');
      mathQuillCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/mathquill.min.css';
      mathQuillCSS.rel = 'stylesheet';
      document.head.appendChild(mathQuillCSS);

      const mathQuillScript = document.createElement('script');
      mathQuillScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/mathquill.min.js';
      mathQuillScript.async = true;
      mathQuillScript.onload = () => {
        loaded = true;
      };
      document.body.appendChild(mathQuillScript);
    }
  });
</script>

{#if loaded}
  <slot />
{:else}
  <div>Loading math editor...</div>
{/if}
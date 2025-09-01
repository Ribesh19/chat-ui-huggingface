<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  interface Props {
    latex?: string;
    onChange?: (latex: string) => void;
    mathFieldRef?: { current: any };
    onMathQuillMount?: (mq: any) => void;
  }
  
  let { latex = '', onChange, mathFieldRef, onMathQuillMount }: Props = $props();
  
  let containerRef: HTMLSpanElement;
  let mqRef: any = null;
  
  onMount(() => {
    // Initialize MathQuill when the component mounts
    if (typeof window !== 'undefined' && containerRef) {
      // Check if MathQuill is available
      if ((window as any).MathQuill) {
        const MQ = (window as any).MathQuill.getInterface(2);
        
        // Create a MathQuill math field
        mqRef = MQ.MathField(containerRef, {
          spaceBehavesLikeTab: true,
          handlers: {
            edit: () => {
              // Call onChange with the new LaTeX representation
              if (onChange && mqRef) {
                onChange(mqRef.latex());
              }
            },
            enter: () => {
              // Handle enter key if needed
            }
          }
        });
        
        // Set initial content if provided
        if (latex) {
          mqRef.latex(latex);
        }
        
        // Provide the mathfield to parent component if needed
        if (mathFieldRef) {
          mathFieldRef.current = mqRef;
        }
        
        // Call onMathQuillMount callback if provided
        if (onMathQuillMount) {
          onMathQuillMount(mqRef);
        }
      } else {
        console.error('MathQuill is not available. Please make sure it is loaded.');
      }
    }
    
    return () => {
      if (mqRef) {
        // Clean up if needed
      }
    };
  });

  onDestroy(() => {
    if (mqRef) {
      // Clean up MathQuill instance
    }
  });

  // Update latex when prop changes
  $effect(() => {
    if (mqRef && latex !== undefined) {
      const currentLatex = mqRef.latex();
      if (currentLatex !== latex) {
        mqRef.latex(latex);
      }
    }
  });
</script>

<span bind:this={containerRef} class="math-field"></span>

<style>
  .math-field {
    display: inline-block;
    vertical-align: middle;
    min-height: 20px;
    margin: 4px;
    padding: 2px;
    border-radius: 2px;
    background-color: rgba(252, 252, 252, 0.9);
    position: relative;
  }
</style>
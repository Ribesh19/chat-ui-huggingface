<script lang="ts">
  import { onMount } from 'svelte';
  import MathQuillLoader from './MathQuillLoader.svelte';
  import MathField from './MathField.svelte';
  import MathKeypad from './MathKeypad.svelte';
  import MathKeypadIcons from './MathKeypadIcons.svelte';
  
  interface Props {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
  }
  
  let { value = '', onChange, placeholder = 'Type your message...', disabled = false }: Props = $props();
  
  let text = $state(value || '');
  let showKeypad = $state(false);
  let mathMode = $state(false);
  let textareaRef: HTMLTextAreaElement;
  let mathFieldRef = { current: null as any };
  let mathQuillReady = $state(false);
  
  // Handle text input changes
  function handleTextChange(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    const newText = target.value;
    text = newText;
    if (onChange) {
      onChange(newText);
    }
  }
  
  // Handle math field changes
  function handleMathChange(latex: string) {
    text = latex;
    if (onChange) {
      onChange(latex);
    }
  }
  
  // Handle MathQuill mount
  function handleMathQuillMount(mq: any) {
    mathQuillReady = true;
  }
  
  // Toggle keypad and math mode
  function toggleKeypad() {
    if (mathMode) {
      // If already in math mode, exit math mode
      exitMathMode();
    } else {
      // Enter math mode
      showKeypad = true;
      mathMode = true;
    }
  }
  
  // Exit math mode
  function exitMathMode() {
    if (mathFieldRef.current) {
      const latex = mathFieldRef.current.latex();
      text = latex;
    }
    
    mathMode = false;
    showKeypad = false;
  }
  
  // If external value changes, update internal state
  $effect(() => {
    if (value !== undefined && value !== text) {
      text = value;
      
      // Update math field if in math mode
      if (mathMode && mathFieldRef.current) {
        mathFieldRef.current.latex(value || '');
      }
    }
  });
  
  $effect(() => {
    // If math mode is enabled but no MathQuill field loaded yet, 
    // set the latex value when it becomes ready
    if (mathMode && mathQuillReady && mathFieldRef.current) {
      mathFieldRef.current.latex(text || '');
    }
  });
  
  // Focus textarea when switching from math mode to text mode
  $effect(() => {
    if (!mathMode && textareaRef) {
      textareaRef.focus();
    }
  });
</script>

<MathQuillLoader>
  <div class="math-input-container">
    <div class="input-wrapper">
      {#if mathMode}
        <div class="math-input-container-inner">
          <button class="exit-math-button" onclick={exitMathMode} title="Exit Math Mode">
            ×
          </button>
          <MathField
            latex={text}
            onChange={handleMathChange}
            {mathFieldRef}
            onMathQuillMount={handleMathQuillMount}
          />
        </div>
      {:else}
        <textarea
          bind:this={textareaRef}
          bind:value={text}
          oninput={handleTextChange}
          {placeholder}
          {disabled}
          class="styled-textarea"
          rows="1"
        />
      {/if}
      
      <!-- Math Toggle Button -->
      <div class="controls">
        <button
          onclick={toggleKeypad}
          {disabled}
          type="button"
          title={mathMode ? "Exit Math Mode" : "Math Keys"}
          class="icon-button"
          class:active={mathMode}
        >
          <MathKeypadIcons iconType="keypad" />
          {#if mathMode}
            <span class="math-mode-indicator">∑</span>
          {/if}
        </button>
      </div>
      
      {#if showKeypad}
        <MathKeypad
          onInsert={({ type, symbol }) => {
            if (mathMode && mathFieldRef.current) {
              const mq = mathFieldRef.current;
              if (type === 'backspace') {
                mq.keystroke('Backspace');
              } else if (type === 'insert') {
                // Special handling for different symbols
                if (/^\d$/.test(symbol)) {
                  // Numbers
                  mq.cmd(symbol);
                } else if (symbol === '.') {
                  // Decimal point
                  mq.write('.');
                } else if (symbol === '\\frac{}{}') {
                  // Fraction
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
                
                mq.focus();
              }
            }
          }}
          onClose={() => showKeypad = false}
        />
      {/if}
    </div>
  </div>
</MathQuillLoader>

<style>
  .math-input-container {
    width: 100%;
    position: relative;
    font-family: inherit;
  }
  
  .input-wrapper {
    position: relative;
    width: 100%;
    border-radius: 12px;
    background-color: transparent;
  }
  
  .styled-textarea {
    width: 100%;
    padding: 18px 60px 18px 24px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    line-height: 1.6;
    min-height: 60px;
    resize: none;
    background-color: transparent;
    color: inherit;
    font-family: inherit;
    transition: none;
    box-sizing: border-box;
    overflow-y: auto;
  }
  
  .styled-textarea:focus {
    outline: none;
    box-shadow: none;
  }
  
  .styled-textarea::placeholder {
    color: #9ca3af;
    font-weight: 300;
  }
  
  .math-input-container-inner {
    width: 100%;
    min-height: 80px;
    padding: 16px 60px 16px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background-color: #f9fafb;
    position: relative;
    box-sizing: border-box;
  }
  
  .math-input-container-inner:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  .exit-math-button {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background-color: #ef4444;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    line-height: 1;
    z-index: 10;
    transition: background-color 0.2s;
  }
  
  .exit-math-button:hover {
    background-color: #dc2626;
  }
  
  .controls {
    position: absolute;
    right: 8px;
    bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f3f4f6;
    border: 1px solid #e5e7eb;
    cursor: pointer;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    color: #374151;
    transition: all 0.2s;
    position: relative;
  }
  
  .icon-button.active {
    background-color: #ede9fe;
    border-color: #c7d2fe;
    color: #7c3aed;
  }
  
  .icon-button:hover {
    background-color: #e5e7eb;
  }
  
  .icon-button.active:hover {
    background-color: #e0e7ff;
  }
  
  .icon-button:active {
    transform: scale(0.95);
  }
  
  .icon-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .icon-button :global(svg) {
    width: 18px;
    height: 18px;
  }
  
  .math-mode-indicator {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 14px;
    height: 14px;
    background-color: #7c3aed;
    border-radius: 50%;
    color: white;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }

  /* MathQuill field styles */
  :global(.math-field .mq-editable-field) {
    width: 100% !important;
    border: none !important;
    box-shadow: none !important;
    padding: 8px !important;
    background-color: transparent !important;
    border-radius: 8px;
    min-height: 40px;
    transition: background-color 0.2s;
  }
  
  :global(.math-field .mq-editable-field.mq-focused) {
    box-shadow: none !important;
    border: none !important;
    outline: none !important;
    background-color: rgba(59, 130, 246, 0.05) !important;
  }
  
  :global(.math-field .mq-root-block) {
    padding: 8px !important;
  }
  
  :global(.math-field .mq-cursor) {
    border-left: 2px solid #3b82f6 !important;
  }

  /* Dark mode support */
  :global(.dark) .styled-textarea::placeholder {
    color: #6b7280;
  }
  
  :global(.dark) .math-input-container-inner {
    background-color: #1f2937;
    border-color: #374151;
  }
  
  :global(.dark) .math-input-container-inner:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  
  :global(.dark) .icon-button {
    background-color: #374151;
    border-color: #4b5563;
    color: #d1d5db;
  }
  
  :global(.dark) .icon-button.active {
    background-color: #3730a3;
    border-color: #4f46e5;
    color: #e0e7ff;
  }
  
  :global(.dark) .icon-button:hover {
    background-color: #4b5563;
  }
  
  :global(.dark) .icon-button.active:hover {
    background-color: #4338ca;
  }
</style>
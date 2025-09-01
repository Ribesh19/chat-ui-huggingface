<script lang="ts">
  import MathKeypadIcons from './MathKeypadIcons.svelte';
  
  interface Props {
    onInsert: (data: { type: string; symbol: string }) => void;
    onClose: () => void;
  }
  
  let { onInsert, onClose }: Props = $props();
  
  let activeTab = $state('numbers');
  
  const numberKeys = [
    { label: '7', symbol: '7', type: 'insert' },
    { label: '8', symbol: '8', type: 'insert' },
    { label: '9', symbol: '9', type: 'insert' },
    { label: '÷', symbol: '\\div', type: 'insert' },
    { label: '(', symbol: '(', type: 'insert' },
    { label: ')', symbol: ')', type: 'insert' },
    
    { label: '4', symbol: '4', type: 'insert' },
    { label: '5', symbol: '5', type: 'insert' },
    { label: '6', symbol: '6', type: 'insert' },
    { label: '×', symbol: '\\times', type: 'insert' },
    { label: 'x²', symbol: '^2', type: 'insert' },
    { label: 'x³', symbol: '^3', type: 'insert' },
    
    { label: '1', symbol: '1', type: 'insert' },
    { label: '2', symbol: '2', type: 'insert' },
    { label: '3', symbol: '3', type: 'insert' },
    { label: '−', symbol: '-', type: 'insert' },
    { label: '√', symbol: '\\sqrt{}', type: 'insert' },
    { label: '⌫', symbol: 'backspace', type: 'backspace' },
    
    { label: '0', symbol: '0', type: 'insert' },
    { label: '.', symbol: '.', type: 'insert' },
    { label: '=', symbol: '=', type: 'insert' },
    { label: '+', symbol: '+', type: 'insert' },
    { label: 'a/b', symbol: '\\frac{}{}', type: 'insert' },
    { label: 'a b/c', symbol: '{}\\frac{}{}', type: 'insert' }
  ];
  
  const functionKeys = [
    { label: 'x', symbol: 'x', type: 'insert' },
    { label: 'y', symbol: 'y', type: 'insert' },
    { label: 'z', symbol: 'z', type: 'insert' },
    { label: 'sin', symbol: '\\sin', type: 'insert' },
    { label: 'cos', symbol: '\\cos', type: 'insert' },
    { label: 'tan', symbol: '\\tan', type: 'insert' },
    
    { label: 'a', symbol: 'a', type: 'insert' },
    { label: 'b', symbol: 'b', type: 'insert' },
    { label: 'c', symbol: 'c', type: 'insert' },
    { label: 'log', symbol: '\\log', type: 'insert' },
    { label: 'ln', symbol: '\\ln', type: 'insert' },
    { label: '|x|', symbol: '\\left|\\right|', type: 'insert' },
    
    { label: 'n', symbol: 'n', type: 'insert' },
    { label: 'm', symbol: 'm', type: 'insert' },
    { label: 'θ', symbol: '\\theta', type: 'insert' },
    { label: 'xⁿ', symbol: '^{}', type: 'insert' },
    { label: '≤', symbol: '\\leq', type: 'insert' },
    { label: '≥', symbol: '\\geq', type: 'insert' },
    
    { label: '∞', symbol: '\\infty', type: 'insert' },
    { label: '≠', symbol: '\\neq', type: 'insert' },
    { label: '±', symbol: '\\pm', type: 'insert' },
    { label: '°', symbol: '^\\circ', type: 'insert' },
    { label: '∴', symbol: '\\therefore', type: 'insert' },
    { label: '⌫', symbol: 'backspace', type: 'backspace' }
  ];
  
  let currentKeys = $derived(activeTab === 'numbers' ? numberKeys : functionKeys);
  
  function handleKeyClick(key: typeof numberKeys[0]) {
    onInsert({ type: key.type, symbol: key.symbol });
  }
</script>

<div class="keypad-container">
  <!-- Header -->
  <div class="keypad-header">
    <div class="tabs-container">
      <button 
        type="button"
        class="tab" 
        class:active={activeTab === 'numbers'}
        onclick={() => activeTab = 'numbers'}
      >
        Numbers
      </button>
      <button 
        type="button"
        class="tab" 
        class:active={activeTab === 'functions'}
        onclick={() => activeTab = 'functions'}
      >
        Algebra
      </button>
    </div>
    
    <button type="button" class="close-button" onclick={onClose} title="Close keypad">
      ×
    </button>
  </div>
  
  <!-- Keypad Grid -->
  <div class="keypad-grid">
    {#each currentKeys as key}
      <button 
        type="button"
        class="key-button"
        class:backspace={key.type === 'backspace'}
        onclick={() => handleKeyClick(key)}
        title={key.label}
      >
        {#if key.type === 'backspace'}
          <MathKeypadIcons iconType="backspace" />
        {:else}
          {@html key.label}
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .keypad-container {
    position: absolute;
    right: 0;
    bottom: calc(100% + 8px);
    width: 310px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 100;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }
  
  .keypad-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #e5e7eb;
    background-color: #f9fafb;
  }
  
  .tabs-container {
    display: flex;
    gap: 8px;
  }
  
  .tab {
    background-color: transparent;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: #6b7280;
    font-size: 14px;
    font-weight: 500;
  }
  
  .tab.active {
    background-color: #ddd6fe;
    color: #7c3aed;
  }
  
  .tab:hover {
    background-color: #f3f4f6;
  }
  
  .tab.active:hover {
    background-color: #ddd6fe;
  }
  
  .close-button {
    background-color: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    transition: background-color 0.2s;
  }
  
  .close-button:hover {
    background-color: #f3f4f6;
  }
  
  .keypad-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1px;
    background-color: #f9fafb;
    padding: 4px;
  }
  
  .key-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    border: 1px solid #e5e7eb;
    height: 40px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    color: #374151;
    transition: all 0.2s;
    user-select: none;
  }
  
  .key-button:hover {
    background-color: #f3f4f6;
    border-color: #d1d5db;
  }
  
  .key-button:active {
    background-color: #e5e7eb;
    transform: scale(0.95);
  }
  
  .key-button.backspace {
    background-color: #fef2f2;
    color: #dc2626;
  }
  
  .key-button.backspace:hover {
    background-color: #fee2e2;
  }

  /* Dark mode support */
  :global(.dark) .keypad-container {
    background-color: #1f2937;
    border-color: #374151;
  }
  
  :global(.dark) .keypad-header {
    background-color: #111827;
    border-color: #374151;
  }
  
  :global(.dark) .tab {
    color: #9ca3af;
  }
  
  :global(.dark) .tab.active {
    background-color: #3730a3;
    color: #e0e7ff;
  }
  
  :global(.dark) .keypad-grid {
    background-color: #111827;
  }
  
  :global(.dark) .key-button {
    background-color: #1f2937;
    border-color: #374151;
    color: #d1d5db;
  }
  
  :global(.dark) .key-button:hover {
    background-color: #374151;
    border-color: #4b5563;
  }
</style>
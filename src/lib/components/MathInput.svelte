<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  interface Props {
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    id?: string;
  }

  let { 
    value = '', 
    placeholder = 'Enter mathematical expression...', 
    disabled = false,
    id = `math-input-${Math.random().toString(36).substr(2, 9)}`
  }: Props = $props();

  const dispatch = createEventDispatcher();
  let mathInputContainer: HTMLDivElement;
  let keypadContainer: HTMLDivElement;
  let mathQuillInstance: any = null;
  let MQ: any = null;

  // Helper functions to convert between LaTeX formats
  function extractLatexFromWrapped(wrappedValue: string): string {
    // Extract LaTeX from various wrapper formats
    // Handle: <span class="math-tex">\(...\)</span> or just \(...\) or plain LaTeX
    const spanMatch = wrappedValue.match(/<span[^>]*class="math-tex"[^>]*>\\?\((.+?)\\?\)<\/span>/);
    if (spanMatch) return spanMatch[1];
    
    const parenMatch = wrappedValue.match(/\\?\((.+?)\\?\)/);
    if (parenMatch) return parenMatch[1];
    
    // If no wrapper found, assume it's plain LaTeX
    return wrappedValue;
  }

  function wrapLatexForRenderer(latex: string): string {
    // Wrap LaTeX in the format expected by MathRenderer
    return latex ? `<span class="math-tex">\\(${latex}\\)</span>` : '';
  }

  function createMathKeypad() {
    if (!keypadContainer || !mathQuillInstance) return;

    // Organize keypad in logical sections
    const keypadSections = [
      {
        title: "Fractions & Common",
        buttons: [
          { label: 'ᵃ⁄ᵦ', cmd: '\\frac{}{}', title: 'Fraction' },
          { label: '¹⁄₂', cmd: '\\frac{1}{2}', title: '1/2' },
          { label: '¼', cmd: '\\frac{1}{4}', title: '1/4' },
          { label: '¾', cmd: '\\frac{3}{4}', title: '3/4' },
          { label: '( )', cmd: '\\left(\\right)', title: 'Parentheses' }
        ]
      },
      {
        title: "Powers & Roots",
        buttons: [
          { label: 'x²', cmd: '^2', title: 'Square' },
          { label: 'xⁿ', cmd: '^{}', title: 'Power' },
          { label: '√', cmd: '\\sqrt{}', title: 'Square root' },
          { label: 'ⁿ√', cmd: '\\sqrt[{}]{}', title: 'nth root' }
        ]
      },
      {
        title: "Operations", 
        buttons: [
          { label: '+', cmd: '+', title: 'Add' },
          { label: '−', cmd: '-', title: 'Subtract' },
          { label: '×', cmd: '\\times', title: 'Multiply' },
          { label: '÷', cmd: '\\div', title: 'Divide' },
          { label: '=', cmd: '=', title: 'Equals' }
        ]
      },
      {
        title: "Numbers",
        buttons: [
          { label: '7', cmd: '7' }, { label: '8', cmd: '8' }, { label: '9', cmd: '9' },
          { label: '4', cmd: '4' }, { label: '5', cmd: '5' }, { label: '6', cmd: '6' },
          { label: '1', cmd: '1' }, { label: '2', cmd: '2' }, { label: '3', cmd: '3' },
          { label: '0', cmd: '0' }, { label: '.', cmd: '.' }
        ]
      },
      {
        title: "Greek & Symbols",
        buttons: [
          { label: 'π', cmd: '\\pi', title: 'Pi' },
          { label: 'θ', cmd: '\\theta', title: 'Theta' },
          { label: '∞', cmd: '\\infty', title: 'Infinity' },
          { label: '±', cmd: '\\pm', title: 'Plus/minus' }
        ]
      },
      {
        title: "Functions",
        buttons: [
          { label: 'sin', cmd: '\\sin\\left(\\right)', title: 'Sine' },
          { label: 'cos', cmd: '\\cos\\left(\\right)', title: 'Cosine' },
          { label: 'tan', cmd: '\\tan\\left(\\right)', title: 'Tangent' },
          { label: 'log', cmd: '\\log\\left(\\right)', title: 'Logarithm' },
          { label: 'ln', cmd: '\\ln\\left(\\right)', title: 'Natural log' }
        ]
      },
      {
        title: "Actions",
        buttons: [
          { label: '⌫', cmd: 'BACKSPACE', title: 'Backspace' },
          { label: 'Clear', cmd: 'CLEAR', title: 'Clear all' }
        ]
      }
    ];

    const keypadHTML = `
      <div class="math-keypad-sections">
        ${keypadSections.map(section => {
          const sectionClass = section.title.toLowerCase().replace(/\s+/g, '-').replace('&', '').replace(/[^a-z-]/g, '');
          return `
            <div class="keypad-section ${sectionClass}-section">
              <div class="section-title">${section.title}</div>
              <div class="section-buttons">
                ${section.buttons.map(button => `
                  <button 
                    type="button" 
                    class="keypad-btn" 
                    data-cmd="${button.cmd}"
                    title="${button.title || button.label}"
                  >
                    ${button.label}
                  </button>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    keypadContainer.innerHTML = keypadHTML;

    // Add event listeners to keypad buttons
    keypadContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      if (target.classList.contains('keypad-btn')) {
        const cmd = target.dataset.cmd;
        if (cmd && mathQuillInstance) {
          if (cmd === 'BACKSPACE') {
            mathQuillInstance.keystroke('Backspace');
          } else if (cmd === 'CLEAR') {
            mathQuillInstance.latex('');
          } else if (cmd.includes('{}')) {
            // For commands with placeholders, write the command and position cursor
            mathQuillInstance.write(cmd);
          } else {
            mathQuillInstance.write(cmd);
          }
          
          const latex = mathQuillInstance.latex();
          const wrappedValue = wrapLatexForRenderer(latex);
          value = wrappedValue;
          dispatch('input', { value: wrappedValue });
          mathQuillInstance.focus();
        }
      }
    });
  }

  function waitForMathQuill(): Promise<any> {
    return new Promise((resolve, reject) => {
      const checkMathQuill = () => {
        if (typeof (window as any).MathQuill !== 'undefined') {
          resolve((window as any).MathQuill.getInterface(2));
        } else if (document.readyState === 'complete') {
          // If document is complete but MathQuill still not loaded, load it dynamically
          loadMathQuillScript().then(() => {
            if (typeof (window as any).MathQuill !== 'undefined') {
              resolve((window as any).MathQuill.getInterface(2));
            } else {
              reject(new Error('MathQuill failed to load'));
            }
          }).catch(reject);
        } else {
          setTimeout(checkMathQuill, 100);
        }
      };
      checkMathQuill();
    });
  }

  function loadMathQuillScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof (window as any).MathQuill !== 'undefined') {
        resolve();
        return;
      }

      // Load CSS first
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/mathquill.css';
      document.head.appendChild(css);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/mathquill.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load MathQuill script'));
      document.head.appendChild(script);
    });
  }

  onMount(async () => {
    try {
      // Load jQuery first (required by MathQuill)
      const jQuery = (await import('jquery')).default;
      (window as any).jQuery = jQuery;
      (window as any).$ = jQuery;

      // Wait for MathQuill to be available
      MQ = await waitForMathQuill();

      if (mathInputContainer && keypadContainer) {
        // Create MathQuill instance for the input field
        mathQuillInstance = MQ.MathField(mathInputContainer, {
          spaceBehavesLikeTab: true,
          leftRightIntoCmdGoes: 'up',
          restrictMismatchedBrackets: true,
          sumStartsWithNEquals: true,
          supSubsRequireOperand: true,
          autoCommands: 'pi theta sqrt sum int',
          autoOperatorNames: 'sin cos tan ln log',
          handlers: {
            edit: () => {
              const latex = mathQuillInstance.latex();
              // Wrap LaTeX in the format expected by MathRenderer
              const wrappedValue = wrapLatexForRenderer(latex);
              value = wrappedValue;
              dispatch('input', { value: wrappedValue });
            },
            enter: () => {
              dispatch('enter');
            }
          }
        });

        // Set initial value - extract LaTeX from wrapped format if needed
        if (value) {
          const latex = extractLatexFromWrapped(value);
          mathQuillInstance.latex(latex);
        }

        // Create our custom math keypad
        createMathKeypad();
      }
    } catch (error) {
      console.error('Failed to load math libraries:', error);
      // Fallback to regular input with LaTeX support
      if (mathInputContainer && keypadContainer) {
        mathInputContainer.innerHTML = `
          <input 
            type="text" 
            value="${value}" 
            placeholder="${placeholder} (LaTeX format: \\frac{a}{b} for fractions)"
            class="w-full px-3 py-2 border-0 focus:ring-0 bg-transparent"
            style="outline: none; box-shadow: none;"
          />
        `;
        
        // Add a simple LaTeX helper keypad
        keypadContainer.innerHTML = `
          <div class="fallback-keypad">
            <div class="text-sm text-gray-600 mb-2">Quick LaTeX helpers:</div>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="keypad-btn-small" data-latex="\\frac{}{}" title="Fraction">a/b</button>
              <button type="button" class="keypad-btn-small" data-latex="^{}" title="Exponent">x²</button>
              <button type="button" class="keypad-btn-small" data-latex="\\sqrt{}" title="Square root">√</button>
              <button type="button" class="keypad-btn-small" data-latex="\\pi" title="Pi">π</button>
              <button type="button" class="keypad-btn-small" data-latex="\\theta" title="Theta">θ</button>
              <button type="button" class="keypad-btn-small" data-latex="\\times" title="Multiply">×</button>
              <button type="button" class="keypad-btn-small" data-latex="\\div" title="Divide">÷</button>
            </div>
          </div>
        `;

        const input = mathInputContainer.querySelector('input') as HTMLInputElement;
        if (input) {
          // Set initial value for fallback input
          const initialLatex = extractLatexFromWrapped(value);
          input.value = initialLatex;
          
          input.addEventListener('input', (e) => {
            const latex = (e.target as HTMLInputElement).value;
            const wrappedValue = wrapLatexForRenderer(latex);
            value = wrappedValue;
            dispatch('input', { value: wrappedValue });
          });

          // Add LaTeX helper functionality
          keypadContainer.addEventListener('click', (e) => {
            const target = e.target as HTMLButtonElement;
            if (target.hasAttribute('data-latex')) {
              const latex = target.getAttribute('data-latex');
              const start = input.selectionStart || 0;
              const end = input.selectionEnd || 0;
              const currentValue = input.value;
              
              const newLatex = currentValue.slice(0, start) + latex + currentValue.slice(end);
              input.value = newLatex;
              const wrappedValue = wrapLatexForRenderer(newLatex);
              value = wrappedValue;
              dispatch('input', { value: wrappedValue });
              
              // Position cursor after inserted text
              const newPos = start + latex.length;
              input.setSelectionRange(newPos, newPos);
              input.focus();
            }
          });
        }
      }
    }
  });

  onDestroy(() => {
    // MathQuill cleanup is handled automatically
    // Our custom keypad is just HTML, no cleanup needed
  });

  // Update the math input when value prop changes
  $effect(() => {
    if (mathQuillInstance) {
      const currentLatex = mathQuillInstance.latex();
      const expectedLatex = extractLatexFromWrapped(value);
      if (currentLatex !== expectedLatex) {
        mathQuillInstance.latex(expectedLatex);
      }
    }
  });

  export function getValue(): string {
    if (mathQuillInstance) {
      const latex = mathQuillInstance.latex();
      return wrapLatexForRenderer(latex);
    }
    return value;
  }

  export function setValue(newValue: string) {
    value = newValue;
    if (mathQuillInstance) {
      const latex = extractLatexFromWrapped(newValue);
      mathQuillInstance.latex(latex);
    }
  }

  export function focus() {
    if (mathQuillInstance) {
      mathQuillInstance.focus();
    }
  }

  export function blur() {
    if (mathQuillInstance) {
      mathQuillInstance.blur();
    }
  }
</script>


<div class="math-input-wrapper">
  <!-- MathQuill Input Field -->
  <div 
    bind:this={mathInputContainer} 
    {id} 
    class="math-input-field"
    class:disabled
  ></div>
  
  <!-- Khan Academy Keypad -->
  <div class="keypad-container mt-3">
    <div bind:this={keypadContainer} class="math-keypad"></div>
  </div>
</div>

<style>
  .math-input-wrapper {
    position: relative;
  }

  .math-input-field {
    min-height: 48px;
    border: 2px solid #d1d5db;
    border-radius: 0.375rem;
    background-color: white;
    padding: 8px 12px;
    font-size: 18px;
  }

  .math-input-field:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .math-input-field.disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
  }

  .keypad-container {
    max-width: 100%;
    overflow-x: auto;
  }

  .math-keypad {
    min-height: 200px;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background-color: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  /* MathQuill styling overrides */
  :global(.mq-editable-field) {
    border: none !important;
    background: transparent !important;
    min-height: 32px;
    font-size: 18px;
  }

  :global(.mq-math-mode .mq-root-block) {
    padding: 4px 8px;
  }

  :global(.mq-cursor) {
    border-left: 2px solid #3b82f6;
  }

  /* Khan Academy Keypad styling */
  :global(.keypad) {
    font-family: inherit;
  }

  :global(.keypad-button) {
    border: 1px solid #e5e7eb !important;
    background: white !important;
    border-radius: 4px !important;
    margin: 2px !important;
    transition: all 0.15s ease !important;
    font-size: 16px !important;
  }

  :global(.keypad-button:hover) {
    background-color: #f3f4f6 !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
  }

  :global(.keypad-button:active) {
    background-color: #e5e7eb !important;
    transform: translateY(0);
  }

  :global(.keypad-button.selected) {
    background-color: #dbeafe !important;
    border-color: #3b82f6 !important;
  }

  /* Custom Math Keypad Sections */
  :global(.math-keypad-sections) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    padding: 16px;
    max-width: 100%;
  }

  :global(.keypad-section) {
    background: #f8fafc;
    border-radius: 8px;
    padding: 12px;
  }

  :global(.section-title) {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  :global(.section-buttons) {
    display: grid;
    gap: 4px;
    grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
  }

  /* Numbers section gets special treatment */
  :global(.numbers-section .section-buttons) {
    grid-template-columns: repeat(3, 1fr);
  }

  /* Fractions section gets wider buttons */
  :global(.fractions-section .section-buttons) {
    grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  }

  :global(.keypad-btn) {
    padding: 12px 8px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.15s ease;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  :global(.keypad-btn:hover) {
    background: #f3f4f6;
    border-color: #9ca3af;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  :global(.keypad-btn:active) {
    background: #e5e7eb;
    transform: translateY(0);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Special button styling */
  :global(.keypad-btn[data-cmd="CLEAR"]) {
    background: #fee2e2;
    color: #dc2626;
    border-color: #fca5a5;
    grid-column: span 2;
  }

  :global(.keypad-btn[data-cmd="CLEAR"]:hover) {
    background: #fecaca;
    border-color: #f87171;
  }

  :global(.keypad-btn[data-cmd="BACKSPACE"]) {
    background: #fef3c7;
    color: #d97706;
    border-color: #fbbf24;
  }

  :global(.keypad-btn[data-cmd="BACKSPACE"]:hover) {
    background: #fef9c3;
    border-color: #f59e0b;
  }

  /* Fraction buttons */
  :global(.keypad-btn[data-cmd*="\\frac"]) {
    background: #dbeafe;
    color: #2563eb;
    border-color: #93c5fd;
  }

  :global(.keypad-btn[data-cmd*="\\frac"]:hover) {
    background: #bfdbfe;
    border-color: #60a5fa;
  }

  /* Advanced function buttons */
  :global(.keypad-btn[data-cmd*="\\sin"], .keypad-btn[data-cmd*="\\cos"], .keypad-btn[data-cmd*="\\tan"], 
          .keypad-btn[data-cmd*="\\log"], .keypad-btn[data-cmd*="\\ln"]) {
    background: #f3e8ff;
    color: #7c3aed;
    border-color: #c4b5fd;
  }

  :global(.keypad-btn[data-cmd*="\\sin"]:hover, .keypad-btn[data-cmd*="\\cos"]:hover, 
          .keypad-btn[data-cmd*="\\tan"]:hover, .keypad-btn[data-cmd*="\\log"]:hover, 
          .keypad-btn[data-cmd*="\\ln"]:hover) {
    background: #ede9fe;
    border-color: #a78bfa;
  }

  /* Responsive grid */
  @media (max-width: 640px) {
    :global(.math-keypad-grid) {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  /* Fallback keypad styling */
  :global(.fallback-keypad) {
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
  }

  :global(.keypad-btn-small) {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: white;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
  }

  :global(.keypad-btn-small:hover) {
    background: #f3f4f6;
    border-color: #9ca3af;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  :global(.keypad-btn-small:active) {
    background: #e5e7eb;
    transform: translateY(0);
  }
</style>
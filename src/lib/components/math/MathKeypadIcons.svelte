<script lang="ts">
  export let iconType: string = '';
</script>

{#if iconType === 'keypad'}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
  </svg>
{:else if iconType === 'fraction'}
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 8h2v2H7zm0-3h2v2H7zm0 6h2v2H7zm4-3h2v2h-2zm0-3h2v2h-2zm0 6h2v2h-2zm4-3h2v2h-2zm0-3h2v2h-2zm0 6h2v2h-2z"/>
    <path d="m5.5 16 13-8" stroke="currentColor" stroke-width="1.5" fill="none"/>
  </svg>
{:else if iconType === 'square'}
  <svg viewBox="0 0 24 24" fill="currentColor">
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" font-family="serif">x²</text>
  </svg>
{:else if iconType === 'sqrt'}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 16 L7 20 L12 10 L22 10"/>
    <line x1="12" y1="6" x2="22" y2="6"/>
  </svg>
{:else if iconType === 'exponent'}
  <svg viewBox="0 0 24 24" fill="currentColor">
    <text x="30%" y="70%" dominant-baseline="middle" text-anchor="middle" font-size="12" font-family="serif">x</text>
    <text x="70%" y="30%" dominant-baseline="middle" text-anchor="middle" font-size="8" font-family="serif">n</text>
  </svg>
{:else if iconType === 'backspace'}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="m9 9 6 6m0-6-6 6M21 12H3l3-7 3 7"/>
  </svg>
{:else if iconType === 'plus'}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
{:else if iconType === 'minus'}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
{:else if iconType === 'times'}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
{:else if iconType === 'divide'}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="6" r="2" fill="currentColor"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
    <circle cx="12" cy="18" r="2" fill="currentColor"/>
  </svg>
{:else if iconType === 'equals'}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="5" y1="9" x2="19" y2="9"/>
    <line x1="5" y1="15" x2="19" y2="15"/>
  </svg>
{:else if iconType === 'parenthesis-left'}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M15 3a12 12 0 0 0 0 18"/>
  </svg>
{:else if iconType === 'parenthesis-right'}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M9 21a12 12 0 0 0 0-18"/>
  </svg>
{:else}
  <!-- Default icon -->
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
  </svg>
{/if}
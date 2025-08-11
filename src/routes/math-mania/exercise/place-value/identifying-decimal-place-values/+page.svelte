<script lang="ts">
  import PublicHeader from "$lib/components/PublicHeader.svelte";
  import CarbonCheckmarkFilled from "~icons/carbon/checkmark-filled";
  import CarbonCloseFilled from "~icons/carbon/close-filled";
  import CarbonIdea from "~icons/carbon/idea";
  import CarbonRenew from "~icons/carbon/renew";

  // Generate a random decimal question like Khan Academy's
  function generateQuestion() {
    const whole = Math.floor(Math.random() * 9) + 1; // 1-9
    const d1 = Math.floor(Math.random() * 10);
    const d2 = Math.floor(Math.random() * 10);
    const d3 = Math.floor(Math.random() * 10);
    const value = `${whole}.${d1}${d2}${d3}`;
    const places = [
      { key: "tenths", index: 0, digit: d1 },
      { key: "hundredths", index: 1, digit: d2 },
      { key: "thousandths", index: 2, digit: d3 },
    ];
    const target = places[Math.floor(Math.random() * places.length)];
    const prompt = `Which digit is in the ${target.key} place in ${value}?`;

    const answers = new Set<number>([target.digit]);
    while (answers.size < 4) answers.add(Math.floor(Math.random() * 10));
    const choices = Array.from(answers).sort(() => Math.random() - 0.5);
    return { prompt, value, target, choices };
  }

  let q = $state(generateQuestion());
  let selected: number | null = $state(null);
  let checked = $state(false);

  function check() {
    if (selected === null) return;
    checked = true;
  }

  function next() {
    q = generateQuestion();
    selected = null;
    checked = false;
  }
</script>

<svelte:head>
  <title>Identifying decimal place values - Previsely</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <PublicHeader />

  <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6">
      <nav class="text-sm text-gray-600 dark:text-gray-400">
        <a href="/math-mania" class="hover:underline">Math</a>
        <span class="mx-2">›</span>
        <span>Place value and decimals</span>
      </nav>
      <h1 class="mt-2 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Identifying decimal place values</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
      <!-- Exercise card -->
      <div class="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/90 dark:bg-gray-800/80 backdrop-blur p-6">
        <p class="text-lg text-gray-900 dark:text-white">{q.prompt}</p>

        <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each q.choices as c}
            <label class="flex items-center gap-3 rounded-lg border {selected === c ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/40' : 'border-gray-200 dark:border-gray-700'} bg-white/90 dark:bg-gray-800/70 px-4 py-3 cursor-pointer">
              <input type="radio" name="choice" class="sr-only" value={c} on:change={() => (selected = c)} checked={selected === c} />
              <span class="inline-flex size-5 items-center justify-center rounded-full border {selected === c ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-transparent'}">✓</span>
              <span class="text-gray-900 dark:text-gray-100 text-base">{c}</span>
            </label>
          {/each}
        </div>

        <div class="mt-5 flex flex-wrap items-center gap-3">
          <button class="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" disabled={selected === null} on:click={check}>
            Check
          </button>
          <button class="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-2" on:click={next}>
            <CarbonRenew class="w-4 h-4" /> Next
          </button>
          <button class="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-2">
            <CarbonIdea class="w-4 h-4 text-amber-500" /> Hint
          </button>
        </div>

        {#if checked}
          {#if selected === q.target.digit}
            <div class="mt-4 flex items-center gap-2 text-green-700 dark:text-green-400">
              <CarbonCheckmarkFilled class="w-5 h-5" /> Correct! The {q.target.key} place is {q.target.digit} in {q.value}.
            </div>
          {:else}
            <div class="mt-4 flex items-center gap-2 text-red-700 dark:text-red-400">
              <CarbonCloseFilled class="w-5 h-5" /> Not quite. Try again or reveal a hint.
            </div>
          {/if}
        {/if}
      </div>

      <!-- Sidebar card (course challenge / tips) -->
      <aside class="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/70 backdrop-blur p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white">Keep practicing</h3>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">Master place values by practicing multiple questions. Points are awarded for correct answers.</p>
        <a href="/math-mania" class="mt-3 inline-block text-sm text-blue-700 dark:text-blue-300 hover:underline">Back to Maths Zone</a>
        <div class="mt-4 border-t border-gray-200/60 dark:border-gray-700/60 pt-4">
          <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Related topics</h4>
          <ul class="mt-2 space-y-1 text-sm">
            <li><a href="/math-mania" class="text-blue-700 dark:text-blue-300 hover:underline">Intro to place value</a></li>
            <li><a href="/math-mania" class="text-blue-700 dark:text-blue-300 hover:underline">Multiplying by powers of 10</a></li>
            <li><a href="/math-mania" class="text-blue-700 dark:text-blue-300 hover:underline">Rounding</a></li>
          </ul>
        </div>
      </aside>
    </div>
  </section>
</div>



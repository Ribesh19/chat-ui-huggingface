<script lang="ts">
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import CarbonLogoGoogle from "~icons/carbon/logo-google";
  import CarbonEmail from "~icons/carbon/email";
  import CarbonLocked from "~icons/carbon/locked";
  import CarbonUserAvatar from "~icons/carbon/user-avatar";

  let email = $state("");
  let password = $state("");
  let errorMessage: string | null = $state(null);

  async function signInWithGoogle() {
    // Client-side start of Google sign-in flow (handled by Firebase SDK on this page)
    const { getAuth, GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
    const { app } = await import("$lib/firebase");
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider)
      .then(async (cred) => {
        const idToken = await cred.user.getIdToken(true);
        await fetch(`${base}/api/auth/firebase/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        location.href = `${base}/`;
      })
      .catch((e) => (errorMessage = e.message));
  }

  async function signInWithEmail(ev: SubmitEvent) {
    ev.preventDefault();
    const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import("firebase/auth");
    const { app } = await import("$lib/firebase");
    const auth = getAuth(app);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken(true);
      await fetch(`${base}/api/auth/firebase/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      location.href = `${base}/`;
    } catch (_) {
      // fallback to sign up if user doesn't exist
      await createUserWithEmailAndPassword(auth, email, password)
        .then(async (cred) => {
          const idToken = await cred.user.getIdToken(true);
          await fetch(`${base}/api/auth/firebase/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
          location.href = `${base}/`;
        })
        .catch((e) => (errorMessage = e.message));
    }
  }
</script>

<svelte:head>
  <title>Sign in - Previsely</title>
</svelte:head>

<section class="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/70 backdrop-blur p-8 shadow-sm">
  <div class="flex items-center gap-3 mb-6">
    <CarbonUserAvatar class="w-6 h-6" />
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Welcome back</h1>
  </div>

  {#if errorMessage}
    <div class="mb-4 rounded-md border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">{errorMessage}</div>
  {/if}

  <div class="grid grid-cols-1 gap-4">
    <button onclick={signInWithGoogle} class="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
      <CarbonLogoGoogle class="w-5 h-5" /> Continue with Google
    </button>

    <div class="relative my-2 text-center">
      <span class="px-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 relative z-10">or</span>
      <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gray-200 dark:bg-gray-700"></div>
    </div>

    <form onsubmit={signInWithEmail} class="grid gap-3">
      <label class="text-sm text-gray-700 dark:text-gray-300">Email</label>
      <div class="flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
        <CarbonEmail class="w-4 h-4 text-gray-500" />
        <input class="w-full bg-transparent outline-none" type="email" bind:value={email} required />
      </div>

      <label class="mt-2 text-sm text-gray-700 dark:text-gray-300">Password</label>
      <div class="flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
        <CarbonLocked class="w-4 h-4 text-gray-500" />
        <input class="w-full bg-transparent outline-none" type="password" bind:value={password} minlength="6" required />
      </div>

      <button type="submit" class="mt-4 inline-flex justify-center rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Continue</button>
    </form>
  </div>

  <p class="mt-6 text-xs text-gray-500 dark:text-gray-400">By continuing you agree to our terms and privacy policy.</p>
</section>



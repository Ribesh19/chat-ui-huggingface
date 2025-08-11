<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import CarbonCheckmarkFilled from '~icons/carbon/checkmark-filled';
  import CarbonWarningFilled from '~icons/carbon/warning-filled';
  import CarbonUser from '~icons/carbon/user';
  import CarbonDocument from '~icons/carbon/document';

  let currentUser: any = null;
  let setupSteps = [
    { name: 'Check Authentication', status: 'pending', message: '' },
    { name: 'Get Security Token', status: 'pending', message: '' },
    { name: 'Create Secure Collections & Admin Access', status: 'pending', message: '' }
  ];
  let isRunning = false;
  let isComplete = false;

  onMount(async () => {
    if (!browser) return;
    
    try {
      const { getAuth, onAuthStateChanged } = await import('firebase/auth');
      const { app } = await import('$lib/firebase');
      
      const auth = getAuth(app);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          currentUser = user;
        } else {
          goto('/auth?redirect=/setup-admin');
        }
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error loading Firebase:', error);
    }
  });

  async function runSetup() {
    if (!browser) return;
    
    isRunning = true;
    isComplete = false;

    try {
      // Step 1: Check Authentication
      updateStep(0, 'running', 'Checking user authentication...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!currentUser) {
        updateStep(0, 'error', 'No user logged in. Please log in first.');
        return;
      }
      
      updateStep(0, 'success', `Authenticated as ${currentUser.email}`);

      // Step 2: Get Auth Token and Run Server-Side Setup
      updateStep(1, 'running', 'Getting authentication token...');
      
      const { getAuth, getIdToken } = await import('firebase/auth');
      const { app } = await import('$lib/firebase');
      
      const auth = getAuth(app);
      const token = await getIdToken(currentUser);
      
      updateStep(1, 'success', 'Token obtained successfully');

      // Step 3: Run Secure Server-Side Setup
      updateStep(2, 'running', 'Creating secure collections and admin access...');
      
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (result.alreadySetup) {
          updateStep(2, 'success', 'Setup already completed - You have admin access');
        } else {
          updateStep(2, 'success', `Setup completed! Created ${result.stats.questionsCreated} questions, ${result.stats.achievementsCreated} achievements`);
        }
        isComplete = true;
      } else {
        updateStep(2, 'error', result.error || 'Setup failed');
        return;
      }

    } catch (error) {
      console.error('Setup error:', error);
      const runningStep = setupSteps.findIndex(step => step.status === 'running');
      if (runningStep !== -1) {
        updateStep(runningStep, 'error', error.message);
      }
    } finally {
      isRunning = false;
    }
  }

  function updateStep(index: number, status: string, message: string) {
    setupSteps[index] = { ...setupSteps[index], status, message };
    setupSteps = [...setupSteps]; // Trigger reactivity
  }

  function getStepIcon(status: string) {
    switch (status) {
      case 'success': return CarbonCheckmarkFilled;
      case 'error': return CarbonWarningFilled;
      default: return null;
    }
  }

  function getStepColor(status: string) {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-400';
    }
  }
</script>

<svelte:head>
  <title>Setup Admin - Previsely</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  <div class="max-w-2xl w-full">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CarbonUser class="w-8 h-8 text-blue-600" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Admin Setup</h1>
        <p class="text-gray-600">Initialize your Firebase collections and admin access</p>
      </div>

      {#if currentUser}
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {currentUser.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p class="font-medium text-blue-900">{currentUser.displayName || 'User'}</p>
              <p class="text-sm text-blue-700">{currentUser.email}</p>
            </div>
          </div>
        </div>
      {/if}

      <div class="space-y-4 mb-8">
        {#each setupSteps as step, index}
          <div class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
            <div class="flex-shrink-0">
              {#if step.status === 'running'}
                <div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              {:else if getStepIcon(step.status)}
                <svelte:component this={getStepIcon(step.status)} class="w-6 h-6 {getStepColor(step.status)}" />
              {:else}
                <div class="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <span class="text-xs font-semibold text-gray-400">{index + 1}</span>
                </div>
              {/if}
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-gray-900">{step.name}</h3>
              {#if step.message}
                <p class="text-sm {getStepColor(step.status)}">{step.message}</p>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <div class="text-center">
        {#if !isComplete}
          <button
            onclick={runSetup}
            disabled={isRunning}
            class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isRunning}
              <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Setting Up...
            {:else}
              <CarbonDocument class="w-4 h-4" />
              Start Setup
            {/if}
          </button>
        {:else}
          <div class="space-y-4">
            <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-center gap-2 justify-center">
                <CarbonCheckmarkFilled class="w-6 h-6 text-green-600" />
                <span class="font-semibold text-green-900">Setup Complete!</span>
              </div>
              <p class="text-sm text-green-800 mt-2">
                Your Firebase collections have been created and you now have admin access.
              </p>
            </div>
            
            <div class="flex justify-center gap-3">
              <a
                href="/admin"
                class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Go to Admin Panel
              </a>
              <a
                href="/admin/questions/create"
                class="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Create Questions
              </a>
            </div>
          </div>
        {/if}
      </div>

      <div class="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-start gap-3">
          <CarbonCheckmarkFilled class="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 class="font-medium text-green-900 mb-1">Production Ready</h4>
            <p class="text-sm text-green-800">
              This setup uses the Firebase Admin SDK for maximum security. All question answers are SHA-256 hashed 
              and never exposed to clients. Server-side validation ensures complete answer security.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
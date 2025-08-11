<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let user: any = null;
  let isLoading = true;
  let error = '';

  onMount(async () => {
    if (!browser) return;
    
    try {
      const { getAuth, onAuthStateChanged } = await import('firebase/auth');
      const { app } = await import('$lib/firebase');
      
      const auth = getAuth(app);
      
      onAuthStateChanged(auth, (currentUser) => {
        user = currentUser;
        isLoading = false;
        
        if (currentUser) {
          console.log('User logged in:', currentUser.email);
        } else {
          console.log('No user logged in');
        }
      });
      
    } catch (err) {
      console.error('Firebase error:', err);
      error = String(err);
      isLoading = false;
    }
  });

  async function testAdminAPI() {
    if (!user) return;
    
    try {
      const { getIdToken } = await import('firebase/auth');
      const token = await getIdToken(user);
      
      console.log('Testing admin API...');
      
      const response = await fetch('/api/admin/check', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        return;
      }
      
      const result = await response.json();
      console.log('Admin check result:', result);
      
    } catch (err) {
      console.error('API test error:', err);
    }
  }
</script>

<div class="p-8">
  <h1 class="text-2xl font-bold mb-4">Admin Debug Test</h1>
  
  {#if isLoading}
    <p>Loading...</p>
  {:else if error}
    <div class="bg-red-100 p-4 rounded">
      <p class="text-red-800">Error: {error}</p>
    </div>
  {:else if user}
    <div class="bg-green-100 p-4 rounded mb-4">
      <h2 class="font-bold text-green-800">User Logged In:</h2>
      <p>Email: {user.email}</p>
      <p>UID: {user.uid}</p>
      <p>Display Name: {user.displayName || 'None'}</p>
    </div>
    
    <button 
      on:click={testAdminAPI}
      class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      Test Admin API
    </button>
  {:else}
    <div class="bg-yellow-100 p-4 rounded">
      <p class="text-yellow-800">No user logged in</p>
      <a href="/auth" class="text-blue-600 hover:underline">Go to login</a>
    </div>
  {/if}
</div>
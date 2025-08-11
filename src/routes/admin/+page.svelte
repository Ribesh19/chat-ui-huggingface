<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import PublicHeader from '$lib/components/PublicHeader.svelte';
  import CarbonDocument from '~icons/carbon/document';
  import CarbonAdd from '~icons/carbon/add';
  import CarbonDashboard from '~icons/carbon/dashboard';
  
  let user: any = null;
  let isAdmin = false;
  let isLoading = true;

  onMount(async () => {
    if (!browser) return;
    
    try {
      const { getAuth, onAuthStateChanged } = await import('firebase/auth');
      const { app } = await import('$lib/firebase');
      
      const auth = getAuth(app);
      
      onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) {
          window.location.href = '/auth?redirect=/admin';
          return;
        }
        
        user = currentUser;
        
        // Check admin status
        try {
          const { getIdToken } = await import('firebase/auth');
          const token = await getIdToken(currentUser);
          
          const response = await fetch('/api/admin/check', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            isAdmin = result.success && result.isAdmin;
          }
        } catch (err) {
          console.error('Admin check error:', err);
          // Fallback for authorized email
          isAdmin = currentUser.email === 'ribeshforu@gmail.com';
        }
        
        isLoading = false;
      });
      
    } catch (err) {
      console.error('Firebase error:', err);
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>Admin Panel - Math Mania</title>
</svelte:head>

{#if isLoading}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
{:else if isAdmin}
  <div class="min-h-screen bg-gray-50">
    <PublicHeader />
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p class="text-gray-600">Welcome back, {user?.displayName || user?.email}</p>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <a 
          href="/admin/curriculum/create" 
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <CarbonAdd class="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Create Curriculum</h3>
              <p class="text-sm text-gray-600">Design new learning curricula</p>
            </div>
          </div>
        </a>

        <a 
          href="/admin/curriculum" 
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <CarbonDocument class="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Manage Curriculum</h3>
              <p class="text-sm text-gray-600">View and edit curricula</p>
            </div>
          </div>
        </a>

        <a 
          href="/admin/questions/create" 
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CarbonAdd class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Create Question</h3>
              <p class="text-sm text-gray-600">Add new questions to the system</p>
            </div>
          </div>
        </a>

        <a 
          href="/admin/questions" 
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CarbonDocument class="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Manage Questions</h3>
              <p class="text-sm text-gray-600">View and edit existing questions</p>
            </div>
          </div>
        </a>

        <a 
          href="/admin/questions/import" 
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CarbonDashboard class="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Import Questions</h3>
              <p class="text-sm text-gray-600">Bulk import via CSV</p>
            </div>
          </div>
        </a>

        <a 
          href="/admin/grades" 
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <CarbonAdd class="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Manage Grades</h3>
              <p class="text-sm text-gray-600">Create and edit grade levels</p>
            </div>
          </div>
        </a>

        <a 
          href="/admin/subjects" 
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
              <CarbonAdd class="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Manage Subjects</h3>
              <p class="text-sm text-gray-600">Create and edit subjects</p>
            </div>
          </div>
        </a>
      </div>

      <!-- Stats Overview -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">System Overview</h2>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">2</div>
            <div class="text-sm text-gray-600">Questions Created</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">1</div>
            <div class="text-sm text-gray-600">Curriculum</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">2</div>
            <div class="text-sm text-gray-600">Achievements</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">1</div>
            <div class="text-sm text-gray-600">Admin Users</div>
          </div>
        </div>
      </div>

      <!-- Test Your Questions -->
      <div class="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Test Your Questions</h2>
        <p class="text-gray-600 mb-4">Try out the questions you've created:</p>
        <a 
          href="/math-mania/exercise" 
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Start Practice Session
        </a>
      </div>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
      <p class="text-gray-600 mb-6">You don't have admin access.</p>
      <a href="/setup-admin" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Set Up Admin Access
      </a>
    </div>
  </div>
{/if}
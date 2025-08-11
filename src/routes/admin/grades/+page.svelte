<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import PublicHeader from '$lib/components/PublicHeader.svelte';
  import CarbonAdd from '~icons/carbon/add';
  import CarbonArrowLeft from '~icons/carbon/arrow-left';
  import CarbonEdit from '~icons/carbon/edit';
  import CarbonTrashCan from '~icons/carbon/trash-can';
  import CarbonCheckmarkOutline from '~icons/carbon/checkmark-outline';
  import CarbonCloseOutline from '~icons/carbon/close-outline';

  let grades: any[] = [];
  let isLoading = true;
  let error = '';
  let success = '';
  
  // Create/Edit form
  let showForm = false;
  let editingGrade: any = null;
  let formData = {
    gradeNumber: '',
    gradeName: '',
    description: '',
    ageRange: '',
    isActive: true
  };
  let isSubmitting = false;

  async function loadGrades() {
    if (!browser) return;
    
    isLoading = true;
    error = '';

    try {
      const { getAuth, getIdToken } = await import('firebase/auth');
      const { app } = await import('$lib/firebase');
      
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (!user) {
        error = 'You must be logged in';
        return;
      }

      const token = await getIdToken(user);

      const response = await fetch('/api/admin/grades', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        grades = result.grades;
      } else {
        error = result.error || 'Failed to load grades';
      }

    } catch (err) {
      console.error('Error loading grades:', err);
      error = 'Failed to load grades';
    } finally {
      isLoading = false;
    }
  }

  async function submitGrade() {
    if (!browser) return;
    
    isSubmitting = true;
    error = '';
    success = '';

    try {
      const { getAuth, getIdToken } = await import('firebase/auth');
      const { app } = await import('$lib/firebase');
      
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (!user) {
        error = 'You must be logged in';
        return;
      }

      const token = await getIdToken(user);

      const url = editingGrade ? `/api/admin/grades/${editingGrade.id}` : '/api/admin/grades';
      const method = editingGrade ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        success = result.message;
        showForm = false;
        editingGrade = null;
        resetForm();
        await loadGrades();
      } else {
        error = result.error || 'Failed to save grade';
      }

    } catch (err) {
      console.error('Error saving grade:', err);
      error = 'Failed to save grade';
    } finally {
      isSubmitting = false;
    }
  }

  async function deleteGrade(grade: any) {
    if (!browser || !confirm(`Are you sure you want to delete "${grade.gradeName}"? This action cannot be undone.`)) {
      return;
    }
    
    error = '';
    success = '';

    try {
      const { getAuth, getIdToken } = await import('firebase/auth');
      const { app } = await import('$lib/firebase');
      
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (!user) {
        error = 'You must be logged in';
        return;
      }

      const token = await getIdToken(user);

      const response = await fetch(`/api/admin/grades/${grade.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        success = result.message;
        await loadGrades();
      } else {
        error = result.error || 'Failed to delete grade';
      }

    } catch (err) {
      console.error('Error deleting grade:', err);
      error = 'Failed to delete grade';
    }
  }

  function startEdit(grade: any) {
    editingGrade = grade;
    formData = {
      gradeNumber: grade.gradeNumber.toString(),
      gradeName: grade.gradeName,
      description: grade.description || '',
      ageRange: grade.ageRange || '',
      isActive: grade.isActive !== false
    };
    showForm = true;
  }

  function resetForm() {
    formData = {
      gradeNumber: '',
      gradeName: '',
      description: '',
      ageRange: '',
      isActive: true
    };
    editingGrade = null;
  }

  function cancelForm() {
    showForm = false;
    resetForm();
  }

  onMount(() => {
    loadGrades();
  });

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Manage Grades - Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <PublicHeader />
  
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <a 
          href="/admin" 
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <CarbonArrowLeft class="w-5 h-5" />
          Back to Admin
        </a>
        <h1 class="text-2xl font-bold text-gray-900">Grade Management</h1>
      </div>

      <button
        on:click={() => { showForm = true; resetForm(); }}
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <CarbonAdd class="w-4 h-4" />
        Add Grade
      </button>
    </div>

    <!-- Messages -->
    {#if error}
      <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800 text-sm">{error}</p>
      </div>
    {/if}

    {#if success}
      <div class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <p class="text-green-800 text-sm">{success}</p>
      </div>
    {/if}

    <!-- Create/Edit Form Modal -->
    {#if showForm}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            {editingGrade ? 'Edit Grade' : 'Create New Grade'}
          </h3>

          <form on:submit|preventDefault={submitGrade} class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Grade Number</label>
              <input
                type="number"
                bind:value={formData.gradeNumber}
                min="1"
                max="12"
                required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Grade Name</label>
              <input
                type="text"
                bind:value={formData.gradeName}
                placeholder="e.g., First Grade, Kindergarten"
                required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
              <input
                type="text"
                bind:value={formData.ageRange}
                placeholder="e.g., 5-6 years, 10-11 years"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                bind:value={formData.description}
                rows="3"
                placeholder="Brief description of this grade level..."
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                bind:checked={formData.isActive}
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label for="isActive" class="text-sm text-gray-700">Active</label>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <button
                type="button"
                on:click={cancelForm}
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if isSubmitting}
                  <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {/if}
                {editingGrade ? 'Update' : 'Create'} Grade
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}

    <!-- Grades List -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      {#if isLoading}
        <div class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-600 mt-2">Loading grades...</p>
        </div>
      {:else if grades.length === 0}
        <div class="p-8 text-center">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No Grades Found</h3>
          <p class="text-gray-600 mb-4">Create your first grade level to get started.</p>
          <button
            on:click={() => { showForm = true; resetForm(); }}
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <CarbonAdd class="w-4 h-4" />
            Add Grade
          </button>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age Range
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each grades as grade}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div>
                      <div class="font-semibold text-gray-900">{grade.gradeName}</div>
                      <div class="text-sm text-gray-500">Grade {grade.gradeNumber}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">
                    {grade.ageRange || 'Not specified'}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600 max-w-xs">
                    <div class="truncate" title={grade.description}>
                      {grade.description || 'No description'}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {grade.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                      {grade.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">
                    <div>{formatDate(grade.createdAt)}</div>
                    <div class="text-xs text-gray-500">
                      by {grade.createdBy || 'Unknown'}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <button
                        on:click={() => startEdit(grade)}
                        class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Grade"
                      >
                        <CarbonEdit class="w-4 h-4" />
                      </button>
                      <button
                        on:click={() => deleteGrade(grade)}
                        class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Grade"
                      >
                        <CarbonTrashCan class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p class="text-sm text-gray-600">
            Showing {grades.length} grade{grades.length !== 1 ? 's' : ''}
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import PublicHeader from '$lib/components/PublicHeader.svelte';
  import CarbonAdd from '~icons/carbon/add';
  import CarbonArrowLeft from '~icons/carbon/arrow-left';
  import CarbonEdit from '~icons/carbon/edit';
  import CarbonTrashCan from '~icons/carbon/trash-can';

  let subjects: any[] = [];
  let isLoading = true;
  let error = '';
  let success = '';
  
  // Create/Edit form
  let showForm = false;
  let editingSubject: any = null;
  let formData = {
    name: '',
    code: '',
    description: '',
    color: '#3B82F6',
    icon: 'book',
    isActive: true
  };
  let isSubmitting = false;

  const iconOptions = [
    { value: 'book', label: 'Book' },
    { value: 'calculator', label: 'Calculator' },
    { value: 'microscope', label: 'Microscope' },
    { value: 'palette', label: 'Palette' },
    { value: 'music', label: 'Music' },
    { value: 'globe', label: 'Globe' },
    { value: 'cpu', label: 'Computer' },
    { value: 'language', label: 'Language' },
    { value: 'fitness', label: 'Sports' },
    { value: 'chemistry', label: 'Chemistry' }
  ];

  const colorOptions = [
    { value: '#3B82F6', label: 'Blue', color: 'bg-blue-500' },
    { value: '#10B981', label: 'Green', color: 'bg-green-500' },
    { value: '#F59E0B', label: 'Yellow', color: 'bg-yellow-500' },
    { value: '#EF4444', label: 'Red', color: 'bg-red-500' },
    { value: '#8B5CF6', label: 'Purple', color: 'bg-purple-500' },
    { value: '#F97316', label: 'Orange', color: 'bg-orange-500' },
    { value: '#06B6D4', label: 'Cyan', color: 'bg-cyan-500' },
    { value: '#84CC16', label: 'Lime', color: 'bg-lime-500' }
  ];

  async function loadSubjects() {
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

      const response = await fetch('/api/admin/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        subjects = result.subjects;
      } else {
        error = result.error || 'Failed to load subjects';
      }

    } catch (err) {
      console.error('Error loading subjects:', err);
      error = 'Failed to load subjects';
    } finally {
      isLoading = false;
    }
  }

  async function submitSubject() {
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

      const url = editingSubject ? `/api/admin/subjects/${editingSubject.id}` : '/api/admin/subjects';
      const method = editingSubject ? 'PUT' : 'POST';

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
        editingSubject = null;
        resetForm();
        await loadSubjects();
      } else {
        error = result.error || 'Failed to save subject';
      }

    } catch (err) {
      console.error('Error saving subject:', err);
      error = 'Failed to save subject';
    } finally {
      isSubmitting = false;
    }
  }

  async function deleteSubject(subject: any) {
    if (!browser || !confirm(`Are you sure you want to delete "${subject.name}"? This action cannot be undone.`)) {
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

      const response = await fetch(`/api/admin/subjects/${subject.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        success = result.message;
        await loadSubjects();
      } else {
        error = result.error || 'Failed to delete subject';
      }

    } catch (err) {
      console.error('Error deleting subject:', err);
      error = 'Failed to delete subject';
    }
  }

  function startEdit(subject: any) {
    editingSubject = subject;
    formData = {
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      color: subject.color || '#3B82F6',
      icon: subject.icon || 'book',
      isActive: subject.isActive !== false
    };
    showForm = true;
  }

  function resetForm() {
    formData = {
      name: '',
      code: '',
      description: '',
      color: '#3B82F6',
      icon: 'book',
      isActive: true
    };
    editingSubject = null;
  }

  function cancelForm() {
    showForm = false;
    resetForm();
  }

  // Auto-generate code from name
  function generateCode() {
    if (formData.name && !editingSubject) {
      formData.code = formData.name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 20);
    }
  }

  onMount(() => {
    loadSubjects();
  });

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Manage Subjects - Admin</title>
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
        <h1 class="text-2xl font-bold text-gray-900">Subject Management</h1>
      </div>

      <button
        on:click={() => { showForm = true; resetForm(); }}
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <CarbonAdd class="w-4 h-4" />
        Add Subject
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
            {editingSubject ? 'Edit Subject' : 'Create New Subject'}
          </h3>

          <form on:submit|preventDefault={submitSubject} class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
              <input
                type="text"
                bind:value={formData.name}
                on:input={generateCode}
                placeholder="e.g., Mathematics, Science"
                required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
              <input
                type="text"
                bind:value={formData.code}
                placeholder="e.g., math, science"
                required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p class="text-xs text-gray-600 mt-1">Unique identifier (auto-generated from name)</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                bind:value={formData.description}
                rows="3"
                placeholder="Brief description of this subject..."
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div class="grid grid-cols-4 gap-2">
                {#each colorOptions as colorOption}
                  <button
                    type="button"
                    on:click={() => formData.color = colorOption.value}
                    class="w-full h-8 rounded-lg border-2 {colorOption.color} {formData.color === colorOption.value ? 'ring-2 ring-gray-400' : ''}"
                    title={colorOption.label}
                  ></button>
                {/each}
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Icon</label>
              <select
                bind:value={formData.icon}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {#each iconOptions as iconOption}
                  <option value={iconOption.value}>{iconOption.label}</option>
                {/each}
              </select>
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
                {editingSubject ? 'Update' : 'Create'} Subject
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}

    <!-- Subjects List -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      {#if isLoading}
        <div class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-600 mt-2">Loading subjects...</p>
        </div>
      {:else if subjects.length === 0}
        <div class="p-8 text-center">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No Subjects Found</h3>
          <p class="text-gray-600 mb-4">Create your first subject to get started.</p>
          <button
            on:click={() => { showForm = true; resetForm(); }}
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <CarbonAdd class="w-4 h-4" />
            Add Subject
          </button>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
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
              {#each subjects as subject}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div 
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                        style="background-color: {subject.color}"
                      >
                        {subject.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div class="font-semibold text-gray-900">{subject.name}</div>
                        <div class="text-sm text-gray-500">{subject.icon}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600 font-mono">
                    {subject.code}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600 max-w-xs">
                    <div class="truncate" title={subject.description}>
                      {subject.description || 'No description'}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {subject.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                      {subject.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">
                    <div>{formatDate(subject.createdAt)}</div>
                    <div class="text-xs text-gray-500">
                      by {subject.createdBy || 'Unknown'}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <button
                        on:click={() => startEdit(subject)}
                        class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Subject"
                      >
                        <CarbonEdit class="w-4 h-4" />
                      </button>
                      <button
                        on:click={() => deleteSubject(subject)}
                        class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Subject"
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
            Showing {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import PublicHeader from '$lib/components/PublicHeader.svelte';
  import CarbonAdd from '~icons/carbon/add';
  import CarbonArrowLeft from '~icons/carbon/arrow-left';
  import CarbonEdit from '~icons/carbon/edit';
  import CarbonView from '~icons/carbon/view';
  import CarbonTime from '~icons/carbon/time';
  import CarbonBookmark from '~icons/carbon/bookmark';
  import CarbonTrashCan from '~icons/carbon/trash-can';
  import CarbonWarning from '~icons/carbon/warning';

  let curriculums: any[] = [];
  let isLoading = true;
  let error = '';
  
  // Dependencies modal
  let showDependencies = false;
  let selectedCurriculum: any = null;
  let dependencies: any = null;
  let loadingDependencies = false;
  
  // Filters
  let filterGrade = '';
  let filterSubject = '';
  let filterActive = '';

  const subjects = [
    { value: 'math', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'english', label: 'English' },
    { value: 'social-studies', label: 'Social Studies' },
    { value: 'art', label: 'Art' },
    { value: 'music', label: 'Music' }
  ];

  async function loadCurriculums() {
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

      // Build query parameters
      const params = new URLSearchParams();
      if (filterGrade) params.append('grade', filterGrade);
      if (filterSubject) params.append('subject', filterSubject);
      if (filterActive) params.append('isActive', filterActive);

      const response = await fetch(`/api/admin/curriculum?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        curriculums = result.curriculums;
      } else {
        error = result.error || 'Failed to load curriculums';
      }

    } catch (err) {
      console.error('Error loading curriculums:', err);
      error = 'Failed to load curriculums';
    } finally {
      isLoading = false;
    }
  }

  async function checkDependencies(curriculum: any) {
    selectedCurriculum = curriculum;
    showDependencies = true;
    loadingDependencies = true;
    dependencies = null;

    try {
      const { getAuth, getIdToken } = await import('firebase/auth');
      const { app } = await import('$lib/firebase');
      
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (!user) return;

      const token = await getIdToken(user);

      const response = await fetch(`/api/admin/curriculum/${curriculum.id}/dependencies`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        dependencies = result.dependencies;
      }

    } catch (err) {
      console.error('Error checking dependencies:', err);
    } finally {
      loadingDependencies = false;
    }
  }

  async function deleteCurriculum(curriculum: any) {
    if (!browser || !confirm(`Are you sure you want to delete "${curriculum.chapterName}"? This action cannot be undone and will fail if there are questions using this curriculum.`)) {
      return;
    }
    
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

      const response = await fetch(`/api/admin/curriculum/${curriculum.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        await loadCurriculums(); // Refresh the list
        // Show success message briefly
        setTimeout(() => {
          error = '';
        }, 3000);
      } else {
        error = result.error || 'Failed to delete curriculum';
        // Scroll to top to show error message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

    } catch (err) {
      console.error('Error deleting curriculum:', err);
      error = 'Failed to delete curriculum';
    }
  }

  onMount(() => {
    loadCurriculums();
  });

  // Reload when filters change
  $: if (browser) {
    loadCurriculums();
  }

  function getDifficultyColor(level: string) {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Manage Curriculums - Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <PublicHeader />
  
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <h1 class="text-2xl font-bold text-gray-900">Curriculum Management</h1>
      </div>

      <a
        href="/admin/curriculum/create"
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <CarbonAdd class="w-4 h-4" />
        Create Curriculum
      </a>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <h3 class="font-semibold text-gray-900 mb-3">Filters</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Grade</label>
          <select
            bind:value={filterGrade}
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Grades</option>
            {#each Array.from({length: 12}, (_, i) => i + 1) as grade}
              <option value={grade.toString()}>Grade {grade}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
            bind:value={filterSubject}
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Subjects</option>
            {#each subjects as subject}
              <option value={subject.value}>{subject.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            bind:value={filterActive}
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div class="flex items-end">
          <button
            on:click={() => {
              filterGrade = '';
              filterSubject = '';
              filterActive = '';
            }}
            class="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      {#if isLoading}
        <div class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-600 mt-2">Loading curriculums...</p>
        </div>
      {:else if error}
        <div class="p-8 text-center">
          <p class="text-red-600">{error}</p>
        </div>
      {:else if curriculums.length === 0}
        <div class="p-8 text-center">
          <CarbonBookmark class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No Curriculums Found</h3>
          <p class="text-gray-600 mb-4">Get started by creating your first curriculum.</p>
          <a
            href="/admin/curriculum/create"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <CarbonAdd class="w-4 h-4" />
            Create Curriculum
          </a>
        </div>
      {:else}
        <!-- Curriculums List -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curriculum
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade & Subject
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
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
              {#each curriculums as curriculum}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div>
                      <div class="font-semibold text-gray-900">{curriculum.chapterName}</div>
                      <div class="text-sm text-gray-500">{curriculum.chapterId}</div>
                      {#if curriculum.curriculumDetails?.description}
                        <div class="text-sm text-gray-600 mt-1 max-w-xs truncate">
                          {curriculum.curriculumDetails.description}
                        </div>
                      {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm">
                      <div class="font-medium text-gray-900">Grade {curriculum.grade}</div>
                      <div class="text-gray-600 capitalize">{curriculum.subject}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getDifficultyColor(curriculum.level)}">
                      {curriculum.level}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">
                    <div class="space-y-1">
                      <div class="flex items-center gap-1">
                        <CarbonBookmark class="w-3 h-3" />
                        {curriculum.curriculumDetails?.topics?.length || 0} topics
                      </div>
                      <div class="flex items-center gap-1">
                        <CarbonTime class="w-3 h-3" />
                        {curriculum.curriculumDetails?.estimatedHours || 0}h estimated
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">
                    <div>{formatDate(curriculum.createdAt)}</div>
                    <div class="text-xs text-gray-500">
                      by {curriculum.metadata?.author || 'Unknown'}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-1">
                      <a
                        href="/admin/curriculum/edit/{curriculum.id}"
                        class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Curriculum"
                      >
                        <CarbonEdit class="w-4 h-4" />
                      </a>
                      <button
                        on:click={() => checkDependencies(curriculum)}
                        class="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                        title="Check Dependencies"
                      >
                        <CarbonWarning class="w-4 h-4" />
                      </button>
                      <button
                        on:click={() => deleteCurriculum(curriculum)}
                        class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Curriculum"
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

        <!-- Summary -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p class="text-sm text-gray-600">
            Showing {curriculums.length} curriculum{curriculums.length !== 1 ? 's' : ''}
          </p>
        </div>
      {/if}
    </div>

    <!-- Dependencies Modal -->
    {#if showDependencies}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">
                Dependencies Check: {selectedCurriculum?.chapterName}
              </h3>
              <button
                on:click={() => showDependencies = false}
                class="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {#if loadingDependencies}
              <div class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p class="text-gray-600 mt-2">Checking dependencies...</p>
              </div>
            {:else if dependencies}
              <div class="space-y-4">
                <!-- Summary -->
                <div class="bg-gray-50 rounded-lg p-4">
                  <h4 class="font-medium text-gray-900 mb-2">Summary</h4>
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-gray-600">Questions using this curriculum:</span>
                      <span class="font-semibold ml-2">{dependencies.questionCount}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">User progress records:</span>
                      <span class="font-semibold ml-2">{dependencies.userProgressCount}</span>
                    </div>
                  </div>
                </div>

                <!-- Delete Status -->
                <div class="p-4 rounded-lg {dependencies.canDelete ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
                  <div class="flex items-center gap-2">
                    {#if dependencies.canDelete}
                      <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span class="text-green-800 font-medium">Safe to delete</span>
                    {:else}
                      <CarbonWarning class="w-4 h-4 text-red-600" />
                      <span class="text-red-800 font-medium">Cannot delete - has dependencies</span>
                    {/if}
                  </div>
                  <p class="text-sm mt-2 {dependencies.canDelete ? 'text-green-700' : 'text-red-700'}">
                    {#if dependencies.canDelete}
                      This curriculum has no questions or user progress records. It can be safely deleted.
                    {:else}
                      This curriculum is being used by questions or has user progress data. Delete or reassign the questions first.
                    {/if}
                  </p>
                </div>

                <!-- Questions List -->
                {#if dependencies.questions.length > 0}
                  <div>
                    <h4 class="font-medium text-gray-900 mb-2">Questions using this curriculum ({dependencies.questions.length})</h4>
                    <div class="max-h-40 overflow-y-auto border rounded-lg">
                      {#each dependencies.questions as question}
                        <div class="p-3 border-b last:border-b-0 hover:bg-gray-50">
                          <div class="font-medium text-sm text-gray-900 truncate">
                            {question.question}
                          </div>
                          <div class="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span>Type: {question.type}</span>
                            <span>Difficulty: {question.difficulty}</span>
                            <span>ID: {question.id}</span>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- Actions -->
                <div class="flex justify-end gap-3 pt-4 border-t">
                  <button
                    on:click={() => showDependencies = false}
                    class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {#if dependencies.canDelete}
                    <button
                      on:click={() => { showDependencies = false; deleteCurriculum(selectedCurriculum); }}
                      class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete Curriculum
                    </button>
                  {:else}
                    <a
                      href="/admin/questions?curriculum={selectedCurriculum?.id}"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Manage Questions
                    </a>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import PublicHeader from '$lib/components/PublicHeader.svelte';
  import CarbonAdd from '~icons/carbon/add';
  import CarbonSubtract from '~icons/carbon/subtract';
  import CarbonSave from '~icons/carbon/save';
  import CarbonArrowLeft from '~icons/carbon/arrow-left';

  let isLoading = false;
  let error = '';
  let success = '';
  
  // Dynamic dropdown data
  let availableGrades: any[] = [];
  let availableSubjects: any[] = [];
  let loadingDropdowns = true;

  // Form data
  let formData = {
    year: new Date().getFullYear(),
    grade: '',
    subject: '',
    chapterId: '',
    chapterName: '',
    curriculumDetails: {
      topics: [''],
      learningObjectives: [''],
      prerequisites: [''],
      estimatedHours: 8,
      orderIndex: 1,
      description: ''
    },
    level: 'beginner',
    metadata: {
      region: 'US',
      board: 'Common Core',
      language: 'en'
    }
  };

  async function loadDropdownData() {
    if (!browser) return;
    
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

      const response = await fetch('/api/admin/dropdowns?include=grades,subjects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        availableGrades = result.data.grades || [];
        availableSubjects = result.data.subjects || [];
        
        // Set default values if available
        if (availableGrades.length > 0 && !formData.grade) {
          formData.grade = availableGrades[0].gradeNumber;
        }
        if (availableSubjects.length > 0 && !formData.subject) {
          formData.subject = availableSubjects[0].code;
        }
      } else {
        error = result.error || 'Failed to load dropdown data';
      }

    } catch (err) {
      console.error('Error loading dropdown data:', err);
      error = 'Failed to load dropdown data';
    } finally {
      loadingDropdowns = false;
    }
  }

  const levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const boards = [
    { value: 'Common Core', label: 'Common Core' },
    { value: 'State Standards', label: 'State Standards' },
    { value: 'IB', label: 'International Baccalaureate' },
    { value: 'Cambridge', label: 'Cambridge' },
    { value: 'Custom', label: 'Custom' }
  ];

  function addArrayItem(field: 'topics' | 'learningObjectives' | 'prerequisites') {
    formData.curriculumDetails[field] = [...formData.curriculumDetails[field], ''];
    formData = formData; // Trigger reactivity
  }

  function removeArrayItem(field: 'topics' | 'learningObjectives' | 'prerequisites', index: number) {
    if (formData.curriculumDetails[field].length > 1) {
      formData.curriculumDetails[field] = formData.curriculumDetails[field].filter((_, i) => i !== index);
      formData = formData; // Trigger reactivity
    }
  }

  function generateChapterId() {
    const subjectPrefix = formData.subject.substring(0, 2);
    const nameSlug = formData.chapterName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 20);
    formData.chapterId = `ch-${subjectPrefix}-${nameSlug}-${Date.now().toString(36)}`;
  }

  async function submitCurriculum() {
    if (!browser) return;
    
    isLoading = true;
    error = '';
    success = '';

    try {
      // Validate form
      if (!formData.chapterName.trim()) {
        error = 'Chapter name is required';
        return;
      }

      if (!formData.chapterId.trim()) {
        generateChapterId();
      }

      // Clean up arrays (remove empty strings)
      formData.curriculumDetails.topics = formData.curriculumDetails.topics.filter(t => t.trim());
      formData.curriculumDetails.learningObjectives = formData.curriculumDetails.learningObjectives.filter(o => o.trim());
      formData.curriculumDetails.prerequisites = formData.curriculumDetails.prerequisites.filter(p => p.trim());

      if (formData.curriculumDetails.topics.length === 0) {
        error = 'At least one topic is required';
        return;
      }

      if (formData.curriculumDetails.learningObjectives.length === 0) {
        error = 'At least one learning objective is required';
        return;
      }

      // Get auth token
      const { getAuth, getIdToken } = await import('firebase/auth');
      const { app } = await import('$lib/firebase');
      
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (!user) {
        error = 'You must be logged in to create curriculum';
        return;
      }

      const token = await getIdToken(user);

      const response = await fetch('/api/admin/curriculum', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        success = 'Curriculum created successfully!';
        setTimeout(() => {
          goto('/admin');
        }, 2000);
      } else {
        error = result.error || 'Failed to create curriculum';
      }

    } catch (err) {
      console.error('Submission error:', err);
      error = 'An error occurred while creating the curriculum';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadDropdownData();
  });

  // Auto-generate chapter ID when chapter name changes
  $: if (formData.chapterName && !formData.chapterId) {
    generateChapterId();
  }
</script>

<svelte:head>
  <title>Create Curriculum - Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <PublicHeader />
  
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <a 
        href="/admin" 
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <CarbonArrowLeft class="w-5 h-5" />
        Back to Admin
      </a>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Create New Curriculum</h1>

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

      <form on:submit|preventDefault={submitCurriculum} class="space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <input
              type="number"
              bind:value={formData.year}
              min="2020"
              max="2030"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Grade</label>
            {#if loadingDropdowns}
              <div class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500">
                Loading grades...
              </div>
            {:else if availableGrades.length === 0}
              <div class="space-y-2">
                <div class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-yellow-50 text-yellow-800">
                  No grades found. Create a grade first.
                </div>
                <a
                  href="/admin/grades"
                  class="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  → Create Grade
                </a>
              </div>
            {:else}
              <select
                bind:value={formData.grade}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a grade...</option>
                {#each availableGrades as grade}
                  <option value={grade.gradeNumber}>
                    {grade.gradeName} {grade.ageRange ? `(${grade.ageRange})` : ''}
                  </option>
                {/each}
              </select>
            {/if}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            {#if loadingDropdowns}
              <div class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500">
                Loading subjects...
              </div>
            {:else if availableSubjects.length === 0}
              <div class="space-y-2">
                <div class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-yellow-50 text-yellow-800">
                  No subjects found. Create a subject first.
                </div>
                <a
                  href="/admin/subjects"
                  class="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  → Create Subject
                </a>
              </div>
            {:else}
              <select
                bind:value={formData.subject}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a subject...</option>
                {#each availableSubjects as subject}
                  <option value={subject.code}>
                    {subject.name}
                  </option>
                {/each}
              </select>
            {/if}
          </div>
        </div>

        <!-- Chapter Information -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Chapter Name</label>
          <input
            type="text"
            bind:value={formData.chapterName}
            placeholder="e.g., Introduction to Decimals"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Chapter ID</label>
          <input
            type="text"
            bind:value={formData.chapterId}
            placeholder="Auto-generated from chapter name"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            required
          />
          <p class="text-xs text-gray-600 mt-1">Unique identifier for this chapter</p>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            bind:value={formData.curriculumDetails.description}
            rows="3"
            placeholder="Brief description of what this curriculum covers..."
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <!-- Topics -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Topics Covered</label>
          {#each formData.curriculumDetails.topics as topic, index}
            <div class="flex gap-2 mb-2">
              <input
                type="text"
                bind:value={formData.curriculumDetails.topics[index]}
                placeholder="e.g., Place value concepts"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <button
                type="button"
                on:click={() => removeArrayItem('topics', index)}
                disabled={formData.curriculumDetails.topics.length <= 1}
                class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CarbonSubtract class="w-4 h-4" />
              </button>
            </div>
          {/each}
          <button
            type="button"
            on:click={() => addArrayItem('topics')}
            class="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            <CarbonAdd class="w-4 h-4" />
            Add Topic
          </button>
        </div>

        <!-- Learning Objectives -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Learning Objectives</label>
          {#each formData.curriculumDetails.learningObjectives as objective, index}
            <div class="flex gap-2 mb-2">
              <input
                type="text"
                bind:value={formData.curriculumDetails.learningObjectives[index]}
                placeholder="e.g., Students will be able to identify decimal place values"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <button
                type="button"
                on:click={() => removeArrayItem('learningObjectives', index)}
                disabled={formData.curriculumDetails.learningObjectives.length <= 1}
                class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CarbonSubtract class="w-4 h-4" />
              </button>
            </div>
          {/each}
          <button
            type="button"
            on:click={() => addArrayItem('learningObjectives')}
            class="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            <CarbonAdd class="w-4 h-4" />
            Add Learning Objective
          </button>
        </div>

        <!-- Prerequisites -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Prerequisites</label>
          {#each formData.curriculumDetails.prerequisites as prerequisite, index}
            <div class="flex gap-2 mb-2">
              <input
                type="text"
                bind:value={formData.curriculumDetails.prerequisites[index]}
                placeholder="e.g., Basic understanding of whole numbers"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                on:click={() => removeArrayItem('prerequisites', index)}
                disabled={formData.curriculumDetails.prerequisites.length <= 1}
                class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CarbonSubtract class="w-4 h-4" />
              </button>
            </div>
          {/each}
          <button
            type="button"
            on:click={() => addArrayItem('prerequisites')}
            class="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            <CarbonAdd class="w-4 h-4" />
            Add Prerequisite
          </button>
        </div>

        <!-- Settings -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
            <select
              bind:value={formData.level}
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {#each levels as level}
                <option value={level.value}>{level.label}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Estimated Hours</label>
            <input
              type="number"
              bind:value={formData.curriculumDetails.estimatedHours}
              min="1"
              max="100"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Order Index</label>
            <input
              type="number"
              bind:value={formData.curriculumDetails.orderIndex}
              min="1"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p class="text-xs text-gray-600 mt-1">Display order in curriculum list</p>
          </div>
        </div>

        <!-- Metadata -->
        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Region</label>
              <input
                type="text"
                bind:value={formData.metadata.region}
                placeholder="US, UK, etc."
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Educational Board</label>
              <select
                bind:value={formData.metadata.board}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {#each boards as board}
                  <option value={board.value}>{board.label}</option>
                {/each}
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                bind:value={formData.metadata.language}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end gap-4 pt-6 border-t">
          <a
            href="/admin"
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={isLoading}
            class="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isLoading}
              <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Creating...
            {:else}
              <CarbonSave class="w-4 h-4" />
              Create Curriculum
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
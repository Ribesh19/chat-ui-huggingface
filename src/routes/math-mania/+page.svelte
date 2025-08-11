<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from '$app/navigation';
  import { base } from "$app/paths";
  import PublicHeader from "$lib/components/PublicHeader.svelte";
  import CarbonFunction from "~icons/carbon/function";
  import CarbonChevronRight from "~icons/carbon/chevron-right";
  import CarbonBook from "~icons/carbon/book";
  import CarbonUser from "~icons/carbon/user";

  type Subject = {
    id: string;
    name: string;
    code: string;
    color: string;
    icon: string;
    curriculumCount: number;
  };

  type Grade = {
    id: string;
    gradeNumber: number;
    gradeName: string;
    ageRange: string;
    subjects: Subject[];
  };

  // Reactive state
  let isLoading = true;
  let error = '';
  let grades: Grade[] = [];
  let stats = { totalGrades: 0, totalSubjects: 0, totalCombinations: 0 };

  const content = {
    heading: "Math Mania", 
    description: "Choose your grade and subject to start practicing with AI-adapted problems designed to strengthen skills step by step."
  };

  async function loadGradesAndSubjects() {
    try {
      isLoading = true;
      const response = await fetch('/api/math-mania/grades-subjects');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        grades = result.data.grades;
        stats = result.data.stats;
      } else {
        throw new Error(result.error || 'Failed to load data');
      }

    } catch (err) {
      console.error('Error loading grades and subjects:', err);
      error = 'Failed to load available grades and subjects';
      // Fallback to empty arrays
      grades = [];
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadGradesAndSubjects();
  });

  function getSubjectIcon(iconName: string) {
    // Default to book icon if specific icon not available
    return CarbonBook;
  }

  function navigateToMathMania(gradeNumber: number, subjectCode: string) {
    goto(`${base}/math-mania/curriculum?grade=${gradeNumber}&subject=${subjectCode}`);
  }
</script>

<svelte:head>
  <title>Math Mania - Choose Grade & Subject - Previsely</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <PublicHeader />

  <!-- Hero -->
  <section class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center">
        <div class="inline-flex items-center justify-center rounded-full bg-white/20 size-16 mb-6">
          <CarbonFunction class="w-8 h-8" />
        </div>
        <h1 class="text-3xl md:text-4xl font-bold mb-4">{content.heading}</h1>
        <p class="text-xl text-blue-100 max-w-2xl mx-auto">{content.description}</p>
      </div>
    </div>
  </section>

  <!-- Main content -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    {#if isLoading}
      <div class="animate-pulse space-y-8">
        <div class="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each Array(6) as _}
            <div class="bg-white rounded-xl p-6 space-y-4">
              <div class="h-6 bg-gray-200 rounded w-3/4"></div>
              <div class="h-4 bg-gray-200 rounded w-1/2"></div>
              <div class="space-y-3">
                <div class="h-12 bg-gray-200 rounded"></div>
                <div class="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else if error}
      <div class="text-center py-12">
        <div class="text-red-600 mb-6 text-lg">{error}</div>
        <button 
          onclick={loadGradesAndSubjects}
          class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    {:else if grades.length === 0}
      <div class="text-center py-12">
        <div class="text-gray-600 mb-4 text-lg">No grades or subjects available</div>
        <div class="text-sm text-gray-500 mb-6">
          Create some grades, subjects, and curriculum in the <a href="/admin" class="text-blue-600 hover:underline">admin panel</a> first.
        </div>
        <a 
          href="/admin" 
          class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Admin Panel
          <CarbonChevronRight class="ml-2 w-5 h-5" />
        </a>
      </div>
    {:else}
      <div class="space-y-8">
        <!-- Page title and stats -->
        <div class="text-center">
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Choose Your Grade & Subject
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Start your learning journey with {stats.totalCombinations} available combinations across {stats.totalGrades} grades
          </p>
        </div>

        <!-- Grade cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each grades as grade}
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
              <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {grade.gradeName}
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {grade.ageRange}
                    </p>
                  </div>
                  <div class="flex items-center justify-center size-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <CarbonUser class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                <div class="space-y-2">
                  <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Available Subjects:
                  </p>
                  {#each grade.subjects as subject}
                    <button
                      onclick={() => navigateToMathMania(grade.gradeNumber, subject.code)}
                      class="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                      style="border-left: 4px solid {subject.color || '#3B82F6'}"
                    >
                      <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-8 rounded-lg" style="background-color: {subject.color || '#3B82F6'}20">
                          <svelte:component this={getSubjectIcon(subject.icon)} class="w-4 h-4" style="color: {subject.color || '#3B82F6'}" />
                        </div>
                        <div class="text-left">
                          <div class="font-medium text-gray-900 dark:text-gray-100">{subject.name}</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">
                            {subject.curriculumCount} curriculum{subject.curriculumCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <CarbonChevronRight class="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Stats summary -->
        {#if stats.totalCombinations > 0}
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-blue-600">{stats.totalGrades}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Grades</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600">{stats.totalSubjects}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Subjects</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-purple-600">{stats.totalCombinations}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Combinations</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-orange-600">AI-Powered</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Learning</div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </section>
</div>
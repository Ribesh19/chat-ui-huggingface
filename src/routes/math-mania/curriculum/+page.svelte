<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import PublicHeader from "$lib/components/PublicHeader.svelte";
  import CarbonFunction from "~icons/carbon/function";
  import CarbonChevronRight from "~icons/carbon/chevron-right";
  import CarbonCheckmark from "~icons/carbon/checkmark";
  import CarbonFlash from "~icons/carbon/flash";
  import CarbonStar from "~icons/carbon/star";

  type TopicGroup = { 
    title: string; 
    curriculums: { 
      id: string; 
      chapterName: string; 
      questionCount: number;
      topics: string[];
    }[] 
  };

  type Curriculum = {
    id: string;
    chapterName: string;
    questionCount: number;
    topics: string[];
    level: string;
    orderIndex: number;
  };

  // Reactive state
  let isLoading = $state(true);
  let error = $state('');
  let selectedGrade = $state('11Plus'); // Changed to string
  let selectedSubject = $state('gl-maths-ages-10-11');

  // Get grade and subject from URL parameters
  $effect(() => {
    selectedGrade = $page.url.searchParams.get('grade') || '11Plus'; // Keep as string
    selectedSubject = $page.url.searchParams.get('subject') || 'gl-maths-ages-10-11';
  });
  
  // Data from API
  let topicGroups: TopicGroup[] = $state([]);
  let curriculums: Curriculum[] = $state([]);
  let stats = $state({ totalCurriculums: 0, totalQuestions: 0 });
  let userProgress: Record<string, any> = $state({});
  let showAuthPrompt = $state(false);

  const content = {
    heading: "Maths Zone", 
    description: "Conquer Maths with AI‑adapted problems designed to strengthen skills step by step."
  };

  type SkillStatus = "not" | "attempted" | "familiar" | "proficient" | "mastered";
  const statusToClass: Record<SkillStatus, string> = {
    not: "bg-white border-gray-300",
    attempted: "bg-orange-100 border-orange-300", 
    familiar: "bg-amber-100 border-amber-300",
    proficient: "bg-green-100 border-green-300",
    mastered: "bg-purple-200 border-purple-400",
  };

  async function loadMathManiaData() {
    try {
      isLoading = true;
      error = '';
      
      // Load curriculum data and user progress in parallel
      const [curriculumResponse] = await Promise.all([
        fetch(`/api/math-mania?grade=${selectedGrade}&subject=${selectedSubject}`),
        loadUserProgress()
      ]);
      
      if (!curriculumResponse.ok) {
        throw new Error(`HTTP ${curriculumResponse.status}: ${curriculumResponse.statusText}`);
      }

      const result = await curriculumResponse.json();

      if (result.success) {
        topicGroups = result.data.topicGroups;
        curriculums = result.data.curriculums;
        stats = result.data.stats;
      } else {
        throw new Error(result.error || 'Failed to load data');
      }

    } catch (err) {
      console.error('Error loading math-mania data:', err);
      error = 'Failed to load curriculum data';
      // Fallback to empty arrays
      topicGroups = [];
      curriculums = [];
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadMathManiaData();
  });

  // Reload when grade/subject changes
  $effect(() => {
    if (selectedGrade && selectedSubject) {
      loadMathManiaData();
    }
  });

  // Generate skill boxes for each curriculum based on question sets and user progress
  function generateSkillBoxes(curriculum: Curriculum): SkillStatus[] {
    // Each skill box represents a question set (up to 10 questions)
    // For now, estimate number of question sets based on question count
    const estimatedQuestionSets = Math.max(Math.ceil(curriculum.questionCount / 10), 1);
    
    const progress = userProgress[curriculum.id];
    
    if (!progress) {
      return Array.from({ length: estimatedQuestionSets }, () => "not");
    }
    
    // Calculate status based on overall progress
    const accuracy = progress.accuracy || 0;
    let status: SkillStatus = "not";
    
    if (accuracy >= 90) status = "mastered";
    else if (accuracy >= 70) status = "proficient";
    else if (accuracy >= 50) status = "familiar";
    else if (accuracy > 0) status = "attempted";
    
    // Show the mastery status in all boxes if user has progress
    // This gives visual feedback that they've worked on this curriculum
    return Array.from({ length: estimatedQuestionSets }, () => status);
  }

  async function loadUserProgress() {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.warn('No auth token available, user needs to sign in');
        showAuthPrompt = true;
        userProgress = {};
        return;
      }
      
      showAuthPrompt = false;

      console.log('Loading user progress with auth token...');
      console.log('Query params:', { grade: selectedGrade, subject: selectedSubject });
      const response = await fetch(`/api/math-mania/progress?grade=${selectedGrade}&subject=${selectedSubject}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Progress response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Progress result:', result);
        
        if (result.success) {
          userProgress = result.data.reduce((acc: any, progress: any) => {
            acc[progress.curriculumId] = progress;
            return acc;
          }, {});
          console.log('User progress loaded:', userProgress);
          console.log('Number of progress records:', result.data.length);
        }
      } else {
        console.error('Failed to load progress:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
      userProgress = {};
    }
  }

  async function getAuthToken(): Promise<string | null> {
    try {
      const { auth } = await import('$lib/firebase/client');
      
      // Wait for auth state to be ready with timeout
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('Auth state check timed out');
          resolve(null);
        }, 5000); // 5 second timeout
        
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          clearTimeout(timeout);
          unsubscribe(); // Only listen once
          
          console.log('Auth state ready. Current user:', user?.email || 'null');
          console.log('User object:', user);
          
          if (!user) {
            console.log('No user is signed in');
            resolve(null);
            return;
          }
          
          try {
            const token = await user.getIdToken();
            console.log('ID Token obtained:', token ? 'Present' : 'Missing');
            resolve(token);
          } catch (error) {
            console.error('Error getting ID token:', error);
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }
</script>

<svelte:head>
  <title>Maths Zone - Previsely</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <PublicHeader />

  <!-- Hero -->
  <section class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="inline-flex items-center justify-center rounded-full bg-white/20 size-10">
            <CarbonFunction class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-2xl md:text-3xl font-bold">Grade {selectedGrade} • {selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)}</h1>
            <p class="mt-1 text-blue-100">{content.description}</p>
          </div>
        </div>
        <a 
          href="{base}/math-mania"
          class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
        >
          ← Choose Different Grade/Subject
        </a>
      </div>
    </div>
  </section>

  <!-- Body with sidebar like Khan Academy -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
    <!-- Sidebar -->
    <aside class="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/70 backdrop-blur p-4 h-max sticky top-20">
      {#if isLoading}
        <div class="animate-pulse space-y-4">
          <div class="h-6 bg-gray-200 rounded w-3/4"></div>
          <div class="space-y-2 pl-4">
            <div class="h-4 bg-gray-200 rounded w-full"></div>
            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div class="h-6 bg-gray-200 rounded w-2/3"></div>
        </div>
      {:else if error}
        <div class="text-red-600 text-sm p-3 bg-red-50 rounded-lg">
          {error}
        </div>
      {:else}
        <nav class="space-y-2">
          {#each topicGroups as topicGroup}
            <details class="group" open>
              <summary class="list-none cursor-pointer flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-gray-700/60">
                <span>{topicGroup.title}</span>
                <CarbonChevronRight class="w-4 h-4 transition-transform group-open:rotate-90" />
              </summary>
              <ul class="mt-1 pl-3 space-y-1">
                {#each topicGroup.curriculums as curriculum}
                  <li>
                    <a 
                      href="{base}/math-mania/exercise?curriculum={curriculum.id}&grade={selectedGrade}&subject={selectedSubject}" 
                      class="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/60"
                    >
                      <CarbonCheckmark class="w-4 h-4 text-blue-600" /> 
                      {curriculum.chapterName}
                      <span class="ml-auto text-xs text-gray-500">({curriculum.questionCount})</span>
                    </a>
                  </li>
                {/each}
              </ul>
            </details>
          {/each}
        </nav>
      {/if}
    </aside>

    <!-- Main content -->
    <main class="space-y-6">
      <!-- Auth Prompt -->
      {#if showAuthPrompt}
        <div class="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
          <h3 class="text-lg font-semibold text-blue-900 mb-2">Sign in to Track Your Progress</h3>
          <p class="text-blue-800 mb-4">Create a free account to save your progress, track mastery levels, and review your answers.</p>
          <a 
            href="{base}/auth"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In / Create Account
          </a>
        </div>
      {/if}

      <!-- Legend -->
      <div class="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/70 backdrop-blur p-4 flex flex-wrap items-center gap-4 text-sm">
        <div class="flex items-center gap-2"><span class="skill-box border-purple-400 bg-purple-200"></span> Mastered</div>
        <div class="flex items-center gap-2"><span class="skill-box border-green-300 bg-green-100"></span> Proficient</div>
        <div class="flex items-center gap-2"><span class="skill-box border-amber-300 bg-amber-100"></span> Familiar</div>
        <div class="flex items-center gap-2"><span class="skill-box border-orange-300 bg-orange-100"></span> Attempted</div>
        <div class="flex items-center gap-2"><span class="skill-box border-gray-300 bg-white"></span> Not started</div>
        <div class="flex items-center gap-2"><CarbonFlash class="w-4 h-4 text-blue-600" /> Quiz</div>
        <div class="flex items-center gap-2"><CarbonStar class="w-4 h-4 text-blue-600" /> Unit test</div>
      </div>

      <!-- Curriculum rows with mastery boxes -->
      <div class="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/70 backdrop-blur">
        {#if isLoading}
          <div class="animate-pulse p-6 space-y-4">
            {#each Array(8) as _}
              <div class="flex items-center gap-4">
                <div class="h-4 bg-gray-200 rounded w-1/4"></div>
                <div class="flex gap-2">
                  {#each Array(10) as _}
                    <div class="w-6 h-6 bg-gray-200 rounded"></div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {:else if error}
          <div class="text-center p-8">
            <div class="text-red-600 mb-4">Failed to load curriculum data</div>
            <button 
              onclick={loadMathManiaData}
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        {:else if curriculums.length === 0}
          <div class="text-center p-8">
            <div class="text-gray-600 mb-4">No curriculum found for Grade {selectedGrade} {selectedSubject}</div>
            <div class="text-sm text-gray-500">
              Create some curriculum in the <a href="/admin" class="text-blue-600 hover:underline">admin panel</a> first.
            </div>
          </div>
        {:else}
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
            {#each curriculums as curriculum, index}
              <div class="border-b last:border-b-0 border-gray-200/60 dark:border-gray-700/60 p-4">
                <div class="mb-2">
                  <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">{curriculum.chapterName}</div>
                  <div class="text-xs text-gray-500">
                    {curriculum.questionCount} question{curriculum.questionCount !== 1 ? 's' : ''} • {curriculum.level}
                  </div>
                </div>
                <div class="flex flex-wrap items-center gap-1">
                  {#each generateSkillBoxes(curriculum) as skillStatus, i}
                    <a
                      href="{base}/math-mania/exercise?curriculum={curriculum.id}&set={i + 1}&grade={selectedGrade}&subject={selectedSubject}"
                      class="skill-box {statusToClass[skillStatus]} hover:ring-1 hover:ring-blue-500"
                      aria-label={`Open question set ${i + 1} from ${curriculum.chapterName}`}
                      title="Question set {i + 1}: {curriculum.chapterName} (up to 10 questions)"
                    ></a>
                  {/each}
                  <a
                    href="{base}/math-mania/exercise?curriculum={curriculum.id}&grade={selectedGrade}&subject={selectedSubject}"
                    class="ml-2 p-1 hover:bg-blue-50 rounded transition-colors"
                    title="Practice mode"
                  >
                    <CarbonFlash class="w-4 h-4 text-blue-600" />
                  </a>
                  <CarbonStar class="w-4 h-4 text-blue-600" title="Quiz mode" />
                  {#if userProgress[curriculum.id]}
                    <a
                      href="{base}/math-mania/review?curriculum={curriculum.id}&grade={selectedGrade}&subject={selectedSubject}"
                      class="ml-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      title="Review your answers"
                    >
                      Review
                    </a>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Stats Summary -->
      {#if !isLoading && !error && stats.totalCurriculums > 0}
        <div class="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/70 backdrop-blur p-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-blue-600">{stats.totalCurriculums}</div>
              <div class="text-sm text-gray-600">Curriculums</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-green-600">{stats.totalQuestions}</div>
              <div class="text-sm text-gray-600">Questions</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-purple-600">Grade {selectedGrade}</div>
              <div class="text-sm text-gray-600">Level</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-orange-600 capitalize">{selectedSubject}</div>
              <div class="text-sm text-gray-600">Subject</div>
            </div>
          </div>
        </div>
      {/if}
    </main>
  </section>
</div>


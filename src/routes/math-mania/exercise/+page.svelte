<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import PublicHeader from "$lib/components/PublicHeader.svelte";
  import MathRenderer from "$lib/components/MathRenderer.svelte";
  import CarbonCheckmarkFilled from "~icons/carbon/checkmark-filled";
  import CarbonCloseFilled from "~icons/carbon/close-filled";
  import CarbonChevronLeft from "~icons/carbon/chevron-left";
  import CarbonChevronRight from "~icons/carbon/chevron-right";
  import CarbonIdea from "~icons/carbon/idea";
  import CarbonHelp from "~icons/carbon/help";
  import CarbonStar from "~icons/carbon/star";
  import CarbonStarFilled from "~icons/carbon/star-filled";
  import CarbonTrophy from "~icons/carbon/trophy";
  import CarbonRocket from "~icons/carbon/rocket";
  import CarbonTime from "~icons/carbon/time";

  interface Question {
    id: string;
    type: string;
    question: {
      text: string;
      imageUrl?: string;
    };
    options: {
      a: { text: string };
      b: { text: string };
      c: { text: string };
      d: { text: string };
      e?: { text: string };
    };
    explanation: string;
    hints: string[];
    difficulty: string;
    points: number;
    estimatedTime: number;
  }

  interface Curriculum {
    id: string;
    chapterName: string;
    topics: string[];
    level: string;
  }

  interface Breadcrumb {
    grade: { gradeNumber: number; gradeName: string } | null;
    subject: { name: string; code: string } | null;
    curriculum: string;
  }

  // State
  let isLoading = $state(true);
  let error = $state('');
  let curriculum: Curriculum | null = $state(null);
  let questions: Question[] = $state([]);
  let currentQuestionIndex = $state(0);
  let breadcrumb: Breadcrumb | null = $state(null);

  // Exercise state
  let selectedAnswer: string | null = $state(null);
  let showFeedback = $state(false);
  let showHint = $state(false);
  let questionsAnswered = $state(0);
  let correctAnswers = $state(0);
  let streak = $state(0);
  let totalPoints = $state(0);
  let questionHistory: {correct: boolean}[] = $state([]);
  let timeSpent = $state(0);
  let timerInterval: number | null = null;
  let sessionId = $state('');

  // Generate session ID on component mount
  $effect(() => {
    if (!sessionId) {
      sessionId = generateSessionId();
    }
  });

  $effect(() => {
    timerInterval = setInterval(() => {
      timeSpent++;
    }, 1000);
    
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  });

  async function loadExerciseData() {
    try {
      isLoading = true;
      const curriculumId = $page.url.searchParams.get('curriculum');
      const questionParam = $page.url.searchParams.get('question');
      
      if (!curriculumId) {
        error = 'No curriculum selected';
        return;
      }

      const response = await fetch(`/api/math-mania/exercise?curriculum=${curriculumId}${questionParam ? `&question=${questionParam}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        curriculum = result.data.curriculum;
        breadcrumb = result.data.breadcrumb;
        
        if (result.data.question) {
          // Single question mode
          questions = [result.data.question];
          currentQuestionIndex = (result.data.questionIndex || 1) - 1;
        } else {
          // All questions mode
          questions = result.data.questions;
          currentQuestionIndex = 0;
        }
      } else {
        throw new Error(result.error || 'Failed to load exercise');
      }

    } catch (err) {
      console.error('Error loading exercise:', err);
      error = err.message || 'Failed to load exercise data';
    } finally {
      isLoading = false;
    }
  }

  async function checkAnswer() {
    if (selectedAnswer === null || !currentQuestion) return;
    
    try {
      const response = await fetch('/api/math-mania/check-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedAnswer
        })
      });

      const result = await response.json();

      if (result.success) {
        showFeedback = true;
        questionsAnswered++;
        
        const isCorrect = result.data.isCorrect;
        const points = result.data.points * (streak > 3 ? 2 : 1);
        questionHistory.push({ correct: isCorrect });
        
        if (isCorrect) {
          correctAnswers++;
          streak++;
          totalPoints += points;
        } else {
          streak = 0;
        }

        // Save answer to history
        await saveAnswerHistory({
          sessionId,
          curriculumId: $page.url.searchParams.get('curriculum'),
          questionId: currentQuestion.id,
          questionSetId: null, // Will be implemented later for question sets
          questionNumber: currentQuestionIndex + 1,
          questionText: currentQuestion.question.text,
          selectedAnswer,
          correctAnswer: result.data.correctAnswer,
          isCorrect,
          points,
          timeSpent: timeSpent,
          hints: showHint ? currentQuestion.hints.slice(0, 1) : []
        });
        
      } else {
        console.error('Failed to check answer:', result.error);
        alert('Failed to check answer. Please try again.');
      }
    } catch (err) {
      console.error('Error checking answer:', err);
      alert('Failed to check answer. Please try again.');
    }
  }

  async function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      resetQuestionState();
    } else {
      // Exercise complete - save progress and redirect to review
      await saveProgress();
      
      // Show completion message then redirect to review
      // Use URL params to maintain consistency
      const grade = $page.url.searchParams.get('grade') || '11Plus';
      const subject = $page.url.searchParams.get('subject') || 'gl-maths-ages-10-11';
      const curriculumId = $page.url.searchParams.get('curriculum');
      
      setTimeout(() => {
        window.location.href = `${base}/math-mania/review?curriculum=${curriculumId}&session=${sessionId}&grade=${grade}&subject=${subject}`;
      }, 2000);
      
      alert(`Exercise complete! You got ${correctAnswers}/${questionsAnswered} correct with ${totalPoints} points!\n\nRedirecting to review...`);
    }
  }

  function resetQuestionState() {
    selectedAnswer = null;
    showFeedback = false;
    showHint = false;
  }

  function selectAnswer(value: string) {
    if (!showFeedback) {
      selectedAnswer = value;
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async function saveAnswerHistory(answerData: any) {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.warn('No auth token available, skipping answer history save');
        return;
      }

      const response = await fetch('/api/math-mania/answer-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(answerData)
      });

      if (!response.ok) {
        console.error('Failed to save answer history:', response.statusText);
      }
    } catch (error) {
      console.error('Error saving answer history:', error);
    }
  }

  async function saveProgress() {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.warn('No auth token available, skipping progress save');
        return;
      }

      const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
      const curriculumId = $page.url.searchParams.get('curriculum');
      
      if (!curriculumId) return;

      // Get subject from URL params to ensure consistency
      const subjectParam = $page.url.searchParams.get('subject') || 'math';
      const gradeParam = $page.url.searchParams.get('grade') || '5'; // Keep as string
      
      const progressData = {
        curriculumId,
        grade: breadcrumb?.grade?.gradeNumber || gradeParam, // Use string grade
        subject: subjectParam,  // Use URL param directly instead of breadcrumb
        questionSetId: null,
        questionsAttempted: questionsAnswered,
        questionsCorrect: correctAnswers,
        totalQuestions: questions.length,
        accuracy,
        timeSpent,
        completedAt: new Date().toISOString()
      };

      console.log('🎯 Saving progress data:', progressData);
      console.log('📊 Stats:', { correctAnswers, questionsAnswered, accuracy });
      console.log('🔑 Token available:', !!token);

      const response = await fetch('/api/math-mania/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(progressData)
      });

      console.log('📨 Progress save response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Progress saved successfully:', result);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to save progress:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  async function getAuthToken(): Promise<string | null> {
    try {
      const { auth } = await import('$lib/firebase/client');
      
      // Wait for auth state to be ready
      return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          unsubscribe(); // Only listen once
          
          if (!user) {
            resolve(null);
            return;
          }
          
          try {
            const token = await user.getIdToken();
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

  onMount(() => {
    loadExerciseData();
  });

  // Reactive computations
  let currentQuestion = $derived(questions[currentQuestionIndex] || null);
  let accuracy = $derived(questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0);
  let masteryLevel = $derived(accuracy >= 90 ? "Mastered" : accuracy >= 70 ? "Proficient" : accuracy >= 50 ? "Familiar" : "Learning");
  let masteryColor = $derived(accuracy >= 90 ? "text-purple-600" : accuracy >= 70 ? "text-green-600" : accuracy >= 50 ? "text-amber-600" : "text-blue-600");
</script>

<svelte:head>
  <title>Value of a decimal digit - Math Practice</title>
</svelte:head>

<div class="min-h-screen bg-[#f7f8fa]">
  <PublicHeader />
  
  <!-- Khan Academy-style header bar -->
  <div class="bg-white border-b border-gray-200 sticky top-[64px] z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-14">
        <div class="flex items-center gap-4">
          <a href="{base}/math-mania/curriculum?grade={$page.url.searchParams.get('grade') || '5'}&subject={$page.url.searchParams.get('subject') || 'math'}" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <CarbonChevronLeft class="w-5 h-5" />
          </a>
          <div class="flex items-center gap-2">
            {#if breadcrumb?.grade}
              <span class="text-sm text-gray-600">{breadcrumb.grade.gradeName}</span>
              <span class="text-gray-400">›</span>
            {/if}
            {#if breadcrumb?.subject}
              <span class="text-sm text-gray-600">{breadcrumb.subject.name}</span>
              <span class="text-gray-400">›</span>
            {/if}
            <span class="text-sm font-semibold text-gray-900">{curriculum?.chapterName || 'Loading...'}</span>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 text-sm">
            <CarbonTime class="w-4 h-4 text-gray-500" />
            <span class="text-gray-700 font-medium">{formatTime(timeSpent)}</span>
          </div>
          <div class="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full">
            <CarbonTrophy class="w-4 h-4 text-blue-600" />
            <span class="text-sm font-semibold text-blue-700">{totalPoints} pts</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6">
      <!-- Main exercise area -->
      <div class="space-y-4">
        <!-- Progress bar -->
        <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Progress</span>
            <span class="text-sm font-semibold {masteryColor}">{masteryLevel}</span>
          </div>
          <div class="flex gap-1">
            {#each Array(Math.min(questions.length, 10)) as _, i}
              {@const answered = i < questionHistory.length}
              {@const correct = answered && questionHistory[i]?.correct}
              <div class="flex-1 h-2 rounded-full {answered ? (correct ? 'bg-green-500' : 'bg-red-400') : 'bg-gray-200'}"></div>
            {/each}
          </div>
          <div class="flex items-center justify-between mt-2">
            <span class="text-xs text-gray-500">{questionsAnswered} of {questions.length} questions</span>
            <span class="text-xs font-medium text-gray-700">{accuracy}% accuracy</span>
          </div>
        </div>

        <!-- Question card -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          {#if isLoading}
            <div class="animate-pulse p-6">
              <div class="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div class="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div class="h-20 bg-gray-200 rounded mb-4"></div>
              <div class="grid grid-cols-2 gap-3">
                {#each Array(4) as _}
                  <div class="h-12 bg-gray-200 rounded"></div>
                {/each}
              </div>
            </div>
          {:else if error}
            <div class="p-6 text-center">
              <div class="text-red-600 mb-4">{error}</div>
              <button 
                onclick={loadExerciseData}
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          {:else if currentQuestion}
            <div class="p-6 border-b border-gray-100">
              <div class="flex items-start justify-between mb-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                {#if streak > 2}
                  <div class="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-full">
                    <CarbonRocket class="w-4 h-4 text-orange-500" />
                    <span class="text-xs font-semibold text-orange-700">{streak} streak!</span>
                  </div>
                {/if}
              </div>
              
              <div class="space-y-4">
                <div class="text-lg text-gray-900 font-medium">
                  <MathRenderer content={currentQuestion.question.text} />
                </div>
                
                {#if currentQuestion.question.imageUrl}
                  <div class="text-center py-4">
                    <img src={currentQuestion.question.imageUrl} alt="Question image" class="max-w-full h-auto rounded-lg" />
                  </div>
                {/if}
                
                {#if showHint && currentQuestion.hints.length > 0}
                  <div class="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <CarbonIdea class="w-5 h-5 text-blue-600 mt-0.5" />
                    <div class="text-sm text-blue-900">
                      <MathRenderer content={currentQuestion.hints[0]} />
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <div class="p-6">
              <div class="grid grid-cols-2 gap-3">
                {#each Object.entries(currentQuestion.options) as [key, option]}
                  {#if option.text}
                    <button
                      onclick={() => selectAnswer(key)}
                      disabled={showFeedback}
                      class="relative flex items-center justify-center p-4 rounded-lg border-2 transition-all text-left
                        {selectedAnswer === key ? 
                          (showFeedback ? 'border-blue-500 bg-blue-50' : 'border-blue-500 bg-blue-50 ring-2 ring-blue-200') 
                          : 'border-gray-200 bg-white hover:bg-gray-50'}
                        {showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}"
                    >
                      <span class="text-sm font-medium text-gray-900 mr-2">{key.toUpperCase()})</span>
                      <span class="text-sm text-gray-900">
                        <MathRenderer content={option.text} inline={true} />
                      </span>
                      
                      {#if showFeedback && selectedAnswer === key}
                        <CarbonCheckmarkFilled class="absolute top-2 right-2 w-5 h-5 text-blue-600" />
                      {/if}
                    </button>
                  {/if}
                {/each}
              </div>

              {#if showFeedback}
                <div class="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div class="flex items-start gap-3">
                    <CarbonCheckmarkFilled class="w-6 h-6 text-blue-600 mt-0.5" />
                    <div>
                      <p class="font-semibold text-blue-900">Answer submitted!</p>
                      <p class="text-sm text-blue-800 mt-1">Points earned: {currentQuestion.points * (streak > 3 ? 2 : 1)}</p>
                      {#if currentQuestion.explanation}
                        <div class="text-sm text-blue-800 mt-2">
                          <MathRenderer content={currentQuestion.explanation} />
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/if}

              <div class="flex items-center gap-3 mt-6">
                {#if !showFeedback}
                  <button
                    onclick={checkAnswer}
                    disabled={selectedAnswer === null}
                    class="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Check
                  </button>
                  {#if currentQuestion.hints.length > 0}
                    <button
                      onclick={() => showHint = !showHint}
                      class="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <CarbonIdea class="w-5 h-5 text-gray-600" />
                    </button>
                  {/if}
                {:else}
                  <button
                    onclick={nextQuestion}
                    class="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {#if currentQuestionIndex < questions.length - 1}
                      Continue
                      <CarbonChevronRight class="w-5 h-5" />
                    {:else}
                      Finish Exercise
                      <CarbonTrophy class="w-5 h-5" />
                    {/if}
                  </button>
                {/if}
              </div>
            </div>
          {:else}
            <div class="p-6 text-center">
              <div class="text-gray-600">No questions available</div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="space-y-4">
        <!-- Score summary -->
        <div class="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-4">Your progress</h3>
          
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Questions</span>
              <span class="text-sm font-semibold text-gray-900">{questionsAnswered}/{questions.length}</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Correct</span>
              <span class="text-sm font-semibold text-green-600">{correctAnswers}</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Streak</span>
              <div class="flex items-center gap-1">
                {#each Array(Math.min(streak, 5)) as _}
                  <CarbonStarFilled class="w-4 h-4 text-yellow-500" />
                {/each}
                {#each Array(Math.max(0, 5 - streak)) as _}
                  <CarbonStar class="w-4 h-4 text-gray-300" />
                {/each}
              </div>
            </div>
            
            <div class="pt-3 border-t border-gray-200">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700">Total points</span>
                <span class="text-lg font-bold text-blue-600">{totalPoints}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Related topics -->
        <div class="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-3">Topics covered</h3>
          {#if curriculum?.topics && curriculum.topics.length > 0}
            <div class="space-y-2">
              {#each curriculum.topics as topic}
                <div class="text-sm text-gray-700 flex items-center gap-2">
                  <div class="w-2 h-2 bg-blue-600 rounded-full"></div>
                  {topic}
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-sm text-gray-500">No topics specified</div>
          {/if}
        </div>

        <!-- Tips card -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
          <div class="flex items-start gap-3">
            <div class="p-2 bg-blue-100 rounded-lg">
              <CarbonIdea class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 class="font-semibold text-blue-900 mb-1">Pro tip</h4>
              <p class="text-sm text-blue-800">
                Remember: The first digit after the decimal is tenths, second is hundredths, and third is thousandths!
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</div>

<style>
  :global(.underline) {
    text-decoration-thickness: 3px !important;
  }
</style>
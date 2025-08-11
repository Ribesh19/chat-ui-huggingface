<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import PublicHeader from "$lib/components/PublicHeader.svelte";
  import MathRenderer from "$lib/components/MathRenderer.svelte";
  import CarbonChevronLeft from "~icons/carbon/chevron-left";
  import CarbonCheckmarkFilled from "~icons/carbon/checkmark-filled";
  import CarbonCloseFilled from "~icons/carbon/close-filled";
  import CarbonTime from "~icons/carbon/time";
  import CarbonTrophy from "~icons/carbon/trophy";

  interface AnswerHistory {
    id: string;
    sessionId: string;
    curriculumId: string;
    questionId: string;
    questionNumber: number;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    points: number;
    timeSpent: number;
    answeredAt: Date;
  }

  interface Session {
    sessionId: string;
    curriculumId: string;
    answers: AnswerHistory[];
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    totalPoints: number;
    timeSpent: number;
    startTime: Date;
    endTime: Date;
  }

  // State
  let isLoading = $state(true);
  let error = $state('');
  let sessions: Session[] = $state([]);
  let selectedSession: Session | null = $state(null);
  let curriculumName = $state('');

  async function loadAnswerHistory() {
    try {
      isLoading = true;
      const curriculumId = $page.url.searchParams.get('curriculum');
      const sessionId = $page.url.searchParams.get('session');
      
      if (!curriculumId) {
        error = 'No curriculum specified';
        return;
      }

      const token = await getAuthToken();
      console.log('Auth token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        error = 'Please sign in to view your review';
        return;
      }

      let url = `/api/math-mania/answer-history?curriculum=${curriculumId}`;
      if (sessionId) {
        url += `&session=${sessionId}`;
      }
      
      console.log('Fetching answer history from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        sessions = (result.data.sessions || []).map((session: any) => ({
          ...session,
          accuracy: session.totalQuestions > 0 ? Math.round((session.correctAnswers / session.totalQuestions) * 100) : 0,
          totalPoints: (session.answers || []).reduce((sum: number, answer: any) => sum + (answer.points || 0), 0),
          timeSpent: (session.answers || []).reduce((sum: number, answer: any) => sum + (answer.timeSpent || 0), 0),
          startTime: session.startTime ? new Date(session.startTime) : new Date(),
          endTime: session.endTime ? new Date(session.endTime) : new Date()
        }));

        // If specific session requested, select it
        if (sessionId && sessions.length > 0) {
          selectedSession = sessions.find(s => s.sessionId === sessionId) || sessions[0];
        } else if (sessions.length > 0) {
          selectedSession = sessions[0];
        }

        // Load curriculum name
        if (sessions.length > 0) {
          await loadCurriculumName(curriculumId);
        }
      } else {
        throw new Error(result.error || 'Failed to load answer history');
      }

    } catch (err) {
      console.error('Error loading answer history:', err);
      error = err.message || 'Failed to load review data';
    } finally {
      isLoading = false;
    }
  }

  async function loadCurriculumName(curriculumId: string) {
    try {
      const token = await getAuthToken();
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/admin/curriculum/${curriculumId}`, {
        headers
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Curriculum result:', result);
        if (result.success && result.curriculum && result.curriculum.chapterName) {
          curriculumName = result.curriculum.chapterName;
        } else {
          console.warn('Curriculum data missing or malformed:', result);
          curriculumName = 'Unknown Curriculum';
        }
      } else {
        console.warn(`Failed to load curriculum name: ${response.status} ${response.statusText}`);
        curriculumName = 'Unknown Curriculum';
      }
    } catch (error) {
      console.error('Error loading curriculum name:', error);
      curriculumName = 'Unknown Curriculum';
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

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getMasteryColor(accuracy: number): string {
    if (accuracy >= 90) return 'text-purple-600';
    if (accuracy >= 70) return 'text-green-600';
    if (accuracy >= 50) return 'text-amber-600';
    return 'text-orange-600';
  }

  function getMasteryBg(accuracy: number): string {
    if (accuracy >= 90) return 'bg-purple-50 border-purple-200';
    if (accuracy >= 70) return 'bg-green-50 border-green-200';
    if (accuracy >= 50) return 'bg-amber-50 border-amber-200';
    return 'bg-orange-50 border-orange-200';
  }

  onMount(() => {
    loadAnswerHistory();
  });
</script>

<svelte:head>
  <title>Review - Math Practice</title>
</svelte:head>

<div class="min-h-screen bg-[#f7f8fa]">
  <PublicHeader />
  
  <!-- Header bar -->
  <div class="bg-white border-b border-gray-200 sticky top-[64px] z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-14">
        <div class="flex items-center gap-4">
          <a href="{base}/math-mania/curriculum?grade={$page.url.searchParams.get('grade') || '11Plus'}&subject={$page.url.searchParams.get('subject') || 'gl-maths-ages-10-11'}" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <CarbonChevronLeft class="w-5 h-5" />
          </a>
          <div>
            <h1 class="text-lg font-semibold text-gray-900">Review Session</h1>
            <p class="text-sm text-gray-600">{curriculumName || 'Loading...'}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    {#if isLoading}
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 mt-4">Loading your review...</p>
      </div>
    {:else if error}
      <div class="text-center py-12">
        <div class="text-red-600 mb-4">{error}</div>
        <button 
          onclick={loadAnswerHistory}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    {:else if sessions.length === 0}
      <div class="text-center py-12">
        <p class="text-gray-600 mb-4">No practice sessions found for this curriculum.</p>
        <a 
          href="{base}/math-mania/curriculum?grade={$page.url.searchParams.get('grade') || '11Plus'}&subject={$page.url.searchParams.get('subject') || 'gl-maths-ages-10-11'}"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Start Practicing
        </a>
      </div>
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6">
        <!-- Sessions Sidebar -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Practice Sessions</h2>
          <div class="space-y-3">
            {#each sessions as session}
              <button
                onclick={() => selectedSession = session}
                class="w-full text-left p-3 rounded-lg border-2 transition-all {selectedSession?.sessionId === session.sessionId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-gray-900">Session {sessions.indexOf(session) + 1}</span>
                  <span class="text-xs {getMasteryColor(session.accuracy)}">{session.accuracy}%</span>
                </div>
                <div class="text-xs text-gray-500">
                  {formatDate(session.startTime)}
                </div>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-xs text-gray-600">{session.correctAnswers}/{session.totalQuestions}</span>
                  <span class="text-xs text-gray-600">{formatTime(session.timeSpent)}</span>
                  <span class="text-xs text-gray-600">{session.totalPoints} pts</span>
                </div>
              </button>
            {/each}
          </div>
        </div>

        <!-- Session Details -->
        {#if selectedSession}
          <div class="space-y-6">
            <!-- Session Summary -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-gray-900">Session Summary</h2>
                <div class="flex items-center gap-2 px-3 py-1 rounded-full {getMasteryBg(selectedSession.accuracy)}">
                  <CarbonTrophy class="w-4 h-4 {getMasteryColor(selectedSession.accuracy)}" />
                  <span class="text-sm font-semibold {getMasteryColor(selectedSession.accuracy)}">{selectedSession.accuracy}% Accuracy</span>
                </div>
              </div>
              
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">{selectedSession.totalQuestions}</div>
                  <div class="text-sm text-gray-600">Questions</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600">{selectedSession.correctAnswers}</div>
                  <div class="text-sm text-gray-600">Correct</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-purple-600">{selectedSession.totalPoints}</div>
                  <div class="text-sm text-gray-600">Points</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-orange-600">{formatTime(selectedSession.timeSpent)}</div>
                  <div class="text-sm text-gray-600">Time</div>
                </div>
              </div>
            </div>

            <!-- Question Review -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Question by Question Review</h3>
              <div class="space-y-4">
                {#each selectedSession.answers as answer, index}
                  <div class="border border-gray-200 rounded-lg p-4 {answer.isCorrect ? 'bg-green-50' : 'bg-red-50'}">
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex items-center gap-2">
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                          {answer.questionNumber}
                        </span>
                        <span class="text-sm font-medium text-gray-900">Question {answer.questionNumber}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        {#if answer.isCorrect}
                          <CarbonCheckmarkFilled class="w-5 h-5 text-green-600" />
                          <span class="text-sm font-semibold text-green-600">Correct (+{answer.points} pts)</span>
                        {:else}
                          <CarbonCloseFilled class="w-5 h-5 text-red-600" />
                          <span class="text-sm font-semibold text-red-600">Incorrect (0 pts)</span>
                        {/if}
                      </div>
                    </div>
                    
                    <div class="mb-3">
                      <div class="text-sm text-gray-900 mb-2">
                        <MathRenderer content={answer.questionText} />
                      </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span class="text-gray-600">Your answer:</span>
                        <div class="font-medium {answer.isCorrect ? 'text-green-700' : 'text-red-700'}">
                          {answer.selectedAnswer.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <span class="text-gray-600">Correct answer:</span>
                        <div class="font-medium text-green-700">
                          {answer.correctAnswer.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    {#if answer.timeSpent}
                      <div class="flex items-center gap-1 mt-3 text-xs text-gray-500">
                        <CarbonTime class="w-3 h-3" />
                        <span>Answered in {formatTime(answer.timeSpent)}</span>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
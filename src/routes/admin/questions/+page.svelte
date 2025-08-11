<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getIdToken } from '$lib/firebase/auth';
  import CarbonAdd from '~icons/carbon/add';
  import CarbonSearch from '~icons/carbon/search';
  import CarbonFilter from '~icons/carbon/filter';
  import CarbonEdit from '~icons/carbon/edit';
  import CarbonTrashCan from '~icons/carbon/trash-can';
  import CarbonView from '~icons/carbon/view';
  import type { ClientQuestion, SubjectType, DifficultyLevel } from '$lib/firebase/types';

  let questions: ClientQuestion[] = [];
  let filteredQuestions: ClientQuestion[] = [];
  let isLoading = true;
  let searchTerm = '';
  let selectedSubject: SubjectType | '' = '';
  let selectedDifficulty: DifficultyLevel | '' = '';
  let selectedGrade: number | '' = '';

  async function loadQuestions() {
    try {
      isLoading = true;
      const token = await getIdToken();
      if (!token) {
        console.error('No auth token available');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (selectedGrade) params.append('grade', selectedGrade.toString());
      if (selectedSubject) params.append('subject', selectedSubject);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);

      const response = await fetch(`/api/admin/questions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        questions = result.questions;
        filteredQuestions = questions;
      } else {
        throw new Error(result.error || 'Failed to load questions');
      }

    } catch (error) {
      console.error('Error fetching questions:', error);
      questions = [];
      filteredQuestions = [];
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadQuestions();
  });

  // Reload when filters change
  $: if (selectedGrade || selectedSubject || selectedDifficulty) {
    loadQuestions();
  }

  $: {
    filteredQuestions = questions.filter(q => {
      const matchesSearch = searchTerm === '' || 
        q.question.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSubject = selectedSubject === '' || q.subject === selectedSubject;
      const matchesDifficulty = selectedDifficulty === '' || q.difficulty === selectedDifficulty;
      const matchesGrade = selectedGrade === '' || q.grade === selectedGrade;
      
      return matchesSearch && matchesSubject && matchesDifficulty && matchesGrade;
    });
  }

  function getDifficultyColor(difficulty: DifficultyLevel) {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      hard: 'bg-orange-100 text-orange-800',
      expert: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  }

  function getSuccessRate(q: ClientQuestion) {
    return q.statistics.attemptCount > 0 
      ? Math.round((q.statistics.correctCount / q.statistics.attemptCount) * 100)
      : 0;
  }

  async function deleteQuestion(questionId: string) {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = await getIdToken();
      if (!token) {
        alert('Please log in to delete questions');
        return;
      }

      const response = await fetch('/api/admin/questions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ questionId })
      });

      const result = await response.json();

      if (result.success) {
        alert('Question deleted successfully');
        // Reload questions from server
        await loadQuestions();
      } else {
        throw new Error(result.error || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question: ' + error.message);
    }
  }
</script>

<svelte:head>
  <title>Questions - Admin - Previsely</title>
</svelte:head>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Questions</h1>
      <p class="text-gray-600 mt-1">Manage your question bank</p>
    </div>
    <div class="flex items-center gap-3">
      <a
        href="/admin/questions/import"
        class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        <CarbonAdd class="w-4 h-4" />
        Bulk Import
      </a>
      <a
        href="/admin/questions/create"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <CarbonAdd class="w-4 h-4" />
        Create Question
      </a>
    </div>
  </div>

  <!-- Filters -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Search -->
      <div class="relative">
        <CarbonSearch class="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search questions..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          bind:value={searchTerm}
        />
      </div>

      <!-- Subject Filter -->
      <select
        class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        bind:value={selectedSubject}
      >
        <option value="">All Subjects</option>
        <option value="math">Math</option>
        <option value="science">Science</option>
        <option value="english">English</option>
        <option value="history">History</option>
      </select>

      <!-- Difficulty Filter -->
      <select
        class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        bind:value={selectedDifficulty}
      >
        <option value="">All Difficulties</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
        <option value="expert">Expert</option>
      </select>

      <!-- Grade Filter -->
      <select
        class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        bind:value={selectedGrade}
      >
        <option value="">All Grades</option>
        {#each Array(12) as _, i}
          <option value={i + 1}>Grade {i + 1}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Questions List -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    {#if isLoading}
      <div class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">Loading questions...</p>
      </div>
    {:else if filteredQuestions.length === 0}
      <div class="p-8 text-center">
        <p class="text-gray-500">No questions found matching your criteria.</p>
        <a
          href="/admin/questions/create"
          class="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <CarbonAdd class="w-4 h-4" />
          Create Your First Question
        </a>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Question
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Difficulty
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stats
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each filteredQuestions as question}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-900 line-clamp-2">
                    {question.question.text}
                  </div>
                  <div class="flex flex-wrap gap-1 mt-2">
                    {#each question.tags.slice(0, 3) as tag}
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {tag}
                      </span>
                    {/each}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900 capitalize">{question.subject}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">{question.grade}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize {getDifficultyColor(question.difficulty)}">
                    {question.difficulty}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>{question.statistics.attemptCount} attempts</div>
                  <div class="text-xs text-gray-500">{getSuccessRate(question)}% success rate</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center gap-2">
                    <button
                      class="text-blue-600 hover:text-blue-900"
                      title="Preview"
                    >
                      <CarbonView class="w-4 h-4" />
                    </button>
                    <a
                      href="/admin/questions/edit/{question.id}"
                      class="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                    >
                      <CarbonEdit class="w-4 h-4" />
                    </a>
                    <button
                      onclick={() => deleteQuestion(question.id)}
                      class="text-red-600 hover:text-red-900"
                      title="Delete"
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
    {/if}
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
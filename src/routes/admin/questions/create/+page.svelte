<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { getIdToken } from '$lib/firebase/auth';
  import CarbonSave from '~icons/carbon/save';
  import CarbonView from '~icons/carbon/view';
  import CarbonReset from '~icons/carbon/reset';
  import CarbonAdd from '~icons/carbon/add';
  import CarbonClose from '~icons/carbon/close';
  import MathInput from '$lib/components/MathInput.svelte';
  import MathRenderer from '$lib/components/MathRenderer.svelte';
  import ImageUpload from '$lib/components/admin/ImageUpload.svelte';
  import type { QuestionType, SubjectType, DifficultyLevel } from '$lib/firebase/types';

  // Dynamic dropdown data
  let availableGrades: any[] = [];
  let availableSubjects: any[] = [];
  let availableCurriculums: any[] = [];
  let filteredCurriculums: any[] = [];
  let loadingDropdowns = true;

  // Form data
  let formData = {
    curriculumId: '',
    year: 2024,
    grade: '',
    subject: '',
    chapterId: '',
    questionSetId: '', // New field for question sets
    questionSetName: '', // New field for question set name
    type: 'multiple-choice' as QuestionType,
    question: {
      text: '',
      imageUrl: '',
      audioUrl: '',
      latex: ''
    },
    options: {
      a: { text: '', imageUrl: '' },
      b: { text: '', imageUrl: '' },
      c: { text: '', imageUrl: '' },
      d: { text: '', imageUrl: '' },
      e: { text: '', imageUrl: '' }
    },
    correctAnswer: '',
    explanation: '',
    hints: [''],
    difficulty: 'easy' as DifficultyLevel,
    points: 10,
    tags: [''],
    estimatedTime: 60
  };

  // Question set management
  let createNewSet = false;
  let availableQuestionSets: any[] = [];

  let showPreview = false;
  let isSubmitting = false;
  let hasOptionE = false;
  let mathInputMode = {
    question: false,
    explanation: false,
    options: { a: false, b: false, c: false, d: false, e: false },
    hints: [false] // Initialize with one false for the default hint
  };

  async function loadDropdownData() {
    if (!browser) return;
    
    try {
      const { getAuth, getIdToken } = await import('firebase/auth');
      const { app } = await import('$lib/firebase');
      
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (!user) return;

      const token = await getIdToken(user);

      const response = await fetch('/api/admin/dropdowns?include=grades,subjects,curriculums', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const result = await response.json();

      if (result.success) {
        availableGrades = result.data.grades || [];
        availableSubjects = result.data.subjects || [];
        availableCurriculums = result.data.curriculums || [];
        
        // Load question sets for the selected curriculum
        if (formData.curriculumId) {
          await loadQuestionSets(formData.curriculumId);
        }
        
        // Set default values
        if (availableGrades.length > 0 && !formData.grade) {
          formData.grade = availableGrades[0].gradeNumber;
        }
        if (availableSubjects.length > 0 && !formData.subject) {
          formData.subject = availableSubjects[0].code;
        }
        
        filterCurriculums();
      }

    } catch (err) {
      console.error('Error loading dropdown data:', err);
    } finally {
      loadingDropdowns = false;
    }
  }

  function filterCurriculums() {
    filteredCurriculums = availableCurriculums.filter(curr => {
      const gradeMatch = !formData.grade || curr.grade === parseInt(formData.grade);
      const subjectMatch = !formData.subject || curr.subject === formData.subject;
      return gradeMatch && subjectMatch;
    });
    
    // Auto-select first curriculum if available
    if (filteredCurriculums.length > 0 && !formData.curriculumId) {
      formData.curriculumId = filteredCurriculums[0].id;
      formData.chapterId = filteredCurriculums[0].chapterId;
      loadQuestionSets(formData.curriculumId);
    } else if (filteredCurriculums.length === 0) {
      formData.curriculumId = '';
      formData.chapterId = '';
      availableQuestionSets = [];
    }
  }

  function addHint() {
    formData.hints = [...formData.hints, ''];
    mathInputMode.hints = [...mathInputMode.hints, false];
  }

  function removeHint(index: number) {
    formData.hints = formData.hints.filter((_, i) => i !== index);
    mathInputMode.hints = mathInputMode.hints.filter((_, i) => i !== index);
  }

  function addTag() {
    formData.tags = [...formData.tags, ''];
  }

  function removeTag(index: number) {
    formData.tags = formData.tags.filter((_, i) => i !== index);
  }

  async function loadQuestionSets(curriculumId: string) {
    try {
      const token = await getIdToken();
      if (!token) return;

      const response = await fetch(`/api/admin/question-sets?curriculum=${curriculumId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          availableQuestionSets = result.data || [];
        }
      }
    } catch (error) {
      console.error('Error loading question sets:', error);
      availableQuestionSets = [];
    }
  }

  function generateQuestionSetId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `qset_${timestamp}_${random}`;
  }

  function toggleOptionE() {
    hasOptionE = !hasOptionE;
    if (!hasOptionE) {
      formData.options.e = { text: '', imageUrl: '' };
    }
  }

  function resetForm() {
    if (confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
      formData = {
        curriculumId: '',
        year: 2024,
        grade: 5,
        subject: 'math',
        chapterId: '',
        questionSetId: '',
        questionSetName: '',
        type: 'multiple-choice',
        question: {
          text: '',
          imageUrl: '',
          audioUrl: '',
          latex: ''
        },
        options: {
          a: { text: '', imageUrl: '' },
          b: { text: '', imageUrl: '' },
          c: { text: '', imageUrl: '' },
          d: { text: '', imageUrl: '' },
          e: { text: '', imageUrl: '' }
        },
        correctAnswer: '',
        explanation: '',
        hints: [''],
        difficulty: 'easy',
        points: 10,
        tags: [''],
        estimatedTime: 60
      };
      hasOptionE = false;
      createNewSet = false;
      mathInputMode = {
        question: false,
        explanation: false,
        options: { a: false, b: false, c: false, d: false, e: false },
        hints: [false]
      };
    }
  }

  async function submitQuestion() {
    try {
      isSubmitting = true;

      // Validate form
      if (!formData.question.text.trim()) {
        alert('Question text is required');
        return;
      }

      if (!formData.options.a.text.trim() || !formData.options.b.text.trim() || 
          !formData.options.c.text.trim() || !formData.options.d.text.trim()) {
        alert('All options A-D are required');
        return;
      }

      if (!formData.correctAnswer) {
        alert('Correct answer is required');
        return;
      }

      // Handle question set creation
      if (createNewSet && formData.questionSetName.trim()) {
        formData.questionSetId = generateQuestionSetId();
      } else if (!createNewSet && !formData.questionSetId) {
        // If no question set selected and not creating new one, assign to default set
        formData.questionSetId = 'default';
        formData.questionSetName = 'Default Questions';
      }

      // Clean up data
      const cleanData = {
        ...formData,
        hints: formData.hints.filter(h => h.trim()),
        tags: formData.tags.filter(t => t.trim()),
        options: hasOptionE ? formData.options : {
          a: formData.options.a,
          b: formData.options.b,
          c: formData.options.c,
          d: formData.options.d
        }
      };

      // Get auth token
      const token = await getIdToken();
      if (!token) {
        alert('Please log in to create questions');
        return;
      }

      // Submit to API
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanData)
      });

      const result = await response.json();

      if (result.success) {
        alert('Question created successfully!');
        goto('/admin/questions');
      } else {
        throw new Error(result.error || 'Failed to create question');
      }

    } catch (error) {
      console.error('Error creating question:', error);
      alert('Failed to create question: ' + error.message);
    } finally {
      isSubmitting = false;
    }
  }

  onMount(() => {
    loadDropdownData();
  });

  // Filter curriculums when grade or subject changes
  $: if (formData.grade || formData.subject) {
    filterCurriculums();
  }

  // Update chapterId and load question sets when curriculum changes
  $: if (formData.curriculumId) {
    const selectedCurriculum = filteredCurriculums.find(c => c.id === formData.curriculumId);
    if (selectedCurriculum) {
      formData.chapterId = selectedCurriculum.chapterId;
      loadQuestionSets(formData.curriculumId);
    }
  }
</script>

<svelte:head>
  <title>Create Question - Admin - Previsely</title>
</svelte:head>

<div class="p-6 max-w-4xl mx-auto">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Create New Question</h1>
      <p class="text-gray-600 mt-1">Add a new question to your question bank</p>
    </div>
    <div class="flex items-center gap-3">
      <button
        onclick={() => showPreview = !showPreview}
        class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <CarbonView class="w-4 h-4" />
        {showPreview ? 'Hide Preview' : 'Preview'}
      </button>
      <button
        onclick={resetForm}
        class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <CarbonReset class="w-4 h-4" />
        Reset
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 {showPreview ? 'lg:grid-cols-2' : ''} gap-6">
    <!-- Form -->
    <div class="space-y-6">
      <!-- Basic Information -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            {#if loadingDropdowns}
              <div class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading subjects...
              </div>
            {:else if availableSubjects.length === 0}
              <div class="space-y-2">
                <div class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-yellow-50 text-yellow-800">
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
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select subject...</option>
                {#each availableSubjects as subject}
                  <option value={subject.code}>{subject.name}</option>
                {/each}
              </select>
            {/if}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Grade</label>
            {#if loadingDropdowns}
              <div class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading grades...
              </div>
            {:else if availableGrades.length === 0}
              <div class="space-y-2">
                <div class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-yellow-50 text-yellow-800">
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
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select grade...</option>
                {#each availableGrades as grade}
                  <option value={grade.gradeNumber}>
                    {grade.gradeName} {grade.ageRange ? `(${grade.ageRange})` : ''}
                  </option>
                {/each}
              </select>
            {/if}
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Curriculum</label>
          {#if loadingDropdowns}
            <div class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
              Loading curriculums...
            </div>
          {:else if filteredCurriculums.length === 0}
            <div class="space-y-2">
              <div class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-yellow-50 text-yellow-800">
                No curriculums found for the selected grade and subject. Create a curriculum first.
              </div>
              <a
                href="/admin/curriculum/create"
                class="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
              >
                → Create Curriculum
              </a>
            </div>
          {:else}
            <select
              bind:value={formData.curriculumId}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select curriculum...</option>
              {#each filteredCurriculums as curriculum}
                <option value={curriculum.id}>
                  {curriculum.chapterName} ({curriculum.year})
                </option>
              {/each}
            </select>
          {/if}
        </div>

        <!-- Question Set Section -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Question Set</label>
          <div class="space-y-3">
            <label class="flex items-center gap-2">
              <input
                type="radio"
                bind:group={createNewSet}
                value={false}
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">Add to existing set</span>
            </label>
            
            {#if !createNewSet}
              <div class="ml-6">
                {#if availableQuestionSets.length === 0}
                  <div class="text-sm text-gray-500 italic">No question sets available for this curriculum</div>
                {:else}
                  <select
                    bind:value={formData.questionSetId}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select question set...</option>
                    <option value="default">Default Questions</option>
                    {#each availableQuestionSets as questionSet}
                      <option value={questionSet.id}>
                        {questionSet.name} ({questionSet.questionCount} questions)
                      </option>
                    {/each}
                  </select>
                {/if}
              </div>
            {/if}
            
            <label class="flex items-center gap-2">
              <input
                type="radio"
                bind:group={createNewSet}
                value={true}
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">Create new question set</span>
            </label>
            
            {#if createNewSet}
              <div class="ml-6">
                <input
                  type="text"
                  bind:value={formData.questionSetName}
                  placeholder="Enter question set name (e.g., 'Fractions - Set 1')"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div class="text-xs text-gray-500 mt-1">
                  A new question set will be created with 10 question slots. Each set represents one skill box on the curriculum page.
                </div>
              </div>
            {/if}
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              bind:value={formData.difficulty}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Points</label>
            <input
              type="number"
              bind:value={formData.points}
              min="1"
              max="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Time (seconds)</label>
            <input
              type="number"
              bind:value={formData.estimatedTime}
              min="30"
              max="600"
              step="30"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Question Content -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Question Content</h2>
        
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700">Question Text *</label>
            <button
              type="button"
              onclick={() => mathInputMode.question = !mathInputMode.question}
              class="inline-flex items-center gap-2 px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 {mathInputMode.question ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}"
            >
              <span class="text-sm">📐</span>
              {mathInputMode.question ? 'Text Mode' : 'Math Mode'}
            </button>
          </div>
          
          {#if mathInputMode.question}
            <MathInput
              bind:value={formData.question.text}
              placeholder="Enter your question with mathematical expressions..."
              on:input={(e) => formData.question.text = e.detail.value}
            />
          {:else}
            <textarea
              bind:value={formData.question.text}
              placeholder="Enter your question here... (Use \(\frac{1}{2}\) for math)"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            ></textarea>
          {/if}
        </div>

        <!-- Question Image Upload -->
        <div class="mb-4">
          <ImageUpload
            bind:value={formData.question.imageUrl}
            onUpload={(url) => formData.question.imageUrl = url}
            path="math-mania/question-images/{formData.curriculumId || 'general'}"
            label="Question Image (Optional)"
          />
        </div>

        <div class="grid grid-cols-2 gap-4 hidden">
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">LaTeX (optional)</label>
            <input
              type="text"
              bind:value={formData.question.latex}
              placeholder="\\frac{1}{2} + \\frac{1}{3}"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Answer Options -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Answer Options</h2>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              bind:checked={hasOptionE}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700">Include Option E</span>
          </label>
        </div>

        <div class="space-y-4">
          {#each ['a', 'b', 'c', 'd'] as option}
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-700">
                  Option {option.toUpperCase()} *
                </label>
                <button
                  type="button"
                  onclick={() => mathInputMode.options[option] = !mathInputMode.options[option]}
                  class="inline-flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 {mathInputMode.options[option] ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}"
                >
                  <span class="text-xs">📐</span>
                  {mathInputMode.options[option] ? 'Text' : 'Math'}
                </button>
              </div>
              
              {#if mathInputMode.options[option]}
                <MathInput
                  bind:value={formData.options[option].text}
                  placeholder="Enter option {option.toUpperCase()} with math expressions..."
                  on:input={(e) => formData.options[option].text = e.detail.value}
                />
              {:else}
                <input
                  type="text"
                  bind:value={formData.options[option].text}
                  placeholder="Enter option {option.toUpperCase()}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              {/if}
            </div>
          {/each}

          {#if hasOptionE}
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-700">Option E</label>
                <button
                  type="button"
                  onclick={() => mathInputMode.options.e = !mathInputMode.options.e}
                  class="inline-flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 {mathInputMode.options.e ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}"
                >
                  <span class="text-xs">📐</span>
                  {mathInputMode.options.e ? 'Text' : 'Math'}
                </button>
              </div>
              
              {#if mathInputMode.options.e}
                <MathInput
                  bind:value={formData.options.e.text}
                  placeholder="Enter option E with math expressions..."
                  on:input={(e) => formData.options.e.text = e.detail.value}
                />
              {:else}
                <input
                  type="text"
                  bind:value={formData.options.e.text}
                  placeholder="Enter option E"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              {/if}
            </div>
          {/if}

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Correct Answer *</label>
            <select
              bind:value={formData.correctAnswer}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select correct answer</option>
              <option value="a">Option A</option>
              <option value="b">Option B</option>
              <option value="c">Option C</option>
              <option value="d">Option D</option>
              {#if hasOptionE}
                <option value="e">Option E</option>
              {/if}
            </select>
          </div>
        </div>
      </div>

      <!-- Explanation & Hints -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Explanation & Hints</h2>
        
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700">Explanation</label>
            <button
              type="button"
              onclick={() => mathInputMode.explanation = !mathInputMode.explanation}
              class="inline-flex items-center gap-2 px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 {mathInputMode.explanation ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}"
            >
              <span class="text-sm">📐</span>
              {mathInputMode.explanation ? 'Text Mode' : 'Math Mode'}
            </button>
          </div>
          
          {#if mathInputMode.explanation}
            <MathInput
              bind:value={formData.explanation}
              placeholder="Explain why this answer is correct with mathematical expressions..."
              on:input={(e) => formData.explanation = e.detail.value}
            />
          {:else}
            <textarea
              bind:value={formData.explanation}
              placeholder="Explain why this answer is correct..."
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            ></textarea>
          {/if}
        </div>

        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700">Hints</label>
            <button
              onclick={addHint}
              type="button"
              class="inline-flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              <CarbonAdd class="w-3 h-3" />
              Add Hint
            </button>
          </div>
          <div class="space-y-3">
            {#each formData.hints as hint, index}
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm text-gray-600">Hint {index + 1}</label>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      onclick={() => mathInputMode.hints[index] = !mathInputMode.hints[index]}
                      class="inline-flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 {mathInputMode.hints[index] ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}"
                    >
                      <span class="text-xs">📐</span>
                      {mathInputMode.hints[index] ? 'Text' : 'Math'}
                    </button>
                    {#if formData.hints.length > 1}
                      <button
                        onclick={() => removeHint(index)}
                        type="button"
                        class="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <CarbonClose class="w-3 h-3" />
                      </button>
                    {/if}
                  </div>
                </div>
                
                {#if mathInputMode.hints[index]}
                  <MathInput
                    bind:value={formData.hints[index]}
                    placeholder="Hint {index + 1} with math expressions..."
                    on:input={(e) => formData.hints[index] = e.detail.value}
                  />
                {:else}
                  <input
                    type="text"
                    bind:value={formData.hints[index]}
                    placeholder="Hint {index + 1}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700">Tags</label>
            <button
              onclick={addTag}
              type="button"
              class="inline-flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              <CarbonAdd class="w-3 h-3" />
              Add Tag
            </button>
          </div>
          <div class="space-y-2">
            {#each formData.tags as tag, index}
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  bind:value={formData.tags[index]}
                  placeholder="Tag {index + 1}"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {#if formData.tags.length > 1}
                  <button
                    onclick={() => removeTag(index)}
                    type="button"
                    class="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <CarbonClose class="w-4 h-4" />
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end gap-3">
        <a
          href="/admin/questions"
          class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </a>
        <button
          onclick={submitQuestion}
          disabled={isSubmitting}
          class="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <CarbonSave class="w-4 h-4" />
          {isSubmitting ? 'Creating...' : 'Create Question'}
        </button>
      </div>
    </div>

    <!-- Preview -->
    {#if showPreview}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between text-sm text-gray-600">
            <span>Grade {formData.grade} • {formData.subject}</span>
            <span class="capitalize px-2 py-1 rounded text-xs bg-gray-100">{formData.difficulty}</span>
          </div>

          {#if formData.question.text}
            <div class="text-lg font-medium text-gray-900">
              <MathRenderer content={formData.question.text} />
            </div>
          {:else}
            <div class="text-gray-400 italic">Question text will appear here...</div>
          {/if}

          {#if formData.question.imageUrl}
            <div class="mt-3">
              <img 
                src={formData.question.imageUrl} 
                alt="Question" 
                class="max-w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
          {/if}

          <div class="space-y-2">
            {#each ['a', 'b', 'c', 'd'] as option}
              {#if formData.options[option].text}
                <div class="flex items-center gap-2 p-3 border rounded-lg {formData.correctAnswer === option ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
                  <span class="font-medium">{option.toUpperCase()})</span>
                  <span><MathRenderer content={formData.options[option].text} inline={true} /></span>
                  {#if formData.correctAnswer === option}
                    <span class="ml-auto text-green-600 text-sm">✓ Correct</span>
                  {/if}
                </div>
              {/if}
            {/each}

            {#if hasOptionE && formData.options.e.text}
              <div class="flex items-center gap-2 p-3 border rounded-lg {formData.correctAnswer === 'e' ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
                <span class="font-medium">E)</span>
                <span><MathRenderer content={formData.options.e.text} inline={true} /></span>
                {#if formData.correctAnswer === 'e'}
                  <span class="ml-auto text-green-600 text-sm">✓ Correct</span>
                {/if}
              </div>
            {/if}
          </div>

          {#if formData.explanation}
            <div class="p-3 bg-blue-50 rounded-lg">
              <div class="text-sm font-medium text-blue-900 mb-1">Explanation:</div>
              <div class="text-sm text-blue-800">
                <MathRenderer content={formData.explanation} />
              </div>
            </div>
          {/if}

          {#if formData.hints.some(h => h.trim())}
            <div class="text-sm text-gray-600">
              <div class="font-medium mb-1">Hints available: {formData.hints.filter(h => h.trim()).length}</div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
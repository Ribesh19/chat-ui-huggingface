<script lang="ts">
  import { getIdToken } from '$lib/firebase/auth';
  import CarbonUpload from '~icons/carbon/upload';
  import CarbonDocumentImport from '~icons/carbon/document-import';
  import CarbonCheckmarkFilled from '~icons/carbon/checkmark-filled';
  import CarbonWarningFilled from '~icons/carbon/warning-filled';
  import CarbonDownload from '~icons/carbon/download';
  
  let dragOver = false;
  let file: File | null = null;
  let isProcessing = false;
  let importResults: {
    total: number;
    successful: number;
    failed: number;
    errors: { row: number; message: string; }[];
  } | null = null;

  const csvTemplate = `subject,grade,chapter_id,question_text,option_a,option_b,option_c,option_d,option_e,correct_answer,difficulty,points,explanation,hints,tags,estimated_time
math,5,ch-decimals-01,"What is the value of the digit 7 in 3.472?","7 tenths","7 hundredths","7 thousandths","7 ones",,b,easy,10,"The digit 7 is in the hundredths place (second digit after decimal point).","Count the positions after the decimal point|First position is tenths second is hundredths","decimals|place-value",60
math,5,ch-decimals-01,"Round 4.567 to the nearest hundredth.","4.57","4.56","4.6","5",,a,medium,15,"Look at the thousandths place (7) - it's ≥5 so round up.","Look at the digit after hundredths|If ≥5 round up","decimals|rounding",90`;

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragOver = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    
    const files = Array.from(e.dataTransfer?.files || []);
    const csvFile = files.find(f => f.type === 'text/csv' || f.name.endsWith('.csv'));
    
    if (csvFile) {
      file = csvFile;
    } else {
      alert('Please drop a CSV file');
    }
  }

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      file = target.files[0];
    }
  }

  function downloadTemplate() {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function parseCSV(content: string) {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const questions = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const question: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        switch (header) {
          case 'subject':
            question.subject = value;
            break;
          case 'grade':
            question.grade = parseInt(value) || 5;
            break;
          case 'chapter_id':
            question.chapterId = value;
            break;
          case 'question_text':
            question.question = { text: value };
            break;
          case 'option_a':
            question.options = question.options || {};
            question.options.a = { text: value };
            break;
          case 'option_b':
            question.options = question.options || {};
            question.options.b = { text: value };
            break;
          case 'option_c':
            question.options = question.options || {};
            question.options.c = { text: value };
            break;
          case 'option_d':
            question.options = question.options || {};
            question.options.d = { text: value };
            break;
          case 'option_e':
            if (value) {
              question.options = question.options || {};
              question.options.e = { text: value };
            }
            break;
          case 'correct_answer':
            question.correctAnswer = value;
            break;
          case 'difficulty':
            question.difficulty = value;
            break;
          case 'points':
            question.points = parseInt(value) || 10;
            break;
          case 'explanation':
            question.explanation = value;
            break;
          case 'hints':
            question.hints = value ? value.split('|').map(h => h.trim()) : [];
            break;
          case 'tags':
            question.tags = value ? value.split('|').map(t => t.trim()) : [];
            break;
          case 'estimated_time':
            question.estimatedTime = parseInt(value) || 60;
            break;
        }
      });

      // Set defaults
      question.curriculumId = 'temp-curriculum'; // This would need to be mapped properly
      question.year = 2024;
      question.type = 'multiple-choice';
      
      questions.push({ row: i + 1, data: question });
    }
    
    return questions;
  }

  async function processImport() {
    if (!file) return;
    
    try {
      isProcessing = true;
      importResults = null;
      
      const content = await file.text();
      const questions = parseCSV(content);
      
      const token = await getIdToken();
      if (!token) {
        alert('Please log in to import questions');
        return;
      }
      
      let successful = 0;
      let failed = 0;
      const errors: { row: number; message: string; }[] = [];
      
      // Process questions in batches of 5 to avoid overwhelming the server
      for (let i = 0; i < questions.length; i += 5) {
        const batch = questions.slice(i, i + 5);
        
        await Promise.all(batch.map(async (question) => {
          try {
            const response = await fetch('/api/admin/questions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(question.data)
            });
            
            const result = await response.json();
            
            if (result.success) {
              successful++;
            } else {
              failed++;
              errors.push({
                row: question.row,
                message: result.error || 'Unknown error'
              });
            }
          } catch (error) {
            failed++;
            errors.push({
              row: question.row,
              message: error.message || 'Network error'
            });
          }
        }));
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      importResults = {
        total: questions.length,
        successful,
        failed,
        errors
      };
      
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to process import: ' + error.message);
    } finally {
      isProcessing = false;
    }
  }

  function resetImport() {
    file = null;
    importResults = null;
  }
</script>

<svelte:head>
  <title>Import Questions - Admin - Previsely</title>
</svelte:head>

<div class="p-6 max-w-4xl mx-auto">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Import Questions</h1>
    <p class="text-gray-600">Bulk import questions from a CSV file</p>
  </div>

  <!-- Instructions -->
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <div class="flex items-start gap-3">
      <CarbonDocumentImport class="w-5 h-5 text-blue-600 mt-0.5" />
      <div>
        <h3 class="font-medium text-blue-900 mb-2">How to import questions:</h3>
        <ol class="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Download the CSV template below</li>
          <li>Fill in your questions following the format</li>
          <li>Upload the completed CSV file</li>
          <li>Review and confirm the import</li>
        </ol>
      </div>
    </div>
  </div>

  <!-- Template Download -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-semibold text-gray-900 mb-1">CSV Template</h3>
        <p class="text-sm text-gray-600">Download the template with sample data and correct formatting</p>
      </div>
      <button
        onclick={downloadTemplate}
        class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        <CarbonDownload class="w-4 h-4" />
        Download Template
      </button>
    </div>
    
    <div class="mt-4 p-3 bg-gray-50 rounded-lg">
      <p class="text-xs text-gray-600 mb-2">Template format:</p>
      <code class="text-xs text-gray-800">
        subject,grade,chapter_id,question_text,option_a,option_b,option_c,option_d,option_e,correct_answer,difficulty,points,explanation,hints,tags,estimated_time
      </code>
    </div>
  </div>

  <!-- File Upload -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
    <h3 class="font-semibold text-gray-900 mb-4">Upload CSV File</h3>
    
    {#if !file}
      <div
        class="border-2 border-dashed rounded-lg p-8 text-center transition-colors
          {dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}"
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
      >
        <CarbonUpload class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <div class="mb-4">
          <p class="text-lg font-medium text-gray-900 mb-1">Drop your CSV file here</p>
          <p class="text-sm text-gray-600">or click to browse</p>
        </div>
        <input
          type="file"
          accept=".csv"
          class="hidden"
          id="csv-upload"
          onchange={handleFileSelect}
        />
        <label
          for="csv-upload"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
        >
          Choose File
        </label>
      </div>
    {:else}
      <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div class="flex items-center gap-3">
          <CarbonDocumentImport class="w-5 h-5 text-green-600" />
          <div>
            <p class="font-medium text-gray-900">{file.name}</p>
            <p class="text-sm text-gray-600">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            onclick={processImport}
            disabled={isProcessing}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Import Questions'}
          </button>
          <button
            onclick={resetImport}
            disabled={isProcessing}
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Import Results -->
  {#if importResults}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="font-semibold text-gray-900 mb-4">Import Results</h3>
      
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{importResults.total}</div>
          <div class="text-sm text-blue-800">Total Questions</div>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{importResults.successful}</div>
          <div class="text-sm text-green-800">Successfully Imported</div>
        </div>
        <div class="text-center p-4 bg-red-50 rounded-lg">
          <div class="text-2xl font-bold text-red-600">{importResults.failed}</div>
          <div class="text-sm text-red-800">Failed</div>
        </div>
      </div>

      {#if importResults.successful > 0}
        <div class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <CarbonCheckmarkFilled class="w-5 h-5 text-green-600" />
          <span class="text-green-800">
            {importResults.successful} question{importResults.successful === 1 ? '' : 's'} imported successfully!
          </span>
        </div>
      {/if}

      {#if importResults.errors.length > 0}
        <div class="mb-4">
          <div class="flex items-center gap-2 mb-3">
            <CarbonWarningFilled class="w-5 h-5 text-orange-600" />
            <span class="font-medium text-gray-900">Import Errors:</span>
          </div>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            {#each importResults.errors as error}
              <div class="p-3 bg-red-50 border border-red-200 rounded text-sm">
                <span class="font-medium text-red-800">Row {error.row}:</span>
                <span class="text-red-700">{error.message}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <div class="flex justify-end gap-3">
        <button
          onclick={resetImport}
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Import Another File
        </button>
        <a
          href="/admin/questions"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          View Questions
        </a>
      </div>
    </div>
  {/if}

  <!-- CSV Format Guide -->
  <div class="mt-8 bg-gray-50 rounded-lg p-6">
    <h3 class="font-semibold text-gray-900 mb-4">CSV Format Guide</h3>
    
    <div class="space-y-4 text-sm">
      <div>
        <h4 class="font-medium text-gray-900">Required Fields:</h4>
        <ul class="mt-1 space-y-1 text-gray-700 list-disc list-inside">
          <li><code class="bg-gray-200 px-1 rounded">subject</code> - Subject name (math, science, english, etc.)</li>
          <li><code class="bg-gray-200 px-1 rounded">grade</code> - Grade level (1-12)</li>
          <li><code class="bg-gray-200 px-1 rounded">question_text</code> - The question text</li>
          <li><code class="bg-gray-200 px-1 rounded">option_a</code> to <code class="bg-gray-200 px-1 rounded">option_d</code> - Answer options</li>
          <li><code class="bg-gray-200 px-1 rounded">correct_answer</code> - Correct option (a, b, c, d, or e)</li>
          <li><code class="bg-gray-200 px-1 rounded">difficulty</code> - Difficulty level (easy, medium, hard, expert)</li>
        </ul>
      </div>
      
      <div>
        <h4 class="font-medium text-gray-900">Optional Fields:</h4>
        <ul class="mt-1 space-y-1 text-gray-700 list-disc list-inside">
          <li><code class="bg-gray-200 px-1 rounded">option_e</code> - Fifth answer option (optional)</li>
          <li><code class="bg-gray-200 px-1 rounded">explanation</code> - Explanation for the correct answer</li>
          <li><code class="bg-gray-200 px-1 rounded">hints</code> - Hints separated by | (pipe character)</li>
          <li><code class="bg-gray-200 px-1 rounded">tags</code> - Tags separated by | (pipe character)</li>
          <li><code class="bg-gray-200 px-1 rounded">points</code> - Points awarded (default: 10)</li>
          <li><code class="bg-gray-200 px-1 rounded">estimated_time</code> - Time in seconds (default: 60)</li>
        </ul>
      </div>
    </div>
  </div>
</div>
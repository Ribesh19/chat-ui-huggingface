<script lang="ts">
  import { getContext } from 'svelte';
  import CarbonUpload from '~icons/carbon/upload';
  import CarbonClose from '~icons/carbon/close';
  import CarbonImage from '~icons/carbon/image';
  
  interface Props {
    value: string | null;
    onUpload: (url: string) => void;
    path: string; // Storage path for the image
    label?: string;
  }

  let { value = $bindable(), onUpload, path, label = "Upload Image" }: Props = $props();
  
  let isUploading = $state(false);
  let uploadError = $state('');
  let fileInput: HTMLInputElement;
  let previewUrl = $state(value || '');

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      uploadError = 'Please select an image file';
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      uploadError = 'Image size must be less than 5MB';
      return;
    }
    
    uploadError = '';
    isUploading = true;
    
    try {
      // Get auth token
      const { auth } = await import('$lib/firebase/client');
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const token = await user.getIdToken();
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', `${path}/${Date.now()}_${file.name}`);
      
      // Upload to server
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      const result = await response.json();
      
      if (result.success) {
        previewUrl = result.url;
        value = result.url;
        onUpload(result.url);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      uploadError = error.message || 'Failed to upload image';
    } finally {
      isUploading = false;
    }
  }
  
  function removeImage() {
    value = '';
    previewUrl = '';
    onUpload('');
    if (fileInput) {
      fileInput.value = '';
    }
  }
</script>

<div class="space-y-2">
  <label class="block text-sm font-medium text-gray-700">{label}</label>
  
  {#if previewUrl}
    <div class="relative inline-block">
      <img 
        src={previewUrl} 
        alt="Preview" 
        class="max-w-sm max-h-48 rounded-lg border border-gray-300 shadow-sm"
      />
      <button
        type="button"
        onclick={removeImage}
        class="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
      >
        <CarbonClose class="w-4 h-4" />
      </button>
    </div>
  {/if}
  
  <div class="flex items-center gap-4">
    <input
      bind:this={fileInput}
      type="file"
      accept="image/*"
      onchange={handleFileSelect}
      class="hidden"
      disabled={isUploading}
    />
    
    <button
      type="button"
      onclick={() => fileInput?.click()}
      disabled={isUploading}
      class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {#if isUploading}
        <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        Uploading...
      {:else}
        <CarbonUpload class="w-4 h-4" />
        {previewUrl ? 'Change Image' : 'Choose Image'}
      {/if}
    </button>
    
    {#if !previewUrl && !isUploading}
      <span class="text-sm text-gray-500">
        <CarbonImage class="inline w-4 h-4" />
        Supports JPEG, PNG, GIF, WebP (max 5MB)
      </span>
    {/if}
  </div>
  
  {#if uploadError}
    <p class="text-sm text-red-600">{uploadError}</p>
  {/if}
</div>
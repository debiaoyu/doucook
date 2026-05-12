import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export interface RecipeListItem {
  id: number
  title: string
  source: string
  video_path: string | null
  thumbnail: string | null
  is_cooking: boolean | null
  confidence: number | null
  video_duration: number | null
  created_at: string | null
  tags: string | null
  categories: { id: number; name: string; color: string | null }[]
}

export interface QAPair {
  id: number
  recipe_id: number
  question: string
  answer: string | null
  created_at: string | null
}

export interface RecipeDetail {
  id: number
  title: string
  douyin_url: string | null
  source: string
  video_path: string | null
  thumbnail: string | null
  video_duration: number | null
  is_cooking: boolean | null
  confidence: number | null
  ai_summary: string | null
  recipe_text: string | null
  notes: string | null
  tags: string | null
  file_hash: string | null
  created_at: string | null
  updated_at: string | null
  categories: { id: number; name: string; color: string | null }[]
  qa_pairs: QAPair[]
}

export interface Category {
  id: number
  name: string
  color: string | null
}

export interface SearchResult {
  results: RecipeListItem[]
  total: number
  page: number
  page_size: number
}

// Recipes
export const listRecipes = (params?: {
  category?: string
  sort?: string
  order?: string
  page?: number
  page_size?: number
}) => api.get<RecipeListItem[]>('/recipes', { params })

export const getRecipe = (id: number) => api.get<RecipeDetail>(`/recipes/${id}`)

export const updateRecipe = (id: number, data: {
  title?: string
  notes?: string
  recipe_text?: string
  tags?: string
  categories?: string[]
}) => api.patch<RecipeDetail>(`/recipes/${id}`, data)

export const deleteRecipe = (id: number) => api.delete(`/recipes/${id}`)

export const getRecipeCount = () => api.get<{ total: number; cooking: number }>('/recipes/count')

export const listCategories = () => api.get<Category[]>('/recipes/categories/list')

// Import
export const importFromUrl = (data: { url: string; cookies_file?: string }) =>
  api.post('/import/url', data)

export async function importUrlStream(
  data: { url: string; cookies_file?: string },
  onEvent: (event: Record<string, any>) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch('/api/import/url/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal,
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: '请求失败' }))
    throw new Error(err.detail || '请求失败')
  }
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          onEvent(JSON.parse(line.slice(6)))
        } catch { /* skip malformed */ }
      }
    }
  }
}

export const importManual = (data: {
  title: string
  url?: string
  recipe_text?: string
  notes?: string
  categories?: string[]
}) => api.post('/import/manual', data)

export const batchImport = (data: { source: string; cookies_file?: string }) =>
  api.post('/import/batch', data, { timeout: 120000 })

export async function batchImportStream(
  data: { source: string; cookies_file?: string },
  onEvent: (event: Record<string, any>) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch('/api/import/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal,
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: '请求失败' }))
    throw new Error(err.detail || '请求失败')
  }
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          onEvent(JSON.parse(line.slice(6)))
        } catch { /* skip malformed */ }
      }
    }
  }
}

// Search
export const searchRecipes = (params: {
  query: string
  category?: string
  page?: number
  page_size?: number
}) => api.get<SearchResult>('/search', { params })

// Notes
export const updateNotes = (recipeId: number, notes: string) =>
  api.put(`/notes/${recipeId}`, { notes })

export const getNotes = (recipeId: number) =>
  api.get<{ notes: string }>(`/notes/${recipeId}`)

// AI
export const askQuestion = (recipeId: number, data: { question: string; cookies_file?: string }) =>
  api.post<{ answer?: string; error?: string }>(`/ai/ask/${recipeId}`, data)

export const getQaHistory = (recipeId: number) =>
  api.get<QAPair[]>(`/ai/qa/${recipeId}`)

// Settings
export const getSettings = () => api.get('/settings')
export const updateSettings = (data: { cookies_file: string | null }) =>
  api.put<{ cookies_file: string | null; data_dir: string; cookies_valid: boolean | null }>('/settings', data)
export const uploadCookiesFile = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post<{ cookies_file: string | null; data_dir: string; cookies_valid: boolean | null }>('/settings/cookies', formData)
}

// Auth
export const startLogin = (timeout = 120) =>
  api.post<{ login_id: string; status: string }>('/auth/login', null, { params: { timeout } })

export const getLoginStatus = (loginId: string) =>
  api.get<{
    status: string
    qr_code?: string
    message: string
    cookies_file?: string
    avatar_url?: string
    nickname?: string
  }>(`/auth/login/${loginId}`)

export const cancelLogin = (loginId: string) =>
  api.post(`/auth/login/${loginId}/cancel`)

export const checkLogin = () =>
  api.get<{ logged_in: boolean; cookies_file: string; avatar_url?: string; nickname?: string }>('/auth/check')

export const cancelBatchImport = (backendTaskId: string) =>
  api.post(`/import/batch/${backendTaskId}/cancel`)

export default api

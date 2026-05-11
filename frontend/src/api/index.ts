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
  categories?: string[]
}) => api.patch<RecipeDetail>(`/recipes/${id}`, data)

export const deleteRecipe = (id: number) => api.delete(`/recipes/${id}`)

export const getRecipeCount = () => api.get<{ total: number; cooking: number }>('/recipes/count')

export const listCategories = () => api.get<Category[]>('/recipes/categories/list')

// Import
export const importFromUrl = (data: { url: string; cookies_file?: string }) =>
  api.post('/import/url', data)

export const importManual = (data: {
  title: string
  url?: string
  recipe_text?: string
  notes?: string
  categories?: string[]
}) => api.post('/import/manual', data)

export const batchImport = (data: { source: string; cookies_file?: string }) =>
  api.post('/import/batch', data)

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

export default api

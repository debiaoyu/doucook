import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import RecipeList from './pages/RecipeList'
import RecipeDetail from './pages/RecipeDetail'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<RecipeList />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App

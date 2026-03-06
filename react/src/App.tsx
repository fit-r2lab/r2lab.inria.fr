import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import SignupPage from './pages/SignupPage'

function App() {
  return (
    <BrowserRouter basename="/react">
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

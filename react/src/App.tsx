import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import SignupPage from './pages/SignupPage'
import VerifyPage from './pages/VerifyPage'

function App() {
  return (
    <BrowserRouter basename="/react">
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify" element={<VerifyPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

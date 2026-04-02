import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Website from './Website';
import AdminPanel from './admin/AdminPanel';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Website />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

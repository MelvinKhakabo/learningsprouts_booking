import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import AiCoding from '@/pages/AiCoding';
import PublicSpeaking from '@/pages/PublicSpeaking';
import Register from '@/pages/Register';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ai-coding" element={<AiCoding />} />
        <Route path="/public-speaking" element={<PublicSpeaking />} />
        <Route path="/register/:cohortId" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

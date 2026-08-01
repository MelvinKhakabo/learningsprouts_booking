import ThankYou from '@/pages/ThankYou';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import AiCoding from '@/pages/AiCoding';
import PublicSpeaking from '@/pages/PublicSpeaking';
import Register from '@/pages/Register';

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrap><Home /></PageWrap>} />
        <Route path="/ai-coding" element={<PageWrap><AiCoding /></PageWrap>} />
        <Route path="/public-speaking" element={<PageWrap><PublicSpeaking /></PageWrap>} />
        <Route path="/register/:cohortId" element={<PageWrap><Register /></PageWrap>} />
        <Route path="/thank-you/:registrationId" element={<PageWrap><ThankYou /></PageWrap>} />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1">
          <AnimatedRoutes />
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Footer from './components/Footer';
import PrototypeModal from './components/PrototypeModal';
import HomePage from './pages/HomePage';
import HowItWorksPage from './pages/HowItWorksPage';
import PricingPage from './pages/PricingPage';
import WhatsAppPage from './pages/WhatsAppPage';
import FaqPage from './pages/FaqPage';
import TermsPage from './pages/TermsPage';
import WorkPage from './pages/WorkPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import MerseysideSimPage from './pages/MerseysideSimPage';

function LayoutWrapper() {
  const [prototypeOpen, setPrototypeOpen] = useState(false);
  const openPrototype = () => setPrototypeOpen(true);

  return (
    <>
      <Layout onRequestPrototype={openPrototype}>
        <Outlet context={{ openPrototype }} />
        <Footer onRequestPrototype={openPrototype} />
      </Layout>
      <PrototypeModal open={prototypeOpen} onClose={() => setPrototypeOpen(false)} />
    </>
  );
}

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <Routes>
        <Route path="/simsig" element={<MerseysideSimPage />} />
        <Route path="/" element={<LayoutWrapper />}>
          <Route index element={<HomePage />} />
          <Route path="what-we-do" element={<Navigate to="/how-it-works" replace />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="whatsapp" element={<WhatsAppPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="work" element={<WorkPage />} />
          <Route path="about" element={<AboutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

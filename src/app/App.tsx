import { BrowserRouter, Routes, Route } from "react-router";
import { LanguageProvider } from "./lib/language";
import { Layout } from "./components/site/Layout";
import { Toaster } from "./components/ui/sonner";

import Home from "./pages/Home";
import PlanVisit from "./pages/PlanVisit";
import About from "./pages/About";
import Pastor from "./pages/Pastor";
import Leadership from "./pages/Leadership";
import Ministries from "./pages/Ministries";
import MinistryDetail from "./pages/MinistryDetail";
import Sermons from "./pages/Sermons";
import SermonDetail from "./pages/SermonDetail";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Gallery from "./pages/Gallery";
import Prayer from "./pages/Prayer";
import Give from "./pages/Give";
import Contact from "./pages/Contact";
import Live from "./pages/Live";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/visit" element={<PlanVisit />} />
            <Route path="/about" element={<About />} />
            <Route path="/pastor" element={<Pastor />} />
            <Route path="/leadership" element={<Leadership />} />
            <Route path="/ministries" element={<Ministries />} />
            <Route path="/ministries/:id" element={<MinistryDetail />} />
            <Route path="/sermons" element={<Sermons />} />
            <Route path="/sermons/:id" element={<SermonDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/prayer" element={<Prayer />} />
            <Route path="/give" element={<Give />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/live" element={<Live />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </LanguageProvider>
  );
}

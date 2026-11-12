import { useEffect, useRef } from "react";
import "@/components/landing/immersive.css";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Footer from "@/components/landing/Footer";

export default function Landing() {
  const root = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.dataset.revealed = 'true'; observer.unobserve(entry.target); }
    }), { threshold: .12 });
    root.current.querySelectorAll('[data-reveal]').forEach(node => observer.observe(node));
    root.current.dataset.revealReady = 'true';
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={root} className="nx-market nx-immersive-landing min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}

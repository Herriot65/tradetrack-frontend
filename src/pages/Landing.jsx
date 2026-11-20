import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Footer from "@/components/landing/Footer";
import { useDesign } from "@/lib/design";

export default function Landing() {
  const [design] = useDesign();
  return (
    <div className={`nx-market min-h-screen${design === "3d" ? " nx-immersive-landing" : ""}`}>
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

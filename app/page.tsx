import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import FeaturesBento from "@/components/FeaturesBento";
import Showcase from "@/components/Showcase";
import HowItWorks from "@/components/HowItWorks";
import UseCases from "@/components/UseCases";
import Metrics from "@/components/Metrics";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative overflow-x-clip">
      <Navbar />
      <Hero />
      <TrustBar />
      <FeaturesBento />
      <Showcase />
      <HowItWorks />
      <UseCases />
      <Metrics />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}

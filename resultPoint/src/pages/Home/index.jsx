import React from 'react';
import AmbientGradients from './components/AmbientGradients';
import Hero from './components/Hero';
import CalculatorsSection from './components/CalculatorsSection';
import HowItWorks from './components/HowItWorks';
import PerformanceSection from './components/PerformanceSection';
import UniversitiesSection from './components/UniversitiesSection';
import ToolsSection from './components/ToolsSection';
import ResourcesSection from './components/ResourcesSection';
import TestimonialsSection from './components/TestimonialsSection';
import FaqSection from './components/FaqSection';
import FinalCtaSection from './components/FinalCtaSection';

export default function Home() {
  return (
    <>
      <AmbientGradients />
      <Hero />
      <CalculatorsSection />
      <HowItWorks />
      <PerformanceSection />
      <UniversitiesSection />
      <ToolsSection />
      <ResourcesSection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
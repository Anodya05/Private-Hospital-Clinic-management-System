import React from 'react';
import HeroSection from '../components/HomePage/HeroSection';
import FeaturesGrid from '../components/HomePage/FeaturesGrid';
import ServicesCards from '../components/HomePage/ServicesCards';
import WhyChooseUs from '../components/HomePage/WhyChooseUs';
import TelemedicinePromo from '../components/HomePage/TelemedicinePromo';
import TestimonialsSection from '../components/HomePage/TestimonialsSection';
import QuickActionsBar from '../components/HomePage/QuickActionsBar';
import Footer from '../components/HomePage/Footer';

const HomePage: React.FC = () => {
  return (
    <div>
      <HeroSection />
      <FeaturesGrid />
      <ServicesCards />
      <WhyChooseUs />
      <TelemedicinePromo />
      <QuickActionsBar />
      <TestimonialsSection />
      <Footer />
    </div>
  );
};

export default HomePage;


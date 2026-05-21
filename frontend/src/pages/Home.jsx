import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/home/Hero';
import HowItWorks from '../components/home/HowItWorks';
import About from '../components/home/About';
import Stats from '../components/home/Stats';
import InternshipList from '../components/home/InternshipList';
import Reviews from '../components/home/Reviews';
import Resources from '../components/home/Resources';
import Contact from '../components/home/Contact';
import Policies from '../components/home/Policies';
import LandingCTA from '../components/home/LandingCTA';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div id="landingPage" className="page active neo-page">
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <About />
      <InternshipList />
      <Reviews />
      <Resources />
      <LandingCTA />
      <Contact />
      <Policies />
      <Footer />
    </div>
  );
};

export default Home;

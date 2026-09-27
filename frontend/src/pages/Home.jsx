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
import BuiltBy from '../components/home/BuiltBy';
import LandingCTA from '../components/home/LandingCTA';
import Footer from '../components/Footer';
import { useSEO } from '../seo/useSEO';

const Home = () => {
  useSEO({
    title: 'Find Internships Across Every Field',
    description:
      'NEOGEN INTERNSHIP ENGINE — India\'s AI-powered internship discovery platform for students across ' +
      'Engineering, Commerce, Management, Law, Medical, Design, Agriculture and 20+ other fields. ' +
      'Find remote, work-from-home, and on-site internships. Apply today.',
    canonical: 'https://neogeninternshipengine.me/',
  });
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
      <BuiltBy />
      <Footer />
    </div>
  );
};

export default Home;

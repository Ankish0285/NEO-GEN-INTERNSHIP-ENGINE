import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/home/Hero';
import HowItWorks from '../components/home/HowItWorks';
import About from '../components/home/About';
// import Stats from '../components/home/Stats';
import Notifications from '../components/home/Notifications';
import InternshipList from '../components/home/InternshipList';
import Reviews from '../components/home/Reviews';
import Resources from '../components/home/Resources';
import Contact from '../components/home/Contact';
import Policies from '../components/home/Policies';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div id="landingPage" className="page active">
      <Navbar />
      <Hero />
      <HowItWorks />
      <About />
      {/* <Stats /> */}
      {/* <Notifications /> */}
      <InternshipList />
      <Reviews />
      <Resources />
      <Contact />
      <Policies />
      <Footer />
    </div>
  );
};

export default Home;

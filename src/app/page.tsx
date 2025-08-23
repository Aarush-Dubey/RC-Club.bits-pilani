

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plane, 
  ArrowRight, 
  Github, 
  Instagram, 
  Linkedin,
  Sun, 
  Moon, 
  Menu, 
  X,
  Check,
  Zap,
  Users,
  Trophy,
  Target,
  ChevronRight,
  Award,
  Wrench,
  Cloud,
  UserCheck,
  Calendar,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const navigation = [
  { name: 'About', href: '#about' },
  { name: 'Projects', href: '#projects' },
  { name: 'Sky Highs', href: '#sky-highs' },
  { name: 'Achievements', href: '#achievements' },
  { name: 'Contact', href: '#contact' }
];

const stats = [
  { label: 'Build Fly Crash', value: '🔥' },
  { label: 'Repeat', value: '♾️' }
];

const features = [
  {
    icon: Wrench,
    title: 'Build & Innovate',
    description: 'From UAVs to F-22 Raptor replicas, we build what others only dream of.'
  },
  {
    icon: Cloud,
    title: 'Sky Highs Experience',
    description: 'One of the best events at Apogee - where engineering meets adrenaline.'
  },
  {
    icon: Trophy,
    title: 'Competition Champions',
    description: 'Robofest winners with ₹5 lakh prize - proof that our builds actually fly.'
  }
];

const projects = [
  {
    title: 'F-22 Raptor Scale Model',
    description: 'Because why build normal planes when you can build fighter jets? 🚁',
    status: 'Built',
    category: 'Fixed Wing',
    details: {
      overview: 'A detailed scale model of the F-22 Raptor fighter jet built by our team. This project showcases advanced aerodynamic design and precision engineering.',
      specifications: [
        'Wingspan: Custom scale design',
        'Materials: Lightweight composite materials',
        'Control: Multi-channel RC system',
        'Features: Detailed exterior finish'
      ],
      challenges: 'Achieving the complex geometry and maintaining structural integrity while keeping it lightweight.',
      outcome: 'Successfully completed with impressive visual appeal and stable flight characteristics.'
    }
  },
  {
    title: '5 Axis Hotwire CNC machine',
    description: 'Made in-house to create complex foam cores for our custom aircraft designs.',
    status: 'Operational',
    category: 'In-house Tools',
    details: {
      overview: 'A custom-built 5-axis hotwire CNC machine designed and fabricated by our club members. This machine allows us to cut intricate foam shapes for wings and fuselages with high precision.',
      specifications: [
        '5-axis of freedom for complex cuts',
        'Nichrome wire for clean, precise foam cutting',
        'Custom GRBL-based controller firmware',
        'Designed for large foam blocks'
      ],
      challenges: 'Calibrating the five axes for synchronized movement and ensuring consistent wire temperature were major engineering hurdles.',
      outcome: 'Fully operational machine that has drastically improved our ability to prototype and build custom airframes with complex aerodynamic profiles.'
    }
  },
  {
    title: 'Custom Drones',
    description: 'Various drone builds - some fly, some become expensive paperweights.',
    status: 'Ongoing',
    category: 'Multi-rotor',
    details: {
      overview: 'An ongoing series of custom drone projects ranging from racing quads to heavy-lift platforms. Each build teaches us something new.',
      specifications: [
        'Various frame sizes and configurations',
        'Custom flight controller programming',
        'Different payload capabilities',
        'Experimental designs and features'
      ],
      challenges: 'Balancing performance, reliability, and cost while experimenting with new technologies.',
      outcome: 'Continuous learning and improvement in drone technology and design principles.'
    }
  }
];

const achievements = [
  {
    title: 'Robofest Champion 2023',
    description: 'Won the national robotics competition with our autonomous UAV.',
    icon: Trophy,
    highlight: false
  },
  {
    title: 'Multiple Competition Participations',
    description: 'Regular participation and recognition in various national and regional competitions.',
    icon: Target,
    highlight: false
  }
];

export default function HomePage() {
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [memberClicks, setMemberClicks] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage?.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove('dark');
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', 'light');
      }
    } else {
      document.documentElement.classList.add('dark');
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', 'dark');
      }
    }
  };

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    setMemberClicks(prev => prev + 1);
    if (memberClicks >= 4) {
      // Show member login after 5 clicks
      alert('Member Login Portal');
      setMemberClicks(0);
    }
  };

  const openProjectModal = (project:any) => {
    setSelectedProject(project);
  };

  const closeProjectModal = () => {
    setSelectedProject(null);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={handleLogoClick}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-white transform rotate-45" />
              </div>
              <span className="font-bold text-lg">RC Club</span>
              {memberClicks > 2 && (
                <UserCheck className="w-4 h-4 text-muted-foreground opacity-50" />
              )}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </button>
              ))}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md hover:bg-accent transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md hover:bg-accent transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md hover:bg-accent transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-border">
              <div className="py-2 space-y-1">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.href)}
                    className="block w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Project Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl font-bold">{(selectedProject as any).title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    (selectedProject as any).status === 'Champion' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    (selectedProject as any).status === 'Built' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    (selectedProject as any).status === 'Operational' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {(selectedProject as any).status}
                  </span>
                </div>
                <button
                  onClick={closeProjectModal}
                  className="p-2 hover:bg-accent rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-2">Overview</h4>
                  <p className="text-muted-foreground">{(selectedProject as any).details.overview}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-2">Specifications</h4>
                  <ul className="space-y-1">
                    {(selectedProject as any).details.specifications.map((spec: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground text-sm">{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-2">Challenges</h4>
                  <p className="text-muted-foreground">{(selectedProject as any).details.challenges}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-2">Outcome</h4>
                  <p className="text-muted-foreground">{(selectedProject as any).details.outcome}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              RC Club{' '}
              <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                BITS Pilani
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed">
              <strong className="text-2xl font-bold text-orange-500">Build Fly Crash Repeat</strong>
            </p>
            
            <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              We build crazy projects from UAVs to F-22 Raptor models. Sometimes they fly, sometimes they don't. But we always learn something new.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-8 py-3 rounded-lg font-medium text-white"
                onClick={() => scrollToSection('#projects')}
              >
                See Our Builds
                <Plane className="ml-2 w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                className="px-8 py-3 rounded-lg font-medium"
                onClick={() => scrollToSection('#sky-highs')}
              >
                Sky Highs @ Apogee
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-2 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 rounded-lg bg-muted/30 border border-border">
                <div className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  The <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Arson Enthusiasts</span> 🔥
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  We're RC Club BITS Pilani - where engineering meets chaos and somehow beautiful things happen. Our motto? <strong>Build Fly Crash Repeat</strong>. Because every crash is just a learning opportunity in disguise.
                </p>
                <p className="text-muted-foreground">
                  From winning at Robofest to conducting Sky Highs (one of the best events at Apogee), we've proven that our builds don't just look good - they actually work.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Competition Winners</p>
                    <p className="text-sm text-muted-foreground">Robofest champions - our UAV actually flew when it mattered</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Sky Highs at Apogee</p>
                    <p className="text-sm text-muted-foreground">We conduct one of the best events at Apogee BITS Pilani</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Crazy Builds</p>
                    <p className="text-sm text-muted-foreground">From F-22 Raptor models to custom drones - we build what we want</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-border relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center animate-pulse">
                    <Plane className="w-16 h-16 text-white transform rotate-45" />
                  </div>
                </div>
                <div className="absolute top-4 right-4 text-4xl">🔥</div>
                <div className="absolute bottom-4 left-4 text-4xl">✈️</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="achievements" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Our <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Achievements</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              When we're not crashing planes, we're actually pretty good at this stuff.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {achievements.map((achievement, index) => (
              <div key={index} className="bg-muted/30 border border-border hover:bg-muted/50 transition-colors rounded-2xl p-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <achievement.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{achievement.title}</h3>
                    <p className="text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Our <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Crazy</span> Builds
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From UAVs to F-22 Raptor replicas - here's what happens when engineers have too much free time.
            </p>
          </div>

          <div className="space-y-6">
            {projects.map((project, index) => (
              <div key={index} className="bg-muted/30 border border-border hover:bg-muted/50 transition-colors rounded-2xl p-8 group" onClick={() => openProjectModal(project)}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex-1 mb-6 lg:mb-0">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-semibold">{project.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === 'Champion' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        project.status === 'Built' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                         project.status === 'Operational' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {project.status}
                      </span>
                      <span className="px-2 py-1 bg-muted rounded-md text-xs">
                        {project.category}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4">{project.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sky Highs Section */}
      <section id="sky-highs" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Sky Highs</span> @ Apogee
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The premier airshow of BITS Pilani's technical fest, Apogee. Organized by us, for the love of flight.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Sky Highs is more than just an event; it's a celebration of aerospace engineering. We showcase our best builds, from high-speed jets to acrobatic drones, pulling off stunts that leave the crowd breathless. It's a key highlight of Apogee and a testament to the club's passion and skill.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Thrilling aerial acrobatic displays</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Showcase of our most innovative and daring projects</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">A massive crowd-puller at Apogee, BITS Pilani's tech fest</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden">
                <img src="https://placehold.co/600x400.png" alt="Sky Highs event" data-ai-hint="airshow festival" className="w-full h-full object-cover"/>
            </div>
          </div>
        </div>
      </section>
      
      {/* Contact Section */}
      <section id="contact" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Contact</span> Us?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join RC Club BITS Pilani and experience the thrill of building, flying, and occasionally crashing some really cool aircraft. Don't worry, we'll teach you how to build them stronger next time.
            </p>
          </div>

          <div className="grid md:grid-cols-1 gap-12 max-w-xl mx-auto">
            <div className="space-y-8 md:col-span-1 flex flex-col items-center">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-center">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">rcclub@pilani.bits-pilani.ac.in</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">BITS Pilani, Pilani Campus, Rajasthan</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <h3 className="text-xl font-semibold mb-4 text-center">Follow Our Journey</h3>
                <div className="flex space-x-4 justify-center">
                  <Button variant="outline" size="sm" className="p-3">
                    <Github className="w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="sm" className="p-3">
                    <Instagram className="w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="sm" className="p-3">
                    <Linkedin className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-muted/50 border border-border">
              <Plane className="w-5 h-5 mr-3 text-orange-500" />
              <span className="text-sm font-medium">Ready to join the adventure? We're always looking for passionate builders!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-md flex items-center justify-center">
                <Plane className="w-3 h-3 text-white transform rotate-45" />
              </div>
              <span className="font-semibold">RC Club BITS Pilani</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 RC Club BITS Pilani. Build Fly Crash Repeat. 🔥
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

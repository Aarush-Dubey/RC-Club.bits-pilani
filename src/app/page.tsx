

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plane, 
  ArrowRight, 
  Github, 
  Twitter, 
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
  ChevronRight
} from 'lucide-react';

const navigation = [
  { name: 'About', href: '#about' },
  { name: 'Projects', href: '#projects' },
  { name: 'Team', href: '#team' },
  { name: 'Join', href: '#join' }
];

const stats = [
  { label: 'Years Active', value: '15+' },
  { label: 'Aircraft Built', value: '200+' },
  { label: 'Competitions Won', value: '50+' },
  { label: 'Alumni Network', value: '500+' }
];

const features = [
  {
    icon: Zap,
    title: 'Cutting-Edge Technology',
    description: 'Work with autonomous flight systems, advanced sensors, and AI-powered navigation.'
  },
  {
    icon: Users,
    title: 'Expert Mentorship',
    description: 'Learn from industry professionals and experienced faculty advisors.'
  },
  {
    icon: Trophy,
    title: 'Competition Excellence',
    description: 'Consistent winners in SAE Aero Design, SUAS, and international competitions.'
  }
];

const projects = [
  {
    title: 'Autonomous Fixed-Wing UAV',
    description: 'Advanced autonomous navigation with GPS waypoint following and obstacle avoidance.',
    status: 'Active',
    year: '2024',
    tech: ['Computer Vision', 'GPS Navigation', 'Autonomous Systems']
  },
  {
    title: 'VTOL Aircraft Prototype',
    description: 'Vertical takeoff aircraft combining helicopter agility with fixed-wing efficiency.',
    status: 'Development',
    year: '2024',
    tech: ['VTOL Technology', 'Hybrid Systems', 'Advanced Controls']
  },
  {
    title: 'SAE Aero Design Champion',
    description: 'Competition-winning cargo aircraft with maximum payload optimization.',
    status: 'Complete',
    year: '2023',
    tech: ['Aerodynamics', 'Structural Design', 'Performance Optimization']
  }
];

const team = [
  { role: 'President', name: 'Leadership & Strategy' },
  { role: 'Technical Lead', name: 'Engineering Excellence' },
  { role: 'Design Head', name: 'Aerodynamics & CAD' },
  { role: 'Operations', name: 'Safety & Protocols' }
];

export default function HomePage() {
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
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
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 blur-backdrop">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-white dark:text-black" />
              </div>
              <span className="font-semibold text-lg">RC Club</span>
            </div>

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

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50 animate-grid-move"></div>
        <div className="absolute inset-0 gradient-radial"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-in-from-bottom">
              RC Club{' '}
              <span className="text-gradient-red">BITS Pilani</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-in-from-bottom delay-100">
              Engineering the future of autonomous flight. Building UAVs, drones, and aircraft that push the boundaries of aerospace technology.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-from-bottom delay-200">
              <Button 
                variant="outline" 
                className="btn-secondary px-8 py-3 rounded-lg font-medium"
                onClick={() => scrollToSection('#projects')}
              >
                View Projects
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 animate-slide-in-from-bottom delay-300">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-foreground">{stat.value}</div>
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
                <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gradient">
                  Pioneering Aerospace Innovation
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Since 2008, RC Club BITS Pilani has been at the forefront of student-led aerospace research and development. We're not just building model aircraft—we're creating the next generation of autonomous flight systems.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Industry Partnerships</p>
                    <p className="text-sm text-muted-foreground">Direct connections with ISRO, HAL, and leading aerospace companies</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Cutting-Edge Research</p>
                    <p className="text-sm text-muted-foreground">Advanced work in autonomous systems, AI navigation, and VTOL technology</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Global Recognition</p>
                    <p className="text-sm text-muted-foreground">Award-winning projects in international aerospace competitions</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-muted/50 border border-border relative overflow-hidden">
                <div className="absolute inset-0 gradient-conic opacity-50"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-black dark:bg-white rounded-2xl flex items-center justify-center animate-pulse-subtle">
                    <Plane className="w-12 h-12 text-white dark:text-black" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gradient">
              Why Join RC Club?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience hands-on aerospace engineering with industry-standard tools and expert guidance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-hover rounded-2xl p-8">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gradient">
              Featured Projects
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our latest innovations in autonomous flight and aerospace engineering.
            </p>
          </div>

          <div className="space-y-6">
            {projects.map((project, index) => (
              <div key={index} className="card-hover rounded-2xl p-8 group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex-1 mb-6 lg:mb-0">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-semibold">{project.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        project.status === 'Development' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {project.status}
                      </span>
                      <span className="text-sm text-muted-foreground">{project.year}</span>
                    </div>
                    <p className="text-muted-foreground mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech, techIndex) => (
                        <span key={techIndex} className="px-2 py-1 bg-muted rounded-md text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gradient">
              Leadership Team
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Meet the dedicated individuals driving innovation at RC Club BITS Pilani.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="card-hover rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="font-semibold mb-1">{member.role}</h3>
                <p className="text-sm text-muted-foreground">{member.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="join" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-gradient">
              Ready to Take Flight?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join the next generation of aerospace engineers. Applications are now open for passionate students ready to push the boundaries of flight technology.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="btn-primary px-8 py-3 rounded-lg font-medium">
                Apply Now
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button variant="outline" className="btn-secondary px-8 py-3 rounded-lg font-medium">
                Contact Us
              </Button>
            </div>
            
            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">Follow our journey</p>
              <div className="flex justify-center space-x-4">
                <Button variant="ghost" size="sm" className="p-2">
                  <Github className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Linkedin className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-black dark:bg-white rounded-md flex items-center justify-center">
                <Plane className="w-3 h-3 text-white dark:text-black" />
              </div>
              <span className="font-semibold">RC Club BITS Pilani</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 RC Club BITS Pilani. Engineering the future of flight.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
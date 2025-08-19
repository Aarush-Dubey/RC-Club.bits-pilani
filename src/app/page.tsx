

// // 'use client';

// // import Link from 'next/link';
// // import { useState, useEffect } from 'react';
// // import { Button } from '@/components/ui/button';
// // import { 
// //   Plane, 
// //   ArrowRight, 
// //   Github, 
// //   Twitter, 
// //   Linkedin,
// //   Sun, 
// //   Moon, 
// //   Menu, 
// //   X,
// //   Check,
// //   Zap,
// //   Users,
// //   Trophy,
// //   Target,
// //   ChevronRight
// // } from 'lucide-react';

// // const navigation = [
// //   { name: 'About', href: '#about' },
// //   { name: 'Projects', href: '#projects' },
// //   { name: 'Team', href: '#team' },
// //   { name: 'Join', href: '#join' }
// // ];

// // const stats = [
// //   { label: 'Years Active', value: '15+' },
// //   { label: 'Aircraft Built', value: '200+' },
// //   { label: 'Competitions Won', value: '50+' },
// //   { label: 'Alumni Network', value: '500+' }
// // ];

// // const features = [
// //   {
// //     icon: Zap,
// //     title: 'Cutting-Edge Technology',
// //     description: 'Work with autonomous flight systems, advanced sensors, and AI-powered navigation.'
// //   },
// //   {
// //     icon: Users,
// //     title: 'Expert Mentorship',
// //     description: 'Learn from industry professionals and experienced faculty advisors.'
// //   },
// //   {
// //     icon: Trophy,
// //     title: 'Competition Excellence',
// //     description: 'Consistent winners in SAE Aero Design, SUAS, and international competitions.'
// //   }
// // ];

// // const projects = [
// //   {
// //     title: 'Autonomous Fixed-Wing UAV',
// //     description: 'Advanced autonomous navigation with GPS waypoint following and obstacle avoidance.',
// //     status: 'Active',
// //     year: '2024',
// //     tech: ['Computer Vision', 'GPS Navigation', 'Autonomous Systems']
// //   },
// //   {
// //     title: 'VTOL Aircraft Prototype',
// //     description: 'Vertical takeoff aircraft combining helicopter agility with fixed-wing efficiency.',
// //     status: 'Development',
// //     year: '2024',
// //     tech: ['VTOL Technology', 'Hybrid Systems', 'Advanced Controls']
// //   },
// //   {
// //     title: 'SAE Aero Design Champion',
// //     description: 'Competition-winning cargo aircraft with maximum payload optimization.',
// //     status: 'Complete',
// //     year: '2023',
// //     tech: ['Aerodynamics', 'Structural Design', 'Performance Optimization']
// //   }
// // ];

// // const team = [
// //   { role: 'President', name: 'Leadership & Strategy' },
// //   { role: 'Technical Lead', name: 'Engineering Excellence' },
// //   { role: 'Design Head', name: 'Aerodynamics & CAD' },
// //   { role: 'Operations', name: 'Safety & Protocols' }
// // ];

// // export default function HomePage() {
// //   const [isDark, setIsDark] = useState(false);
// //   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
// //   const [mounted, setMounted] = useState(false);

// //   useEffect(() => {
// //     setMounted(true);
// //     const savedTheme = localStorage.getItem('theme');
// //     const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
// //     if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
// //       setIsDark(true);
// //       document.documentElement.classList.add('dark');
// //     }
// //   }, []);

// //   const toggleTheme = () => {
// //     setIsDark(!isDark);
// //     if (isDark) {
// //       document.documentElement.classList.remove('dark');
// //       localStorage.setItem('theme', 'light');
// //     } else {
// //       document.documentElement.classList.add('dark');
// //       localStorage.setItem('theme', 'dark');
// //     }
// //   };

// //   const scrollToSection = (href: string) => {
// //     const element = document.querySelector(href);
// //     if (element) {
// //       element.scrollIntoView({ behavior: 'smooth' });
// //     }
// //     setIsMobileMenuOpen(false);
// //   };

// //   if (!mounted) return null;

// //   return (
// //     <div className="min-h-screen bg-background">
// //       {/* Navigation */}
// //       <nav className="fixed top-0 w-full z-50 blur-backdrop">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //           <div className="flex justify-between items-center h-16">
// //             <div className="flex items-center space-x-2">
// //               <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
// //                 <Plane className="w-4 h-4 text-white dark:text-black" />
// //               </div>
// //               <span className="font-semibold text-lg">RC Club</span>
// //             </div>

// //             {/* Desktop Navigation */}
// //             <div className="hidden md:flex items-center space-x-8">
// //               {navigation.map((item) => (
// //                 <button
// //                   key={item.name}
// //                   onClick={() => scrollToSection(item.href)}
// //                   className="text-sm text-muted-foreground hover:text-foreground transition-colors"
// //                 >
// //                   {item.name}
// //                 </button>
// //               ))}
// //               <button
// //                 onClick={toggleTheme}
// //                 className="p-2 rounded-md hover:bg-accent transition-colors"
// //               >
// //                 {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
// //               </button>
// //             </div>

// //             {/* Mobile menu button */}
// //             <div className="md:hidden flex items-center space-x-2">
// //               <button
// //                 onClick={toggleTheme}
// //                 className="p-2 rounded-md hover:bg-accent transition-colors"
// //               >
// //                 {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
// //               </button>
// //               <button
// //                 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
// //                 className="p-2 rounded-md hover:bg-accent transition-colors"
// //               >
// //                 {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
// //               </button>
// //             </div>
// //           </div>

// //           {/* Mobile Navigation */}
// //           {isMobileMenuOpen && (
// //             <div className="md:hidden border-t border-border">
// //               <div className="py-2 space-y-1">
// //                 {navigation.map((item) => (
// //                   <button
// //                     key={item.name}
// //                     onClick={() => scrollToSection(item.href)}
// //                     className="block w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
// //                   >
// //                     {item.name}
// //                   </button>
// //                 ))}
// //               </div>
// //             </div>
// //           )}
// //         </div>
// //       </nav>

// //       {/* Hero Section */}
// //       <section className="pt-32 pb-20 relative overflow-hidden">
// //         <div className="absolute inset-0 grid-pattern opacity-50 animate-grid-move"></div>
// //         <div className="absolute inset-0 gradient-radial"></div>
        
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
// //           <div className="text-center max-w-4xl mx-auto">
            
// //             <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-in-from-bottom">
// //               RC Club{' '}
// //               <span className="text-gradient-red">BITS Pilani</span>
// //             </h1>
            
// //             <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-in-from-bottom delay-100">
// //               Engineering the future of autonomous flight. Building UAVs, drones, and aircraft that push the boundaries of aerospace technology.
// //             </p>
            
// //             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-from-bottom delay-200">
// //               <Button 
// //                 variant="outline" 
// //                 className="btn-secondary px-8 py-3 rounded-lg font-medium"
// //                 onClick={() => scrollToSection('#projects')}
// //               >
// //                 View Projects
// //               </Button>
// //             </div>
// //           </div>

// //           {/* Stats */}
// //           <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 animate-slide-in-from-bottom delay-300">
// //             {stats.map((stat, index) => (
// //               <div key={index} className="text-center">
// //                 <div className="text-3xl lg:text-4xl font-bold text-foreground">{stat.value}</div>
// //                 <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </section>

// //       {/* About Section */}
// //       <section id="about" className="py-20 border-t border-border">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //           <div className="grid lg:grid-cols-2 gap-16 items-center">
// //             <div className="space-y-8">
// //               <div>
// //                 <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gradient">
// //                   Pioneering Aerospace Innovation
// //                 </h2>
// //                 <p className="text-lg text-muted-foreground leading-relaxed">
// //                   Since 2008, RC Club BITS Pilani has been at the forefront of student-led aerospace research and development. We're not just building model aircraft—we're creating the next generation of autonomous flight systems.
// //                 </p>
// //               </div>
              
// //               <div className="space-y-4">
// //                 <div className="flex items-start space-x-3">
// //                   <Check className="w-5 h-5 text-green-500 mt-0.5" />
// //                   <div>
// //                     <p className="font-medium">Industry Partnerships</p>
// //                     <p className="text-sm text-muted-foreground">Direct connections with ISRO, HAL, and leading aerospace companies</p>
// //                   </div>
// //                 </div>
// //                 <div className="flex items-start space-x-3">
// //                   <Check className="w-5 h-5 text-green-500 mt-0.5" />
// //                   <div>
// //                     <p className="font-medium">Cutting-Edge Research</p>
// //                     <p className="text-sm text-muted-foreground">Advanced work in autonomous systems, AI navigation, and VTOL technology</p>
// //                   </div>
// //                 </div>
// //                 <div className="flex items-start space-x-3">
// //                   <Check className="w-5 h-5 text-green-500 mt-0.5" />
// //                   <div>
// //                     <p className="font-medium">Global Recognition</p>
// //                     <p className="text-sm text-muted-foreground">Award-winning projects in international aerospace competitions</p>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>
            
// //             <div className="relative">
// //               <div className="aspect-square rounded-2xl bg-muted/50 border border-border relative overflow-hidden">
// //                 <div className="absolute inset-0 gradient-conic opacity-50"></div>
// //                 <div className="absolute inset-0 flex items-center justify-center">
// //                   <div className="w-24 h-24 bg-black dark:bg-white rounded-2xl flex items-center justify-center animate-pulse-subtle">
// //                     <Plane className="w-12 h-12 text-white dark:text-black" />
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </section>

// //       {/* Features Section */}
// //       <section className="py-20 border-t border-border">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //           <div className="text-center mb-16">
// //             <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gradient">
// //               Why Join RC Club?
// //             </h2>
// //             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
// //               Experience hands-on aerospace engineering with industry-standard tools and expert guidance.
// //             </p>
// //           </div>

// //           <div className="grid md:grid-cols-3 gap-8">
// //             {features.map((feature, index) => (
// //               <div key={index} className="card-hover rounded-2xl p-8">
// //                 <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-6">
// //                   <feature.icon className="w-6 h-6" />
// //                 </div>
// //                 <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
// //                 <p className="text-muted-foreground">{feature.description}</p>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </section>

// //       {/* Projects Section */}
// //       <section id="projects" className="py-20 border-t border-border">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //           <div className="text-center mb-16">
// //             <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gradient">
// //               Featured Projects
// //             </h2>
// //             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
// //               Explore our latest innovations in autonomous flight and aerospace engineering.
// //             </p>
// //           </div>

// //           <div className="space-y-6">
// //             {projects.map((project, index) => (
// //               <div key={index} className="card-hover rounded-2xl p-8 group">
// //                 <div className="flex flex-col lg:flex-row lg:items-center justify-between">
// //                   <div className="flex-1 mb-6 lg:mb-0">
// //                     <div className="flex items-center space-x-3 mb-3">
// //                       <h3 className="text-xl font-semibold">{project.title}</h3>
// //                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
// //                         project.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
// //                         project.status === 'Development' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
// //                         'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
// //                       }`}>
// //                         {project.status}
// //                       </span>
// //                       <span className="text-sm text-muted-foreground">{project.year}</span>
// //                     </div>
// //                     <p className="text-muted-foreground mb-4">{project.description}</p>
// //                     <div className="flex flex-wrap gap-2">
// //                       {project.tech.map((tech, techIndex) => (
// //                         <span key={techIndex} className="px-2 py-1 bg-muted rounded-md text-xs">
// //                           {tech}
// //                         </span>
// //                       ))}
// //                     </div>
// //                   </div>
// //                   <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </section>

// //       {/* Team Section */}
// //       <section id="team" className="py-20 border-t border-border">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //           <div className="text-center mb-16">
// //             <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gradient">
// //               Leadership Team
// //             </h2>
// //             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
// //               Meet the dedicated individuals driving innovation at RC Club BITS Pilani.
// //             </p>
// //           </div>

// //           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
// //             {team.map((member, index) => (
// //               <div key={index} className="card-hover rounded-2xl p-6 text-center">
// //                 <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
// //                   <Target className="w-8 h-8" />
// //                 </div>
// //                 <h3 className="font-semibold mb-1">{member.role}</h3>
// //                 <p className="text-sm text-muted-foreground">{member.name}</p>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </section>

// //       {/* CTA Section */}
// //       <section id="join" className="py-20 border-t border-border">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //           <div className="text-center max-w-3xl mx-auto">
// //             <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-gradient">
// //               Ready to Take Flight?
// //             </h2>
// //             <p className="text-lg text-muted-foreground mb-8">
// //               Join the next generation of aerospace engineers. Applications are now open for passionate students ready to push the boundaries of flight technology.
// //             </p>
            
// //             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
// //               <Button className="btn-primary px-8 py-3 rounded-lg font-medium">
// //                 Apply Now
// //                 <ArrowRight className="ml-2 w-4 h-4" />
// //               </Button>
// //               <Button variant="outline" className="btn-secondary px-8 py-3 rounded-lg font-medium">
// //                 Contact Us
// //               </Button>
// //             </div>
            
// //             <div className="mt-8 pt-8 border-t border-border">
// //               <p className="text-sm text-muted-foreground mb-4">Follow our journey</p>
// //               <div className="flex justify-center space-x-4">
// //                 <Button variant="ghost" size="sm" className="p-2">
// //                   <Github className="w-4 h-4" />
// //                 </Button>
// //                 <Button variant="ghost" size="sm" className="p-2">
// //                   <Twitter className="w-4 h-4" />
// //                 </Button>
// //                 <Button variant="ghost" size="sm" className="p-2">
// //                   <Linkedin className="w-4 h-4" />
// //                 </Button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </section>

// //       {/* Footer */}
// //       <footer className="py-12 border-t border-border">
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //           <div className="flex flex-col md:flex-row justify-between items-center">
// //             <div className="flex items-center space-x-2 mb-4 md:mb-0">
// //               <div className="w-6 h-6 bg-black dark:bg-white rounded-md flex items-center justify-center">
// //                 <Plane className="w-3 h-3 text-white dark:text-black" />
// //               </div>
// //               <span className="font-semibold">RC Club BITS Pilani</span>
// //             </div>
// //             <p className="text-sm text-muted-foreground">
// //               © 2024 RC Club BITS Pilani. Engineering the future of flight.
// //             </p>
// //           </div>
// //         </div>
// //       </footer>
// //     </div>
// //   );
// // }


// 'use client';

// import Link from 'next/link';
// import { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { 
//   Plane, 
//   ArrowRight, 
//   Github, 
//   Instagram, 
//   Linkedin,
//   Sun, 
//   Moon, 
//   Menu, 
//   X,
//   Check,
//   Zap,
//   Users,
//   Trophy,
//   Target,
//   ChevronRight,
//   Award,
//   Wrench,
//   Cloud,
//   UserCheck
// } from 'lucide-react';

// const navigation = [
//   { name: 'About', href: '#about' },
//   { name: 'Projects', href: '#projects' },
//   { name: 'Events', href: '#events' },
//   { name: 'Join', href: '#join' }
// ];

// const stats = [
//   { label: 'Robofest Winner', value: '₹5L' },
//   { label: 'Sky Highs', value: 'Apogee' },
//   { label: 'Build Fly', value: 'Crash' },
//   { label: 'Repeat', value: '♾️' }
// ];

// const features = [
//   {
//     icon: Wrench,
//     title: 'Build & Innovate',
//     description: 'From UAVs to F-22 Raptor replicas, we build what others only dream of.'
//   },
//   {
//     icon: Cloud,
//     title: 'Sky Highs Experience',
//     description: 'One of the best events at Apogee - where engineering meets adrenaline.'
//   },
//   {
//     icon: Trophy,
//     title: 'Competition Champions',
//     description: 'Robofest winners with ₹5 lakh prize - proof that our builds actually fly.'
//   }
// ];

// const projects = [
//   {
//     title: 'F-22 Raptor Scale Model',
//     description: 'Because why build normal planes when you can build fighter jets? 🚁',
//     status: 'Built',
//     category: 'Fixed Wing'
//   },
//   {
//     title: 'Competition UAV',
//     description: 'The ₹5 lakh Robofest winner. This baby actually works (most of the time).',
//     status: 'Champion',
//     category: 'Autonomous'
//   },
//   {
//     title: 'Custom Drones',
//     description: 'Various drone builds - some fly, some become expensive paperweights.',
//     status: 'Ongoing',
//     category: 'Multi-rotor'
//   }
// ];

// const events = [
//   {
//     title: 'Sky Highs',
//     description: 'One of the best events at Apogee BITS Pilani. Where RC dreams take flight.',
//     highlight: true
//   },
//   {
//     title: 'Robofest Champion',
//     description: 'Won ₹5 lakh in the competition. Not bad for a bunch of engineering students.',
//     highlight: true
//   }
// ];

// export default function HomePage() {
//   const [isDark, setIsDark] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [mounted, setMounted] = useState(false);
//   const [memberClicks, setMemberClicks] = useState(0);

//   useEffect(() => {
//     setMounted(true);
//     const savedTheme = localStorage?.getItem('theme');
//     const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
//     if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
//       setIsDark(true);
//       document.documentElement.classList.add('dark');
//     }
//   }, []);

//   const toggleTheme = () => {
//     setIsDark(!isDark);
//     if (isDark) {
//       document.documentElement.classList.remove('dark');
//       if (typeof localStorage !== 'undefined') {
//         localStorage.setItem('theme', 'light');
//       }
//     } else {
//       document.documentElement.classList.add('dark');
//       if (typeof localStorage !== 'undefined') {
//         localStorage.setItem('theme', 'dark');
//       }
//     }
//   };

//   const scrollToSection = (href: string) => {
//     const element = document.querySelector(href);
//     if (element) {
//       element.scrollIntoView({ behavior: 'smooth' });
//     }
//     setIsMobileMenuOpen(false);
//   };

//   const handleLogoClick = () => {
//     setMemberClicks(prev => prev + 1);
//     if (memberClicks >= 4) {
//       // Show member login after 5 clicks
//       alert('Member Login Portal');
//       setMemberClicks(0);
//     }
//   };

//   if (!mounted) return null;

//   return (
//     <div className="min-h-screen bg-background text-foreground">
//       {/* Navigation */}
//       <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <button 
//               onClick={handleLogoClick}
//               className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
//             >
//               <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
//                 <Plane className="w-4 h-4 text-white transform rotate-45" />
//               </div>
//               <span className="font-bold text-lg">RC Club</span>
//               {memberClicks > 2 && (
//                 <UserCheck className="w-4 h-4 text-muted-foreground opacity-50" />
//               )}
//             </button>

//             {/* Desktop Navigation */}
//             <div className="hidden md:flex items-center space-x-8">
//               {navigation.map((item) => (
//                 <button
//                   key={item.name}
//                   onClick={() => scrollToSection(item.href)}
//                   className="text-sm text-muted-foreground hover:text-foreground transition-colors"
//                 >
//                   {item.name}
//                 </button>
//               ))}
//               <button
//                 onClick={toggleTheme}
//                 className="p-2 rounded-md hover:bg-accent transition-colors"
//               >
//                 {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
//               </button>
//             </div>

//             {/* Mobile menu button */}
//             <div className="md:hidden flex items-center space-x-2">
//               <button
//                 onClick={toggleTheme}
//                 className="p-2 rounded-md hover:bg-accent transition-colors"
//               >
//                 {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
//               </button>
//               <button
//                 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//                 className="p-2 rounded-md hover:bg-accent transition-colors"
//               >
//                 {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
//               </button>
//             </div>
//           </div>

//           {/* Mobile Navigation */}
//           {isMobileMenuOpen && (
//             <div className="md:hidden border-t border-border">
//               <div className="py-2 space-y-1">
//                 {navigation.map((item) => (
//                   <button
//                     key={item.name}
//                     onClick={() => scrollToSection(item.href)}
//                     className="block w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
//                   >
//                     {item.name}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <section className="pt-32 pb-20 relative overflow-hidden">
//         <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background"></div>
        
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
//           <div className="text-center max-w-4xl mx-auto">
//             <div className="inline-flex items-center px-4 py-2 rounded-full bg-muted/50 border border-border mb-8">
//               <Award className="w-4 h-4 mr-2 text-yellow-500" />
//               <span className="text-sm font-medium">₹5L Robofest Champions</span>
//             </div>
            
//             <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
//               RC Club{' '}
//               <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
//                 BITS Pilani
//               </span>
//             </h1>
            
//             <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed">
//               <strong className="text-2xl font-bold text-orange-500">Build Fly Crash Repeat</strong>
//             </p>
            
//             <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
//               We build crazy projects from UAVs to F-22 Raptor models. Sometimes they fly, sometimes they don't. But we always learn something new.
//             </p>
            
//             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
//               <Button 
//                 className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-8 py-3 rounded-lg font-medium text-white"
//                 onClick={() => scrollToSection('#projects')}
//               >
//                 See Our Builds
//                 <Plane className="ml-2 w-4 h-4" />
//               </Button>
//               <Button 
//                 variant="outline" 
//                 className="px-8 py-3 rounded-lg font-medium"
//                 onClick={() => scrollToSection('#events')}
//               >
//                 Sky Highs @ Apogee
//               </Button>
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8">
//             {stats.map((stat, index) => (
//               <div key={index} className="text-center p-4 rounded-lg bg-muted/30 border border-border">
//                 <div className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</div>
//                 <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* About Section */}
//       <section id="about" className="py-20 border-t border-border">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid lg:grid-cols-2 gap-16 items-center">
//             <div className="space-y-8">
//               <div>
//                 <h2 className="text-3xl lg:text-4xl font-bold mb-4">
//                   The <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Arson Enthusiasts</span> 🔥
//                 </h2>
//                 <p className="text-lg text-muted-foreground leading-relaxed mb-6">
//                   We're RC Club BITS Pilani - where engineering meets chaos and somehow beautiful things happen. Our motto? <strong>Build Fly Crash Repeat</strong>. Because every crash is just a learning opportunity in disguise.
//                 </p>
//                 <p className="text-muted-foreground">
//                   From winning ₹5 lakh at Robofest to conducting Sky Highs (one of the best events at Apogee), we've proven that our builds don't just look good - they actually work.
//                 </p>
//               </div>
              
//               <div className="space-y-4">
//                 <div className="flex items-start space-x-3">
//                   <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
//                   <div>
//                     <p className="font-medium">Competition Winners</p>
//                     <p className="text-sm text-muted-foreground">₹5 lakh Robofest champions - our UAV actually flew when it mattered</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start space-x-3">
//                   <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
//                   <div>
//                     <p className="font-medium">Sky Highs at Apogee</p>
//                     <p className="text-sm text-muted-foreground">We conduct one of the best events at Apogee BITS Pilani</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start space-x-3">
//                   <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
//                   <div>
//                     <p className="font-medium">Crazy Builds</p>
//                     <p className="text-sm text-muted-foreground">From F-22 Raptor models to custom drones - we build what we want</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
            
//             <div className="relative">
//               <div className="aspect-square rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-border relative overflow-hidden">
//                 <div className="absolute inset-0 flex items-center justify-center">
//                   <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center animate-pulse">
//                     <Plane className="w-16 h-16 text-white transform rotate-45" />
//                   </div>
//                 </div>
//                 <div className="absolute top-4 right-4 text-4xl">🔥</div>
//                 <div className="absolute bottom-4 left-4 text-4xl">✈️</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="py-20 border-t border-border">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl lg:text-4xl font-bold mb-4">
//               Why We're <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Different</span>
//             </h2>
//             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//               We don't just build planes. We build dreams, crash them, learn from the wreckage, and build them better.
//             </p>
//           </div>

//           <div className="grid md:grid-cols-3 gap-8">
//             {features.map((feature, index) => (
//               <div key={index} className="bg-muted/30 border border-border hover:bg-muted/50 transition-colors rounded-2xl p-8 group">
//                 <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-6">
//                   <feature.icon className="w-6 h-6 text-white" />
//                 </div>
//                 <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
//                 <p className="text-muted-foreground">{feature.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Projects Section */}
//       <section id="projects" className="py-20 border-t border-border">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl lg:text-4xl font-bold mb-4">
//               Our <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Crazy</span> Builds
//             </h2>
//             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//               From UAVs to F-22 Raptor replicas - here's what happens when engineers have too much free time.
//             </p>
//           </div>

//           <div className="space-y-6">
//             {projects.map((project, index) => (
//               <div key={index} className="bg-muted/30 border border-border hover:bg-muted/50 transition-colors rounded-2xl p-8 group">
//                 <div className="flex flex-col lg:flex-row lg:items-center justify-between">
//                   <div className="flex-1 mb-6 lg:mb-0">
//                     <div className="flex items-center space-x-3 mb-3">
//                       <h3 className="text-xl font-semibold">{project.title}</h3>
//                       <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//                         project.status === 'Champion' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
//                         project.status === 'Built' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
//                         'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
//                       }`}>
//                         {project.status}
//                       </span>
//                       <span className="px-2 py-1 bg-muted rounded-md text-xs">
//                         {project.category}
//                       </span>
//                     </div>
//                     <p className="text-muted-foreground mb-4">{project.description}</p>
//                   </div>
//                   <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Events Section */}
//       <section id="events" className="py-20 border-t border-border">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl lg:text-4xl font-bold mb-4">
//               Our <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Achievements</span>
//             </h2>
//             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//               When we're not crashing planes, we're actually pretty good at this stuff.
//             </p>
//           </div>

//           <div className="grid md:grid-cols-2 gap-8">
//             {events.map((event, index) => (
//               <div key={index} className="bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-orange-200 dark:border-orange-800 rounded-2xl p-8">
//                 <div className="flex items-start space-x-4">
//                   <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
//                     {event.title === 'Sky Highs' ? <Cloud className="w-6 h-6 text-white" /> : <Trophy className="w-6 h-6 text-white" />}
//                   </div>
//                   <div>
//                     <h3 className="text-xl font-semibold mb-2 text-orange-600 dark:text-orange-400">{event.title}</h3>
//                     <p className="text-muted-foreground">{event.description}</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section id="join" className="py-20 border-t border-border">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center max-w-3xl mx-auto">
//             <h2 className="text-3xl lg:text-4xl font-bold mb-6">
//               Ready to <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Crash</span> Some Planes?
//             </h2>
//             <p className="text-lg text-muted-foreground mb-8">
//               Join RC Club BITS Pilani and experience the thrill of building, flying, and occasionally crashing some really cool aircraft. Don't worry, we'll teach you how to build them stronger next time.
//             </p>
            
//             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
//               <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-8 py-3 rounded-lg font-medium text-white">
//                 Join the Chaos
//                 <ArrowRight className="ml-2 w-4 h-4" />
//               </Button>
//               <Button variant="outline" className="px-8 py-3 rounded-lg font-medium">
//                 Contact Us
//               </Button>
//             </div>
            
//             <div className="text-center">
//               <p className="text-sm text-muted-foreground mb-4">Follow our builds and crashes</p>
//               <div className="flex justify-center space-x-4">
//                 <Button variant="ghost" size="sm" className="p-2">
//                   <Github className="w-4 h-4" />
//                 </Button>
//                 <Button variant="ghost" size="sm" className="p-2">
//                   <Instagram className="w-4 h-4" />
//                 </Button>
//                 <Button variant="ghost" size="sm" className="p-2">
//                   <Linkedin className="w-4 h-4" />
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="py-12 border-t border-border">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex flex-col md:flex-row justify-between items-center">
//             <div className="flex items-center space-x-2 mb-4 md:mb-0">
//               <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-md flex items-center justify-center">
//                 <Plane className="w-3 h-3 text-white transform rotate-45" />
//               </div>
//               <span className="font-semibold">RC Club BITS Pilani</span>
//             </div>
//             <p className="text-sm text-muted-foreground">
//               © 2024 RC Club BITS Pilani. Build Fly Crash Repeat. 🔥
//             </p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }

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
  { label: 'Robofest Winner', value: '₹5L' },
  { label: 'Sky Highs', value: 'Apogee' },
  { label: 'Build Fly', value: 'Crash' },
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
    title: 'Competition UAV',
    description: 'The ₹5 lakh Robofest winner. This baby actually works (most of the time).',
    status: 'Champion',
    category: 'Autonomous',
    details: {
      overview: 'Our championship-winning autonomous UAV that secured the ₹5 lakh prize at Robofest. This project represents months of dedicated engineering and testing.',
      specifications: [
        'Autonomous flight capability',
        'Advanced sensor integration',
        'Competition-specific mission payload',
        'Reliable flight control system'
      ],
      challenges: 'Developing robust autonomous navigation and meeting strict competition requirements.',
      outcome: 'First place at Robofest with a prize of ₹5 lakh, proving our technical capabilities.'
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
    description: 'Won ₹5 lakh in the national robotics competition with our autonomous UAV.',
    icon: Trophy,
    highlight: true
  },
  {
    title: 'Best Technical Paper',
    description: 'Recognition for innovative approach in autonomous flight systems.',
    icon: Award,
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

  const openProjectModal = (project) => {
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
                  <h3 className="text-2xl font-bold">{selectedProject.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedProject.status === 'Champion' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    selectedProject.status === 'Built' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {selectedProject.status}
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
                  <p className="text-muted-foreground">{selectedProject.details.overview}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-2">Specifications</h4>
                  <ul className="space-y-1">
                    {selectedProject.details.specifications.map((spec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground text-sm">{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-2">Challenges</h4>
                  <p className="text-muted-foreground">{selectedProject.details.challenges}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-2">Outcome</h4>
                  <p className="text-muted-foreground">{selectedProject.details.outcome}</p>
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
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-muted/50 border border-border mb-8">
              <Award className="w-4 h-4 mr-2 text-yellow-500" />
              <span className="text-sm font-medium">₹5L Robofest Champions</span>
            </div>
            
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
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8">
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
                  From winning ₹5 lakh at Robofest to conducting Sky Highs (one of the best events at Apogee), we've proven that our builds don't just look good - they actually work.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Competition Winners</p>
                    <p className="text-sm text-muted-foreground">₹5 lakh Robofest champions - our UAV actually flew when it mattered</p>
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
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Our <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Achievements</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              When we're not crashing planes, we're actually pretty good at this stuff.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {achievements.map((achievement, index) => (
              <div key={index} className={`${achievement.highlight ? 'bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-orange-200 dark:border-orange-800' : 'bg-muted/30 border border-border hover:bg-muted/50'} transition-colors rounded-2xl p-8`}>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <achievement.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold mb-2 ${achievement.highlight ? 'text-orange-600 dark:text-orange-400' : ''}`}>{achievement.title}</h3>
                    <p className="text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              </div>
            ))}
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

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">rcclub@pilani.bits-pilani.ac.in</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Contact</p>
                      <p className="text-sm text-muted-foreground">Available through club activities</p>
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

              <div>
                <h3 className="text-xl font-semibold mb-4">Follow Our Journey</h3>
                <div className="flex space-x-4">
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

            <div className="bg-muted/30 border border-border rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-6">Quick Message</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input 
                    type="text" 
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input 
                    type="email" 
                    placeholder="your.email@example.com"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea 
                    rows="4" 
                    placeholder="Tell us about your interest in RC aircraft..."
                    className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  ></textarea>
                </div>
                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white">
                  Send Message
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
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
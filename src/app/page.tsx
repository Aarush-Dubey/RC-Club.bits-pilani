
// // import Link from 'next/link';
// // import Image from 'next/image';
// // import { Button } from '@/components/ui/button';
// // import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// // import { Rocket, Users, Wrench, Plane } from 'lucide-react';
// // import { PublicHeader } from '@/components/public-header';

// // const projects = [
// //   {
// //     name: 'Autonomous Fixed-Wing UAV (2024)',
// //     image: 'https://placehold.co/600x400.png',
// //     hint: 'autonomous drone',
// //   },
// //   {
// //     name: 'VTOL Prototype',
// //     image: 'https://placehold.co/600x400.png',
// //     hint: 'vtol aircraft',
// //   },
// //   {
// //     name: 'SAE Aero Design 2023',
// //     image: 'https://placehold.co/600x400.png',
// //     hint: 'model airplane competition',
// //   },
// // ];

// // const benefits = [
// //     {
// //         icon: Rocket,
// //         title: "Hands-On Experience",
// //         description: "Gain practical skills by designing, building, and testing advanced UAVs from the ground up."
// //     },
// //     {
// //         icon: Users,
// //         title: "Expert Mentorship",
// //         description: "Learn from senior members and faculty advisors with deep aerospace and robotics knowledge."
// //     },
// //     {
// //         icon: Wrench,
// //         title: "Cutting-Edge Resources",
// //         description: "Access state-of-the-art labs, workshops, and a comprehensive inventory of RC components."
// //     }
// // ]

// // export default function HomePage() {
// //   return (
// //     <div className="flex flex-col min-h-screen bg-white dark:bg-black text-black dark:text-white">
// //       <PublicHeader />
// //       <main className="flex-grow">
// //         <section className="relative bg-secondary py-20 md:py-32 overflow-hidden">
// //           <div className="container px-4 md:px-6 text-center relative z-10">
// //             <div className="relative inline-block">
// //               <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 drop-shadow-lg">
// //                 RC-Club BITS Pilani
// //               </h1>
// //               <div className="absolute top-0 -right-12 md:-right-16 h-full flex items-center -z-10">
// //                   <svg width="64" height="64" viewBox="0 0 100 100" className="h-12 w-12 md:h-16 md:w-16">
// //                       <path d="M 5 60 Q 30 50, 60 40" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" strokeDasharray="5 5" />
// //                       <g transform="translate(60, 35) rotate(0)">
// //                           <Plane className="h-5 w-5 md:h-6 md:w-6 text-primary" fill="hsl(var(--primary))" />
// //                       </g>
// //                   </svg>
// //               </div>
// //             </div>
// //             <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
// //               Building autonomous aircraft, pushing boundaries, and training the next generation of aerospace innovators.
// //             </p>
// //             <div className="mt-8">
// //               <Button asChild size="lg" variant="default" className="rounded-none">
// //                 <Link href="#our-work">Explore Our Work</Link>
// //               </Button>
// //             </div>
// //           </div>
// //         </section>
        
// //         <section id="our-work" className="bg-brutalist-secondary-light dark:bg-brutalist-secondary-dark py-16 md:py-24">
// //           <div className="container px-4 md:px-6">
// //             <div className="text-center mb-12">
// //               <h2 className="text-3xl md:text-4xl font-bold">Our Work</h2>
// //               <p className="mx-auto mt-2 max-w-xl text-neutral-600 dark:text-neutral-400">
// //                 A selection of our most innovative projects and competition entries.
// //               </p>
// //             </div>
// //             <div className="grid gap-px md:grid-cols-3 bg-brutalist-border-light dark:bg-brutalist-border-dark border-y border-brutalist-border-light dark:border-brutalist-border-dark">
// //               {projects.map((project) => (
// //                   <div key={project.name} className="bg-brutalist-secondary-light dark:bg-brutalist-secondary-dark group border-x border-brutalist-border-light dark:border-brutalist-border-dark shadow-md hover:shadow-lg transition-shadow">
// //                       <div className="relative overflow-hidden aspect-video">
// //                            <Image
// //                               src={project.image}
// //                               alt={project.name}
// //                               data-ai-hint={project.hint}
// //                               fill
// //                               className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-none"
// //                           />
// //                       </div>
// //                       <div className="p-6">
// //                           <h3 className="text-xl font-medium">{project.name}</h3>
// //                       </div>
// //                   </div>
// //               ))}
// //             </div>
// //           </div>
// //         </section>

// //         <section id="why-join" className="bg-white dark:bg-black py-16 md:py-24">
// //             <div className="container px-4 md:px-6">
// //                 <div className="text-center mb-12">
// //                     <h2 className="text-3xl md:text-4xl font-bold">What You'll Gain</h2>
// //                      <p className="mx-auto mt-2 max-w-xl text-neutral-600 dark:text-neutral-400">
// //                        Joining the RC Club is more than a hobby—it's a launchpad for your career.
// //                     </p>
// //                 </div>
// //                  <div className="grid gap-px md:grid-cols-3 bg-brutalist-border-light dark:bg-brutalist-border-dark border border-brutalist-border-light dark:border-brutalist-border-dark">
// //                     {benefits.map((benefit) => (
// //                         <div key={benefit.title} className="bg-white dark:bg-black p-6 border-brutalist-border-light dark:border-brutalist-border-dark shadow-md hover:shadow-lg transition-shadow">
// //                             <div className="flex items-center gap-4 mb-4">
// //                                 <div className="bg-brutalist-secondary-light dark:bg-brutalist-secondary-dark p-3 border border-brutalist-border-light dark:border-brutalist-border-dark">
// //                                     <benefit.icon className="size-6 text-black dark:text-white" />
// //                                 </div>
// //                                 <h3 className="text-xl font-medium">{benefit.title}</h3>
// //                             </div>
// //                             <p className="text-neutral-600 dark:text-neutral-400">
// //                                 {benefit.description}
// //                             </p>
// //                         </div>
// //                     ))}
// //                 </div>
// //             </div>
// //         </section>

// //         <section className="py-16 md:py-24 bg-brutalist-secondary-light dark:bg-brutalist-secondary-dark border-y border-brutalist-border-light dark:border-brutalist-border-dark">
// //           <div className="container px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center">
// //             <div className="space-y-4">
// //               <h2 className="text-3xl md:text-4xl font-bold">About Us</h2>
// //               <p className="text-neutral-600 dark:text-neutral-400">
// //                 Founded in 2008, the BITS Pilani RC Club is a community of passionate enthusiasts dedicated to
// //                 aerospace engineering. We provide the tools, space, and support for members to bring their most ambitious
// //                 projects to life, consistently achieving top ranks in national and international competitions.
// //               </p>
// //               <Button asChild size="lg" variant="default" className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-none">
// //                 <Link href="/register">Become a Member</Link>
// //               </Button>
// //             </div>
// //             <div>
// //               <Image
// //                 src="https://placehold.co/600x400.png"
// //                 data-ai-hint="rc plane workshop"
// //                 alt="RC Club Workshop"
// //                 width={600}
// //                 height={400}
// //                 className="w-full border border-brutalist-border-light dark:border-brutalist-border-dark shadow-lg"
// //               />
// //             </div>
// //           </div>
// //         </section>
// //       </main>

// //       <footer className="container px-4 md:px-6 py-6 text-center text-neutral-500 dark:text-neutral-400 text-sm border-t border-brutalist-border-light dark:border-brutalist-border-dark">
// //           <p>&copy; {new Date().getFullYear()} RC-Club. All Rights Reserved.</p>
// //       </footer>
// //     </div>
// //   );
// // }


// 'use client';

// import Link from 'next/link';
// import Image from 'next/image';
// import { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Plane, Users, Wrench, Rocket, Sun, Moon, Menu, X } from 'lucide-react';

// const projects = [
//   {
//     name: 'Autonomous Fixed-Wing UAV',
//     description: 'Complete autonomous navigation system with GPS waypoint following, obstacle avoidance, and emergency landing protocols.',
//     year: '2024 Project',
//     tags: ['Autonomous', 'Fixed-Wing'],
//     color: 'from-red-500/20 to-red-600/20',
//     iconBg: 'bg-red-500'
//   },
//   {
//     name: 'VTOL Prototype',
//     description: 'Vertical takeoff and landing aircraft combining the efficiency of fixed-wing flight with helicopter-like versatility.',
//     year: 'Ongoing',
//     tags: ['VTOL', 'Hybrid'],
//     color: 'from-red-400/20 to-red-500/20',
//     iconBg: 'bg-red-400'
//   },
//   {
//     name: 'SAE Aero Design 2023',
//     description: 'Championship-winning cargo aircraft designed for maximum payload efficiency and precision landing capabilities.',
//     year: 'Champion',
//     tags: ['Winner', 'Competition'],
//     color: 'from-gray-600/20 to-red-500/20',
//     iconBg: 'bg-gray-700'
//   }
// ];

// const benefits = [
//   {
//     icon: Rocket,
//     title: "Hands-On Experience",
//     description: "Work with cutting-edge technology, from CAD design to flight testing. Build, program, and fly your own aircraft."
//   },
//   {
//     icon: Users,
//     title: "Expert Mentorship", 
//     description: "Learn from experienced seniors and faculty with industry connections at ISRO, HAL, and leading aerospace companies."
//   },
//   {
//     icon: Wrench,
//     title: "Competition Success",
//     description: "Compete in prestigious events like SAE Aero Design, Boeing SUAS, and international drone competitions."
//   }
// ];

// const stats = [
//   { value: '15+', label: 'Years Active' },
//   { value: '200+', label: 'Aircraft Built' },
//   { value: '50+', label: 'Competitions Won' },
//   { value: '500+', label: 'Alumni' }
// ];

// const teamMembers = [
//   { role: 'Club President', short: 'CP', description: 'Leading innovation & strategy', color: 'bg-red-500' },
//   { role: 'Technical Lead', short: 'TL', description: 'Engineering excellence', color: 'bg-red-400' },
//   { role: 'Design Head', short: 'DH', description: 'Aerodynamics & aesthetics', color: 'bg-gray-700' },
//   { role: 'Safety Head', short: 'SH', description: 'Operations & protocols', color: 'bg-red-500' }
// ];

// export default function HomePage() {
//   const [isDark, setIsDark] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   useEffect(() => {
//     // Check for saved theme preference or default to light mode
//     const savedTheme = localStorage.getItem('theme');
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
//       localStorage.setItem('theme', 'light');
//     } else {
//       document.documentElement.classList.add('dark');
//       localStorage.setItem('theme', 'dark');
//     }
//   };

//   const scrollToSection = (sectionId: string) => {
//     const element = document.getElementById(sectionId);
//     if (element) {
//       element.scrollIntoView({ behavior: 'smooth' });
//     }
//     setIsMobileMenuOpen(false);
//   };

//   return (
//     <div className="flex flex-col min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
//       {/* Navigation */}
//       <nav className="fixed top-0 w-full z-50 glass-effect">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center py-4">
//             <div className="flex items-center space-x-2">
//               <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
//                 <Plane className="w-6 h-6 text-white" />
//               </div>
//               <span className="text-xl font-bold">RC Club BITS</span>
//             </div>
            
//             {/* Desktop Navigation */}
//             <div className="hidden md:flex items-center space-x-8">
//               <button onClick={() => scrollToSection('about')} className="hover:text-red-500 transition-colors">About</button>
//               <button onClick={() => scrollToSection('projects')} className="hover:text-red-500 transition-colors">Projects</button>
//               <button onClick={() => scrollToSection('team')} className="hover:text-red-500 transition-colors">Team</button>
//               <button onClick={() => scrollToSection('join')} className="hover:text-red-500 transition-colors">Join Us</button>
//               <button 
//                 onClick={toggleTheme}
//                 className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//               >
//                 {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
//               </button>
//             </div>

//             {/* Mobile Navigation Toggle */}
//             <div className="md:hidden flex items-center space-x-2">
//               <button 
//                 onClick={toggleTheme}
//                 className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//               >
//                 {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
//               </button>
//               <button
//                 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//                 className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//               >
//                 {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//               </button>
//             </div>
//           </div>

//           {/* Mobile Navigation Menu */}
//           {isMobileMenuOpen && (
//             <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
//               <div className="flex flex-col space-y-4">
//                 <button onClick={() => scrollToSection('about')} className="text-left hover:text-red-500 transition-colors">About</button>
//                 <button onClick={() => scrollToSection('projects')} className="text-left hover:text-red-500 transition-colors">Projects</button>
//                 <button onClick={() => scrollToSection('team')} className="text-left hover:text-red-500 transition-colors">Team</button>
//                 <button onClick={() => scrollToSection('join')} className="text-left hover:text-red-500 transition-colors">Join Us</button>
//               </div>
//             </div>
//           )}
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
//         {/* Animated Background Elements */}
//         <div className="absolute inset-0 overflow-hidden">
//           <div className="absolute top-20 left-10 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
//           <div className="absolute top-40 right-20 w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
//           <div className="absolute bottom-32 left-20 w-3 h-3 bg-red-400 rounded-full animate-pulse delay-500"></div>
//           <div className="absolute top-60 left-1/3 w-1 h-1 bg-red-500 rounded-full animate-pulse delay-700"></div>
          
//           {/* Flying plane animation */}
//           <div className="absolute top-1/4 animate-fly-path opacity-30">
//             <Plane className="w-8 h-8 text-white transform rotate-12" />
//           </div>
//         </div>

//         <div className="relative z-10 text-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="animate-slide-up">
//             <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 text-shadow leading-tight">
//               RC CLUB
//               <span className="block text-red-500 animate-pulse-glow">BITS PILANI</span>
//             </h1>
//             <p className="text-xl sm:text-2xl md:text-3xl mb-8 text-gray-300 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed">
//               Where <span className="text-red-500 font-bold">innovation</span> meets the sky. 
//               Building autonomous UAVs, RC aircraft, and cutting-edge drones that push the boundaries of flight.
//             </p>
//           </div>
          
//           <div className="animate-fade-in delay-500 space-y-4 sm:space-y-0 sm:space-x-6 sm:flex sm:justify-center">
//             <Button 
//               onClick={() => scrollToSection('join')}
//               className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
//             >
//               🚀 Launch Your Journey
//             </Button>
//             <Button 
//               onClick={() => scrollToSection('projects')}
//               variant="outline"
//               className="w-full sm:w-auto glass-effect hover:bg-white hover:bg-opacity-20 text-white border-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105"
//             >
//               ✈️ View Our Fleet
//             </Button>
//           </div>

//           {/* Stats */}
//           <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in delay-1000">
//             {stats.map((stat, index) => (
//               <div key={index} className="text-center">
//                 <div className="text-3xl md:text-4xl font-bold text-red-500">{stat.value}</div>
//                 <div className="text-sm md:text-base text-gray-400">{stat.label}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* About Section */}
//       <section id="about" className="py-20 bg-white dark:bg-black">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid lg:grid-cols-2 gap-16 items-center">
//             <div>
//               <h2 className="text-4xl md:text-5xl font-black mb-8">
//                 Engineering the 
//                 <span className="text-red-500">Future of Flight</span>
//               </h2>
//               <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
//                 Since 2008, RC Club BITS Pilani has been at the forefront of aerospace innovation. We're not just building model aircraft—we're crafting the future of autonomous flight systems, VTOL technology, and unmanned aerial vehicles.
//               </p>
//               <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
//                 Our members have gone on to work at leading aerospace companies like Boeing, Airbus, SpaceX, and DRDO, carrying forward the passion and expertise they developed here.
//               </p>
//               <div className="grid grid-cols-2 gap-6">
//                 <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
//                   <div className="text-2xl font-bold text-red-500">UAVs</div>
//                   <div className="text-sm text-gray-600 dark:text-gray-400">Autonomous Systems</div>
//                 </div>
//                 <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
//                   <div className="text-2xl font-bold text-red-500">VTOL</div>
//                   <div className="text-sm text-gray-600 dark:text-gray-400">Vertical Takeoff</div>
//                 </div>
//                 <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
//                   <div className="text-2xl font-bold text-red-500">Drones</div>
//                   <div className="text-sm text-gray-600 dark:text-gray-400">Multi-rotor Systems</div>
//                 </div>
//                 <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
//                   <div className="text-2xl font-bold text-red-500">RC</div>
//                   <div className="text-sm text-gray-600 dark:text-gray-400">Remote Control</div>
//                 </div>
//               </div>
//             </div>
//             <div className="relative">
//               <div className="aspect-square bg-gradient-to-br from-red-500/20 to-red-400/20 rounded-2xl p-8 relative overflow-hidden">
//                 <div className="absolute inset-0 bg-black/10 dark:bg-white/5 rounded-2xl"></div>
//                 <div className="relative z-10 h-full flex items-center justify-center">
//                   <div className="text-center">
//                     <div className="w-32 h-32 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center animate-float">
//                       <Plane className="w-16 h-16 text-white" />
//                     </div>
//                     <h3 className="text-2xl font-bold mb-4">Innovation in Motion</h3>
//                     <p className="text-gray-600 dark:text-gray-400">Pushing the boundaries of what's possible in aerospace engineering</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Projects Section */}
//       <section id="projects" className="py-20 bg-gray-50 dark:bg-gray-900">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl md:text-5xl font-black mb-6">
//               Our <span className="text-red-500">Arsenal</span>
//             </h2>
//             <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
//               From competition-winning aircraft to cutting-edge autonomous systems, explore our most innovative projects.
//             </p>
//           </div>

//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {projects.map((project, index) => (
//               <div key={index} className="group relative bg-white dark:bg-black rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
//                 <div className={`aspect-video bg-gradient-to-br ${project.color} relative overflow-hidden`}>
//                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300"></div>
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <div className={`w-20 h-20 ${project.iconBg} rounded-full flex items-center justify-center animate-float`}>
//                       <Plane className="w-10 h-10 text-white" />
//                     </div>
//                   </div>
//                 </div>
//                 <div className="p-6">
//                   <h3 className="text-xl font-bold mb-3">{project.name}</h3>
//                   <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
//                     {project.description}
//                   </p>
//                   <div className="flex items-center justify-between">
//                     <span className="text-red-500 font-semibold">{project.year}</span>
//                     <div className="flex space-x-2">
//                       {project.tags.map((tag, tagIndex) => (
//                         <span 
//                           key={tagIndex}
//                           className={`px-2 py-1 rounded-full text-xs ${
//                             tag === 'Winner' 
//                               ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
//                               : tag === 'Autonomous' || tag === 'VTOL'
//                               ? 'bg-red-500/10 text-red-500'
//                               : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
//                           }`}
//                         >
//                           {tag}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Why Join Section */}
//       <section id="join" className="py-20 bg-white dark:bg-black">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl md:text-5xl font-black mb-6">
//               Why <span className="text-red-500">Fly With Us?</span>
//             </h2>
//             <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
//               Join a legacy of innovation and become part of India's premier aerospace student organization.
//             </p>
//           </div>

//           <div className="grid md:grid-cols-3 gap-8">
//             {benefits.map((benefit, index) => (
//               <div key={index} className="text-center group">
//                 <div className={`w-20 h-20 mx-auto mb-6 ${
//                   index === 0 ? 'bg-red-500' : index === 1 ? 'bg-red-400' : 'bg-gray-700'
//                 } rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}>
//                   <benefit.icon className="w-10 h-10 text-white" />
//                 </div>
//                 <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
//                 <p className="text-gray-600 dark:text-gray-400">
//                   {benefit.description}
//                 </p>
//               </div>
//             ))}
//           </div>

//           <div className="text-center mt-16">
//             <Button className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl animate-pulse-glow">
//               🚀 Join Our Squadron
//             </Button>
//             <p className="mt-4 text-gray-600 dark:text-gray-400">
//               Applications open for Spring 2025 • No experience required
//             </p>
//           </div>
//         </div>
//       </section>

//       {/* Team Section */}
//       <section id="team" className="py-20 bg-gray-50 dark:bg-gray-900">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl md:text-5xl font-black mb-6">
//               Meet Our <span className="text-red-500">Pilots</span>
//             </h2>
//             <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
//               The brilliant minds behind our aerial innovations.
//             </p>
//           </div>

//           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
//             {teamMembers.map((member, index) => (
//               <div key={index} className="text-center group">
//                 <div className={`w-32 h-32 mx-auto mb-4 ${member.color} rounded-full flex items-center justify-center transform group-hover:scale-110 transition-all duration-300`}>
//                   <span className="text-white font-bold text-2xl">{member.short}</span>
//                 </div>
//                 <h3 className="font-bold text-lg mb-2">{member.role}</h3>
//                 <p className="text-gray-600 dark:text-gray-400 text-sm">{member.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Contact/CTA Section */}
//       <section className="py-20 bg-black text-white relative overflow-hidden">
//         <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-400/20"></div>
//         <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//           <h2 className="text-4xl md:text-6xl font-black mb-8 text-shadow">
//             Ready to <span className="text-red-500">Take Off?</span>
//           </h2>
//           <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-gray-300">
//             Join the next generation of aerospace engineers. Your journey to the skies starts here.
//           </p>
          
//           <div className="grid md:grid-cols-3 gap-8 mb-12">
//             <div className="glass-effect p-6 rounded-lg">
//               <h3 className="text-xl font-bold mb-3">📍 Visit Us</h3>
//               <p className="text-gray-300">Workshop, BITS Pilani Campus</p>
//             </div>
//             <div className="glass-effect p-6 rounded-lg">
//               <h3 className="text-xl font-bold mb-3">📱 Follow Us</h3>
//               <div className="flex justify-center space-x-4">
//                 <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
//                   <span className="text-xs font-bold">IG</span>
//                 </div>
//                 <div className="w-8 h-8 bg-red-400 rounded-full flex items-center justify-center">
//                   <span className="text-xs font-bold">LI</span>
//                 </div>
//                 <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
//                   <span className="text-xs font-bold">YT</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <Button className="bg-white text-black hover:bg-gray-100 font-bold py-4 px-12 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
//             🛫 Apply Now for Spring 2025
//           </Button>
//         </div>
        
//         {/* Floating elements */}
//         <div className="absolute top-20 left-10 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
//         <div className="absolute bottom-20 right-10 w-3 h-3 bg-red-400 rounded-full animate-pulse delay-1000"></div>
//         <div className="absolute top-1/2 left-20 w-2 h-2 bg-white rounded-full animate-pulse delay-500"></div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-black text-gray-400 py-12">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid md:grid-cols-4 gap-8">
//             <div className="col-span-2">
//               <div className="flex items-center space-x-2 mb-4">
//                 <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
//                   <Plane className="w-5 h-5 text-white" />
//                 </div>
//                 <span className="text-white text-lg font-bold">RC Club BITS Pilani</span>
//               </div>
//               <p className="text-sm leading-relaxed max-w-md">
//                 Pioneering aerospace innovation since 2008. Building the future of autonomous flight, one aircraft at a time.
//               </p>
//             </div>
//             <div>
//               <h4 className="text-white font-semibold mb-3">Quick Links</h4>
//               <ul className="space-y-2 text-sm">
//                 <li><button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">About Us</button></li>
//                 <li><button onClick={() => scrollToSection('projects')} className="hover:text-white transition-colors">Projects</button></li>
//                 <li><button onClick={() => scrollToSection('team')} className="hover:text-white transition-colors">Team</button></li>
//                 <li><button onClick={() => scrollToSection('join')} className="hover:text-white transition-colors">Join Us</button></li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="text-white font-semibold mb-3">Contact</h4>
//               <ul className="space-y-2 text-sm">
//                 <li>BITS Pilani, Rajasthan</li>
//                 <li>rcclub@pilani.bits-pilani.ac.in</li>
//                 <li>Workshop Timings: 6-9 PM</li>
//               </ul>
//             </div>
//           </div>
//           <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
//             <p>&copy; 2024 RC Club BITS Pilani. All rights reserved. | Crafted with ❤️ for aviation enthusiasts</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };


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
            <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-sm mb-8 animate-fade-in">
              <span className="mr-2">🚀</span>
              Now accepting applications for Spring 2025
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-in-from-bottom">
              RC Club{' '}
              <span className="text-gradient-red">BITS Pilani</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-in-from-bottom delay-100">
              Engineering the future of autonomous flight. Building UAVs, drones, and aircraft that push the boundaries of aerospace technology.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-from-bottom delay-200">
              <Button 
                className="btn-primary px-8 py-3 rounded-lg font-medium"
                onClick={() => scrollToSection('#join')}
              >
                Join Our Team
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
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
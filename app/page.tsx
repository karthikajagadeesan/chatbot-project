'use client';

import Link from 'next/link';

// Constants for maintainable values
const STATS = {
  activeUsers: '12.4k',
  uptime: '99.8%',
  support: '24/7'
} as const;

const NAV_LINKS = [
  { href: '#solutions', label: 'Solutions' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#resources', label: 'Resources' }
] as const;

const FEATURES = [
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: 'Sub-second response times with our optimized AI infrastructure'
  },
  {
    icon: '🔒',
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with end-to-end encryption for your data'
  },
  {
    icon: '🎯',
    title: 'Smart Integration',
    description: 'Seamlessly connect with your existing tools and workflows'
  }
] as const;

const CURRENT_YEAR = new Date().getFullYear();

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-300/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-xl">
              🤖
            </div>
            <span className="text-xl font-bold">Chatbot</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className="text-gray-300 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Link 
            href="/dashboard"
            className="btn-primary"
          >
            Try for Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  Next-Gen AI for
                  <br />
                  <span className="text-primary">Enterprise B2B</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-xl">
                  Deploy high-performance AI agents that understand your business logic and customer needs with 99% accuracy.
                </p>
              </div>

              <div className="flex ml-36">
                <Link href="/auth/signup" className="btn-primary text-lg px-8 py-3">
                  Get Started
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-2xl font-bold">{STATS.activeUsers}</p>
                  <p className="text-sm text-gray-400">Active Users</p>
                </div>
                <div className="h-12 w-px bg-gray-700"></div>
                <div>
                  <p className="text-2xl font-bold">{STATS.uptime}</p>
                  <p className="text-sm text-gray-400">Uptime</p>
                </div>
                <div className="h-12 w-px bg-gray-700"></div>
                <div>
                  <p className="text-2xl font-bold">{STATS.support}</p>
                  <p className="text-sm text-gray-400">Support</p>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-3xl p-8 backdrop-blur-sm border border-gray-800">
                <div className="bg-dark-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      💬
                    </div>
                    <div>
                      <p className="font-medium">AI Assistant</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-dark-100 rounded-lg p-4">
                      <p className="text-sm text-gray-300">How can I help you today?</p>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 ml-8">
                      <p className="text-sm">Show me your products</p>
                    </div>
                    <div className="bg-dark-100 rounded-lg p-4">
                      <p className="text-sm text-gray-300">Loading products...</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Chat Icon */}
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 transition-transform">
                <span className="text-2xl">💬</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-dark-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Engineered for Scalability</h2>
            <p className="text-gray-400 text-lg">
              Our platform handles millions of conversations maintaining 99% reliability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>© {CURRENT_YEAR} Chatbot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
'use client';

import Link from 'next/link';
import {
  Bot,
  Zap,
  ShieldCheck,
  BarChart3,
  Globe,
  Cpu,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Layers,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: <Globe className="w-6 h-6 text-blue-500" />,
    title: 'Smart Web Scraping',
    description: 'Provide any URL and our engine will automatically discover and ingest your website content.'
  },
  {
    icon: <Cpu className="w-6 h-6 text-emerald-500" />,
    title: 'Multi-LLM Support',
    description: 'Switch between OpenAI, Gemini, Anthropic, or Groq for the perfect balance of cost and speed.'
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-purple-500" />,
    title: 'Secure Embedding',
    description: 'Domain-locked scripts ensure your AI assistant only runs on your authorised websites.'
  },
  {
    icon: <Layers className="w-6 h-6 text-orange-500" />,
    title: 'Instant Training',
    description: 'Vectorise thousands of pages in seconds. Your bot stays updated as your content evolves.'
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-pink-500" />,
    title: 'Deep Analytics',
    description: 'Track conversation quality, user engagement, and common queries in real-time.'
  },
  {
    icon: <Sparkles className="w-6 h-6 text-yellow-500" />,
    title: 'Fully Customisable',
    description: 'Tailor the bot’s personality, appearance, and base prompt to match your brand identity.'
  }
] as const;

const CURRENT_YEAR = new Date().getFullYear();

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer text-foreground animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">Chatbot<span className="text-primary">AI</span></span>
          </div>

          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-700">
            <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors pr-2">
              Sign In
            </Link>
            <Button asChild size="sm" className="rounded-full px-5 shadow-lg shadow-primary/20">
              <Link href="/chatbots">
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-24 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center space-y-10">
          <div className="space-y-4 animate-in fade-in zoom-in duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Introducing Next-Gen RAG
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
              Instant AI Assistants for Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-500 to-purple-600">Company Data</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Deploy high-performance AI agents that understand your documentation, website, and business logic with pinpoint accuracy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg shadow-xl shadow-primary/20 group">
              <Link href="/chatbots" className="flex items-center">
                Create Your Chatbot <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg hover:bg-muted/50 border-white/10">
              <Link href="#features">View Features</Link>
            </Button>
          </div>

          {/* Device Mockup / Preview */}
          <div className="pt-16 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1400 delay-500">
            <div className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
              <div className="flex items-center gap-1.5 mb-4 px-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              </div>
              <div className="aspect-[16/9] md:aspect-[21/9] bg-background/50 rounded-lg border border-border/20 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center gap-20 opacity-20 group-hover:opacity-40 transition-opacity duration-1000 grayscale group-hover:grayscale-0">
                  <Code className="w-32 h-32 text-primary" />
                  <Globe className="w-40 h-40 text-blue-500" />
                  <MessageSquare className="w-32 h-32 text-orange-500" />
                </div>
                <div className="relative text-center space-y-4">
                  <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-primary/30">
                    <Bot className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold">Scanning... Ingesting... Training...</h3>
                  <div className="w-64 h-2 bg-muted rounded-full mx-auto overflow-hidden">
                    <div className="w-2/3 h-full bg-primary animate-ping opacity-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything you need to scale support</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built on a foundation of modern RAG (Retrieval-Augmented Generation) technology and industrial-grade web scrapers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => (
              <div key={feature.title}
                className={`p-8 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-[${idx * 100}ms]`}>
                <div className="w-12 h-12 bg-muted/80 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed italic text-sm">
                  "{feature.description}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center p-12 md:p-20 rounded-[40px] bg-primary text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/40 leading-tight">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to transform your<br />customer experience?</h2>
          <p className="text-primary-foreground/80 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Join hundreds of businesses using ChatbotAI to automate their support and sales workflows in minutes.
          </p>
          <Button asChild size="lg" variant="secondary" className="h-16 px-10 rounded-full text-lg font-bold shadow-xl hover:scale-105 active:scale-95 transition-all group">
            <Link href="/chatbots" className="flex items-center">
              Create Your First Chatbot <Zap className="ml-2 w-5 h-5 fill-current" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border/40 bg-card">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2.5 opacity-60">
            <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center border border-border/20">
              <Bot className="w-4 h-4 text-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">ChatbotAI</span>
          </div>

          <div className="text-sm text-muted-foreground">
            © {CURRENT_YEAR} ChatbotAI. Crafted for performance.
          </div>

          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
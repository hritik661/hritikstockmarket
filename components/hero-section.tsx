"use client"

import { ArrowRight, TrendingUp, Zap, BarChart3, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

export function HeroSection() {
  const { user } = useAuth()
  
  return (
    <div className="relative overflow-hidden bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      
      <div className="relative z-10 container mx-auto px-4 md:px-6 py-20 md:py-28 lg:py-36">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Indian Stock Market Platform</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight text-balance">
            Trade Indian Stocks with
            <span className="block text-primary mt-2">Confidence & Clarity</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed text-pretty">
            Real-time market data, AI-powered predictions, and professional charts. 
            Practice trading with Rs 10 lakh virtual balance - zero risk.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {!user ? (
              <>
                <Button asChild size="lg" className="h-14 px-8 text-base font-semibold rounded-xl">
                  <Link href="/login" className="flex items-center gap-2">
                    Start Trading Free
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base font-medium rounded-xl bg-transparent border-border hover:bg-secondary/50">
                  <Link href="#features">See Features</Link>
                </Button>
              </>
            ) : (
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base font-medium rounded-xl bg-transparent border-border hover:bg-secondary/50">
                <Link href="#features">Explore Features</Link>
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mb-16">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-foreground">50+</p>
              <p className="text-sm text-muted-foreground">Stocks Tracked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">85%</p>
              <p className="text-sm text-muted-foreground">AI Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-foreground">10K+</p>
              <p className="text-sm text-muted-foreground">Active Traders</p>
            </div>
          </div>

          {/* Feature highlights */}
          <div id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, title: "Live Market Data", desc: "Real-time quotes and indices" },
              { icon: BarChart3, title: "Pro Charts", desc: "Candlestick & technical analysis" },
              { icon: Zap, title: "AI Predictions", desc: "ML-powered stock forecasts" },
              { icon: Shield, title: "Secure Trading", desc: "Bank-grade security" },
            ].map((feature, index) => (
              <div 
                key={index} 
                className="p-5 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import LoginForm from "@/components/login-form"
import { TrendingUp, Shield, Zap, BarChart3 } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 md:p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0">
          {/* Left Side - Branding & Features */}
          <div className="hidden lg:flex flex-col justify-center p-10 xl:p-14 bg-gradient-to-br from-primary/10 via-card to-card/80 rounded-l-2xl border border-border/50 border-r-0">
            <div className="space-y-8">
              {/* Logo & Title */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-primary" />
                  </div>
                  <span className="text-2xl font-bold text-gradient">Hritik Stocks</span>
                </div>
                <h1 className="text-4xl xl:text-5xl font-bold leading-tight text-balance">
                  Trade Smarter with
                  <span className="block text-primary">Real-Time Data</span>
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                  Access live market data, advanced charts, AI predictions, and manage your portfolio with our professional trading platform.
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: BarChart3, label: "Live Charts", desc: "Real-time candlestick" },
                  { icon: Zap, label: "AI Predictions", desc: "ML-powered insights" },
                  { icon: Shield, label: "Secure", desc: "Bank-grade security" },
                  { icon: TrendingUp, label: "Options", desc: "Trade NIFTY & more" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{feature.label}</p>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-4 border-t border-border/30">
                <div>
                  <p className="text-2xl font-bold text-primary">10K+</p>
                  <p className="text-xs text-muted-foreground">Active Traders</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">50+</p>
                  <p className="text-xs text-muted-foreground">Stocks Tracked</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">24/7</p>
                  <p className="text-xs text-muted-foreground">Market Updates</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex flex-col justify-center p-6 md:p-10 xl:p-14 bg-card/50 backdrop-blur-xl rounded-2xl lg:rounded-l-none lg:rounded-r-2xl border border-border/50 lg:border-l-0 shadow-2xl">
            {/* Mobile Header */}
            <div className="lg:hidden mb-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl font-bold text-gradient">Hritik Stocks</span>
              </div>
              <h1 className="text-2xl font-bold">Welcome Back</h1>
              <p className="text-muted-foreground text-sm mt-1">Sign in to access your dashboard</p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-3xl font-bold mb-2">Sign In</h2>
              <p className="text-muted-foreground">Enter your email to receive a secure OTP</p>
            </div>

            <LoginForm full />

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border/30">
              <p className="text-xs text-center text-muted-foreground">
                By signing in, you agree to our Terms of Service and Privacy Policy.
                <br />
                New users receive 10,00,000 virtual trading balance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

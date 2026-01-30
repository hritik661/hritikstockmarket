"use client"

import LoginForm from "@/components/login-form"
import { TrendingUp, Shield, Zap } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">Hritik Stocks</span>
          </Link>
          
          <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6 text-balance">
            Trade smarter with
            <span className="block text-primary">real-time insights</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-10 max-w-md leading-relaxed">
            Access live market data, AI-powered predictions, and professional trading tools trusted by thousands of Indian traders.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Real-time Market Data</p>
                <p className="text-sm text-muted-foreground">Live quotes for NIFTY 50 stocks and indices</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">AI Predictions</p>
                <p className="text-sm text-muted-foreground">ML-powered stock predictions with 85%+ accuracy</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Secure Trading</p>
                <p className="text-sm text-muted-foreground">Bank-grade security with encrypted transactions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">Hritik Stocks</span>
          </div>
          
          <LoginForm full />
          
          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

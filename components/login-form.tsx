"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"

export function LoginForm({ compact, full, compactOnly }: { compact?: boolean; full?: boolean; compactOnly?: boolean }) {
  const router = useRouter()
  const { loginWithOTP } = useAuth()
  const [otpEmail, setOtpEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [otpStep, setOtpStep] = useState<"email" | "verify">("email")
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [otpSuccess, setOtpSuccess] = useState("")
  const [visible, setVisible] = useState(true)

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setOtpError("")
    setOtpSuccess("")
    setOtpLoading(true)

    if (!otpEmail || !otpEmail.includes("@")) {
      setOtpError("Please enter a valid email address")
      setOtpLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setOtpSuccess("OTP sent! Check your email (and spam folder)")
        setOtpStep("verify")
        setOtp("")
      } else {
        setOtpError(data.error || "Failed to send OTP")
      }
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Error sending OTP")
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setOtpError("")
    setOtpSuccess("")
    setOtpLoading(true)

    if (!otp || otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP")
      setOtpLoading(false)
      return
    }

    try {
      const result = await loginWithOTP(otpEmail, otp)

      if (result.success) {
        try {
          window.dispatchEvent(new CustomEvent("close-login"))
        } catch (e) {}
        // Always redirect to market dashboard after login
        router.push("/")
      } else {
        setOtpError(result.error || "Invalid OTP")
      }
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Error verifying OTP")
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResetOTP = () => {
    setOtpStep("email")
    setOtpEmail("")
    setOtp("")
    setOtpError("")
    setOtpSuccess("")
  }

  const cardWidth = compact ? "w-full max-w-md" : full ? "w-full max-w-2xl mx-auto" : "w-full max-w-lg"

  if (compactOnly) {
    return (
      <Card className={`${cardWidth}`}>
        <div className={`grid grid-cols-1 md:grid-cols-2 rounded-xl overflow-hidden shadow-2xl`}>
          <div className={`hidden md:flex flex-col items-center justify-center p-10 bg-gradient-to-br from-primary to-emerald-400 text-black gap-6`}>
            <Mail className="h-10 w-10 text-white" />
            <div className="text-center">
              <h3 className="text-3xl md:text-4xl font-extrabold">Gmail Login</h3>
              <p className="mt-3 text-sm opacity-95">Quick and secure</p>
            </div>
          </div>

          <Card className="m-0 rounded-none md:rounded-r-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Sign In</CardTitle>
              <CardDescription className="text-sm">Enter your email to receive an OTP</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {otpError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                  <AlertCircle className="h-4 w-4" />
                  {otpError}
                </div>
              )}
              {otpSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-100 p-2 rounded">
                  <Sparkles className="h-4 w-4" />
                  {otpSuccess}
                </div>
              )}

              {otpStep === "email" ? (
                <form onSubmit={handleSendOTP}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="otp-email" className="text-sm">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="otp-email"
                          type="email"
                          placeholder="your@gmail.com"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          className="pl-12 h-10"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-emerald-400 text-white font-semibold text-lg" disabled={otpLoading}>
                      {otpLoading ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send OTP
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="otp-code" className="text-sm">
                        Enter 6-Digit Code
                      </Label>
                      <div className="relative">
                        <Input
                          id="otp-code"
                          type="text"
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          maxLength={6}
                          className="text-center text-2xl tracking-widest font-mono h-12"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Code expires in 5 minutes</p>
                    </div>

                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-emerald-400 text-white font-semibold text-lg" disabled={otpLoading}>
                      {otpLoading ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify & Login
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleResetOTP}>
                      Change Email
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </Card>
    )
  }

  // Main full login form - clean modern design
  return (
    <div className={`${cardWidth}`}>
      <div className="space-y-6">
        <div className="space-y-2 text-center lg:text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Welcome back</h2>
          <p className="text-muted-foreground">Sign in with your email to continue trading</p>
        </div>

        {otpError && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{otpError}</p>
          </div>
        )}
        
        {otpSuccess && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm text-primary">{otpSuccess}</p>
          </div>
        )}

        {otpStep === "email" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-email" className="text-sm font-medium text-foreground">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="otp-email"
                  type="email"
                  placeholder="you@gmail.com"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  className="pl-11 h-12 text-base bg-secondary/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={otpLoading}
                  autoFocus
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base transition-all" 
              disabled={otpLoading}
            >
              {otpLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Sending code...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              We will send a verification code to your email
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-code" className="text-sm font-medium text-foreground">
                Verification code
              </Label>
              <Input
                id="otp-code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-[0.5em] font-mono h-14 bg-secondary/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={otpLoading}
                autoFocus
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Sent to {otpEmail}</span>
                <span>Expires in 5 min</span>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base transition-all" 
              disabled={otpLoading}
            >
              {otpLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Sign in
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>

            <Button 
              type="button" 
              variant="ghost" 
              className="w-full h-10 text-muted-foreground hover:text-foreground" 
              onClick={handleResetOTP} 
              disabled={otpLoading}
            >
              Use a different email
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            New to Hritik Stocks? Get Rs 10,00,000 virtual balance to start practicing
          </p>
        </div>
      </div>
    </div>
  )
}


export default LoginForm

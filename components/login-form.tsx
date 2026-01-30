"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, ArrowRight, Sparkles, AlertCircle, Loader, KeyRound, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"

export function LoginForm({ compact, full }: { compact?: boolean; full?: boolean }) {
  const router = useRouter()
  const { loginWithOTP } = useAuth()
  const [otpEmail, setOtpEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [otpStep, setOtpStep] = useState<"email" | "verify">("email")
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [otpSuccess, setOtpSuccess] = useState("")

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

  return (
    <div className="w-full space-y-6">
      {/* Status Messages */}
      {otpError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-scale-in">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{otpError}</p>
        </div>
      )}
      
      {otpSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 animate-scale-in">
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-primary">{otpSuccess}</p>
        </div>
      )}

      {otpStep === "email" ? (
        <form onSubmit={handleSendOTP} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="otp-email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                id="otp-email"
                type="email"
                placeholder="your@email.com"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                className="pl-12 h-12 md:h-14 text-base bg-secondary/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
                disabled={otpLoading}
                autoFocus
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 md:h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg shadow-primary/20"
            disabled={otpLoading}
          >
            {otpLoading ? (
              <>
                <Loader className="h-5 w-5 animate-spin mr-2" />
                Sending OTP...
              </>
            ) : (
              <>
                Send OTP Code
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            We'll send a 6-digit verification code to your email
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-5">
          {/* OTP Input */}
          <div className="space-y-2">
            <Label htmlFor="otp-code" className="text-sm font-medium flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Enter Verification Code
            </Label>
            <Input
              id="otp-code"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="text-center text-3xl md:text-4xl tracking-[0.5em] font-mono h-16 md:h-20 bg-secondary/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
              disabled={otpLoading}
              autoFocus
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Sent to: {otpEmail}</span>
              <span>Expires in 5 minutes</span>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 md:h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg shadow-primary/20"
            disabled={otpLoading}
          >
            {otpLoading ? (
              <>
                <Loader className="h-5 w-5 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Verify & Sign In
              </>
            )}
          </Button>

          <Button 
            type="button" 
            variant="ghost" 
            className="w-full h-11 rounded-xl hover:bg-secondary/50"
            onClick={handleResetOTP} 
            disabled={otpLoading}
          >
            Change Email Address
          </Button>
        </form>
      )}
    </div>
  )
}

export default LoginForm

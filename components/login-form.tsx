"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mail, ArrowRight, Sparkles, AlertCircle, Loader, KeyRound, CheckCircle2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"

export function LoginForm({ compact, full }: { compact?: boolean; full?: boolean }) {
  const router = useRouter()
  const { loginWithOTP } = useAuth()
  const [otpEmail, setOtpEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [otpStep, setOtpStep] = useState<"email" | "verify">("email")
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [otpSuccess, setOtpSuccess] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focus first OTP input when step changes
  useEffect(() => {
    if (otpStep === "verify" && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [otpStep])

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newOtp = [...otp]
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char
    })
    setOtp(newOtp)
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus()
    }
  }

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
        setOtpSuccess("OTP sent! Check your email inbox")
        setOtpStep("verify")
        setOtp(["", "", "", "", "", ""])
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

    const otpString = otp.join("")
    if (otpString.length !== 6) {
      setOtpError("Please enter all 6 digits")
      setOtpLoading(false)
      return
    }

    try {
      const result = await loginWithOTP(otpEmail, otpString)

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
    setOtp(["", "", "", "", "", ""])
    setOtpError("")
    setOtpSuccess("")
  }

  return (
    <div className="w-full space-y-6">
      {/* Status Messages */}
      {otpError && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#ff3333]/10 border border-[#ff3333]/20 animate-scale-in">
          <div className="h-10 w-10 rounded-xl bg-[#ff3333]/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-[#ff3333]" />
          </div>
          <p className="text-sm text-[#ff3333] font-medium">{otpError}</p>
        </div>
      )}
      
      {otpSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/20 animate-scale-in">
          <div className="h-10 w-10 rounded-xl bg-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-5 w-5 text-[#00ff88]" />
          </div>
          <p className="text-sm text-[#00ff88] font-medium">{otpSuccess}</p>
        </div>
      )}

      {otpStep === "email" ? (
        <form onSubmit={handleSendOTP} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="otp-email" className="text-sm font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Email Address
            </Label>
            <div className="relative group">
              <Input
                id="otp-email"
                type="email"
                placeholder="your@email.com"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                className="h-14 md:h-16 text-base md:text-lg bg-secondary/50 border-border/50 rounded-2xl pl-5 pr-5 transition-all duration-300 focus:bg-secondary/80"
                disabled={otpLoading}
                autoFocus
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 to-[#00ff88]/20 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10 blur-xl" />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 md:h-16 text-base md:text-lg font-bold rounded-2xl btn-primary-glow"
            disabled={otpLoading}
          >
            {otpLoading ? (
              <>
                <Loader className="h-5 w-5 animate-spin mr-3" />
                Sending OTP...
              </>
            ) : (
              <>
                Send Verification Code
                <ArrowRight className="h-5 w-5 ml-3" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            A 6-digit verification code will be sent to your email
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          {/* OTP Input Boxes */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Enter 6-Digit Code
            </Label>
            
            <div className="flex justify-center gap-2 md:gap-3" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl md:text-3xl font-bold font-mono bg-secondary/50 border border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-300 focus:bg-secondary/80 focus:scale-105"
                  disabled={otpLoading}
                />
              ))}
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {otpEmail}
              </span>
              <span className="flex items-center gap-1 text-primary">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Expires in 5 min
              </span>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 md:h-16 text-base md:text-lg font-bold rounded-2xl btn-buy"
            disabled={otpLoading}
          >
            {otpLoading ? (
              <>
                <Loader className="h-5 w-5 animate-spin mr-3" />
                Verifying...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-3" />
                Verify & Sign In
              </>
            )}
          </Button>

          <div className="flex items-center gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              className="flex-1 h-12 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleResetOTP} 
              disabled={otpLoading}
            >
              Change Email
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="flex-1 h-12 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleSendOTP} 
              disabled={otpLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend Code
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default LoginForm

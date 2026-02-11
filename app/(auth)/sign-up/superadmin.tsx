"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

export default function SignUpSuperAdmin() {
  // const router = useRouter()
  // const signUp = useAuthStore((state) => state.signUp)
  const [first_name, setFirst_name] = useState("")
  const [last_name, setLast_name] = useState("")
  const [phone_no, setPhone_no] = useState("")
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateEmailFormat = (value: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(value)
  }

  const handleEmailBlur = async () => {
    // Clear previous field-level error
    setEmailError("")

    if (!email) return

    // Basic format validation before hitting the server
    if (!validateEmailFormat(email)) {
      const message = "Please enter a valid email address"
      setEmailError(message)
      toast.error(message)
      return
    }

    setIsCheckingEmail(true)
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data?.status && data.exists) {
        const message = "This email is already registered"
        setEmailError(message)
        toast.error(message)
      }
    } catch (err) {
      // Optionally surface this, but don't block user entirely
      console.error("Failed to check email:", err)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    // Validate email format
    if (!validateEmailFormat(email)) {
      const message = "Please enter a valid email address"
      setError(message)
      toast.error(message)
      return
    }

    // If we already know this email is taken, prevent submit
    if (emailError) {
      setError(emailError)
      toast.error(emailError)
      return
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      toast.error("Passwords do not match")
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      toast.error("Password must be at least 6 characters long")
      return
    }

    setIsLoading(true)

    try {
      // const response = await signUp({ first_name, last_name, phone_no, email, password, confirmPassword })

      // if (response.status) {
      //   toast.success(response.message)
      //   router.push("/dashboard")
      // } else {
      //   setError(response.message)
      //   toast.error(response.message)
      // }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="first_name" required>First Name</FieldLabel>
            <Input
              id="first_name"
              type="text"
              placeholder="John"
              value={first_name}
              onChange={(e) => setFirst_name(e.target.value)}
              required
              disabled={isLoading}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
            <Input
              id="last_name"
              type="text"
              placeholder="Doe"
              value={last_name}
              onChange={(e) => setLast_name(e.target.value)}
              disabled={isLoading}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="email" required>Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError("")
              }}
              onBlur={handleEmailBlur}
              required
              disabled={isLoading || isCheckingEmail}
            />
            {emailError && (
              <FieldError>{emailError}</FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="phone_no" required>Phone No</FieldLabel>
            <Input
              id="phone_no"
              type="text"
              placeholder="1234567890"
              maxLength={10}
              minLength={10}
              value={phone_no}
              onChange={(e) => setPhone_no(e.target.value)}
              required
              disabled={isLoading}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="password" required>Password</FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm-password" required>Confirm Password</FieldLabel>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </Field>
        </div>
        {error && (
          <Field>
            <FieldError>{error}</FieldError>
          </Field>
        )}
        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <FieldDescription className="px-6 text-center">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="underline underline-offset-4"
            >
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}


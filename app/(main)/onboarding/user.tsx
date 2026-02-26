"use client"
import { useOnboardingStore } from "@/store/user/onboarding-store"
import { useAuthStore } from "@/store/user/authStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel, FieldGroup, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createProjectAction } from "@/app/actions/project-actions"
import { toast } from "sonner"

export default function UserOnboarding() {
    const router = useRouter()
    const { user } = useAuthStore()
    const store = useOnboardingStore()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleNext = () => {
        setError("")
        if (store.currentStep === 1) {
            if (!store.firstName || !store.lastName) {
                setError("Please fill in your name.")
                return
            }
        } else if (store.currentStep === 2) {
            if (!store.projectName || !store.targetUrl) {
                setError("Please provide a project name and target URL.")
                return
            }
            try {
                new URL(store.targetUrl)
            } catch {
                setError("Please enter a valid URL (e.g., https://example.com).")
                return
            }
        }
        store.nextStep()
    }

    const handleFinish = async () => {
        setError("")
        setIsLoading(true)
        try {
            const response = await createProjectAction({
                name: store.projectName,
                targetUrl: store.targetUrl
            });

            if (!response.success || !response.data) {
                setError(response.message || "Failed to create project");
                setIsLoading(false);
                return;
            }

            toast.success("Welcome aboard! Project created successfully.")
            router.push("/dashboard")
            store.reset()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Welcome to EmbedChat</CardTitle>
                    <CardDescription>
                        Step {store.currentStep} of 3
                    </CardDescription>
                    {/* Simple progress bar */}
                    <div className="w-full h-2 bg-secondary rounded-full mt-2 overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${(store.currentStep / 3) * 100}%` }}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <FieldGroup>
                        {store.currentStep === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium">Let's set up your profile</h3>
                                    <p className="text-sm text-muted-foreground">How should we address you?</p>
                                </div>
                                <Field>
                                    <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                                    <Input
                                        id="firstName"
                                        value={store.firstName}
                                        onChange={(e) => store.updateProfile({ firstName: e.target.value, lastName: store.lastName })}
                                        placeholder="Jane"
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                                    <Input
                                        id="lastName"
                                        value={store.lastName}
                                        onChange={(e) => store.updateProfile({ firstName: store.firstName, lastName: e.target.value })}
                                        placeholder="Doe"
                                    />
                                </Field>
                            </div>
                        )}

                        {store.currentStep === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium">Create your first project</h3>
                                    <p className="text-sm text-muted-foreground">What website do you want the AI to learn from?</p>
                                </div>
                                <Field>
                                    <FieldLabel htmlFor="projectName">Project Name</FieldLabel>
                                    <Input
                                        id="projectName"
                                        value={store.projectName}
                                        onChange={(e) => store.updateProject({ projectName: e.target.value, targetUrl: store.targetUrl })}
                                        placeholder="My Support Bot"
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="targetUrl">Target Website URL</FieldLabel>
                                    <Input
                                        id="targetUrl"
                                        type="url"
                                        value={store.targetUrl}
                                        onChange={(e) => store.updateProject({ projectName: store.projectName, targetUrl: e.target.value })}
                                        placeholder="https://example.com"
                                    />
                                </Field>
                            </div>
                        )}

                        {store.currentStep === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium">Choose a plan</h3>
                                    <p className="text-sm text-muted-foreground">Select how you want to use EmbedChat.</p>
                                </div>

                                <div className="grid gap-4">
                                    {(['free', 'pro', 'enterprise'] as const).map((plan) => (
                                        <div
                                            key={plan}
                                            onClick={() => store.setPlan(plan)}
                                            className={`relative flex cursor-pointer rounded-lg border bg-card p-4 shadow-sm focus:outline-none ${store.selectedPlan === plan ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                                        >
                                            <div className="flex flex-1">
                                                <div className="flex flex-col">
                                                    <span className="block text-sm font-medium capitalize text-foreground">{plan}</span>
                                                    <span className="mt-1 flex items-center text-sm text-muted-foreground">
                                                        {plan === 'free' && '1 Project, 500 messages/mo'}
                                                        {plan === 'pro' && '5 Projects, 10k messages/mo'}
                                                        {plan === 'enterprise' && 'Unlimited projects & messages'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${store.selectedPlan === plan ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                                                {store.selectedPlan === plan && (
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && (
                            <Field>
                                <FieldError>{error}</FieldError>
                            </Field>
                        )}
                    </FieldGroup>
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6 mt-4">
                    <Button
                        variant="outline"
                        onClick={store.prevStep}
                        disabled={store.currentStep === 1 || isLoading}
                    >
                        Back
                    </Button>

                    {store.currentStep < 3 ? (
                        <Button onClick={handleNext}>Next Step</Button>
                    ) : (
                        <Button onClick={handleFinish} disabled={isLoading}>
                            {isLoading ? "Completing..." : "Complete Setup"}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}

"use client";

import { Check, LucideIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from './button';

interface Step {
    id: string;
    title: string;
    status: 'completed' | 'partial' | 'empty';
    icon?: LucideIcon;
}

interface ProgressBarProps {
    steps: Step[];
    currentStep: string;
    onStepClick: (stepId: string) => void;
}

export function ProgressBar({ steps, currentStep, onStepClick }: ProgressBarProps) {
    const getStepColor = (status: Step['status'], isActive: boolean) => {
        if (isActive) {
            return "bg-primary text-primary-foreground border-primary";
        }

        switch (status) {
            case 'completed':
                return "bg-green-500 text-white border-green-500";
            case 'partial':
                return "bg-yellow-500 text-white border-yellow-500";
            default:
                return "bg-gray-300 text-gray-600 border-gray-300";
        }
    };

    const getConnectorColor = (index: number) => {
        const currentStepIndex = steps.findIndex(step => step.id === currentStep);
        if (index < currentStepIndex) {
            return "bg-green-500";
        }
        return "bg-gray-300";
    };

    return (
        <div className="w-full pt-2">
            <div className="flex items-center justify-between px-6">
                {steps.map((step, index) => (
                    <div key={step.id} className={cn("flex items-center", index < steps.length - 1 && "flex-1")}>
                        <div className="flex flex-col items-center">
                            <Button
                                onClick={() => onStepClick(step.id)}
                                className={cn(
                                    "w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all duration-300 cursor-pointer hover:text-white hover:scale-110 hover:shadow-[0_0_6px_rgba(139,92,246,0.8),0_0_10px_rgba(139,92,246,0.6)] hover:border-violet-500 hover:bg-violet-600",
                                    getStepColor(step.status, step.id === currentStep)
                                )}
                                type='button'
                            >
                                {step.status === 'completed' ? (
                                    <Check className="w-5 h-5" />
                                ) : step.icon ? (
                                    <step.icon className="w-5 h-5" />
                                ) : (
                                    index + 1
                                )}
                            </Button>
                            <span className="mt-2 text-xs text-center max-w-26 leading-tight">
                                {step.title}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className="flex-1 mx-4">
                                <div
                                    className={cn(
                                        "h-1 rounded-full transition-colors",
                                        getConnectorColor(index)
                                    )}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
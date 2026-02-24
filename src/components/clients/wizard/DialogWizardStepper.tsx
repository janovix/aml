"use client";

import { cn } from "@/lib/utils";
import { Check, SkipForward } from "lucide-react";

export interface DialogWizardStep {
  id: number;
  title: string;
  skipped?: boolean;
}

interface DialogWizardStepperProps {
  steps: DialogWizardStep[];
  currentStep: number;
  className?: string;
}

export function DialogWizardStepper({
  steps,
  currentStep,
  className,
}: DialogWizardStepperProps) {
  return (
    <nav
      aria-label="Progreso del formulario"
      className={cn("w-full px-6 pt-4 pb-2", className)}
    >
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isLast = index === steps.length - 1;
          const isSkipped = step.skipped === true;

          return (
            <li
              key={step.id}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                {/* Step circle */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                    isSkipped &&
                      "border-muted-foreground/20 bg-muted/50 text-muted-foreground/50",
                    isCompleted &&
                      !isSkipped &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      !isSkipped &&
                      "border-primary bg-primary/10 text-primary ring-4 ring-primary/10",
                    !isCompleted &&
                      !isCurrent &&
                      !isSkipped &&
                      "border-muted-foreground/30 text-muted-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isSkipped ? (
                    <SkipForward className="h-3.5 w-3.5" />
                  ) : isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-semibold">{step.id}</span>
                  )}
                </div>

                {/* Step title */}
                <span
                  className={cn(
                    "text-[11px] font-medium text-center leading-tight max-w-[80px] truncate",
                    isSkipped && "text-muted-foreground/40 line-through",
                    isCompleted && !isSkipped && "text-foreground",
                    isCurrent && !isSkipped && "text-primary font-semibold",
                    !isCompleted &&
                      !isCurrent &&
                      !isSkipped &&
                      "text-muted-foreground",
                  )}
                >
                  {step.title}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 mt-[-1.25rem] rounded-full transition-colors duration-200",
                    isCompleted && !steps[index + 1]?.skipped
                      ? "bg-primary"
                      : isCompleted && steps[index + 1]?.skipped
                        ? "bg-primary/30"
                        : "bg-muted-foreground/20",
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

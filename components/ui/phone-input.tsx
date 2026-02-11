"use client";

import React from "react";
import { Phone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import FormatPhoneNumber, { CleanPhoneNumber } from "@/helpers/phone-no-formator";
interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
}


export default function PhoneInput({
  value,
  onChange,
  placeholder = "Enter your phone number",
  disabled = false,
  label = "Phone Number",
  required = false,
  error,
  className = "",
}: PhoneInputProps) {
  const formattedValue = FormatPhoneNumber(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Format the phone number as user types (4-3-3 pattern)
    const formatted = FormatPhoneNumber(inputValue);
    // Return unformatted value to parent component
    const unformatted = CleanPhoneNumber(formatted);
    onChange(unformatted);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="phone" required={required}>
        {/* <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> */}
        {label}
      </Label>
      <Input
        id="phone"
        type="tel"
        value={formattedValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={` ${error ? "border-destructive" : ""}`}
      />
      {error && <p className="text-xs sm:text-sm text-destructive">{error}</p>}
    </div>
  );
}


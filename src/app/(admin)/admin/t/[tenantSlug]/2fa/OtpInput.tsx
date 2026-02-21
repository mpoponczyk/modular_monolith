
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { Input } from "@/components/legacy/ui/input";
import { cn } from "@/lib/utils"; // Assuming utils exist, or I can use inline conditional classes if needed. relying on existing Input styles

interface OtpInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export default function OtpInput({ length = 6, value, onChange, disabled }: OtpInputProps) {
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!disabled && inputs.current[0]) {
            inputs.current[0].focus();
        }
    }, [disabled]);

    // Create an array of values from the single string value
    const values = useMemo(() => {
        const arr = new Array(length).fill('');
        for (let i = 0; i < length; i++) {
            arr[i] = value[i] || '';
        }
        return arr;
    }, [value, length]);

    const triggerChange = (newValues: string[]) => {
        onChange(newValues.join(''));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        const targetValue = e.target.value;

        // Allow only number
        if (!/^\d*$/.test(targetValue)) return;

        // Take the last character entered (standard for handling single char overrides)
        const char = targetValue.slice(-1);

        const newValues = [...values];
        newValues[idx] = char;
        triggerChange(newValues);

        // Move to next if char was entered
        if (char && idx < length - 1) {
            inputs.current[idx + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
        if (e.key === 'Backspace') {
            if (values[idx] === '') {
                // If empty and backspace, move previous and delete
                if (idx > 0) {
                    e.preventDefault();
                    const newValues = [...values];
                    newValues[idx - 1] = '';
                    triggerChange(newValues);
                    inputs.current[idx - 1]?.focus();
                }
            } else {
                // If has value, standard delete keeps focus here.
                // But user wants "delete all previous" feel if holding.
                // Standard behavior: deletes current -> becomes empty.
                // Next hold event -> sees empty -> moves prev.
                // This seems correct for "fluid deletion".
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (idx > 0) inputs.current[idx - 1]?.focus();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (idx < length - 1) inputs.current[idx + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, length);
        if (!/^\d*$/.test(pastedData)) return;

        const newValues = [...values];
        pastedData.split('').forEach((char, i) => {
            if (i < length) newValues[i] = char;
        });
        triggerChange(newValues);

        // Focus the input after the last pasted character
        const focusIdx = Math.min(pastedData.length, length - 1);
        inputs.current[focusIdx]?.focus();
    };

    return (
        <div className="flex gap-2 justify-center">
            {values.map((digit, idx) => (
                <Input
                    key={idx}
                    ref={(el) => { if (el) inputs.current[idx] = el; }} // No return value needed
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className="w-12 h-14 text-center text-2xl font-bold p-0 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all border-slate-200 !text-black text-opacity-100 dark:text-white"
                    autoComplete="one-time-code"
                />
            ))}
        </div>
    );
}

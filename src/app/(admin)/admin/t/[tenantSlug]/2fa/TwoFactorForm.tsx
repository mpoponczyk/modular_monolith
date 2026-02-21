// mateusz poponczyk
'use client';

import { useState, useEffect } from 'react';
import OtpInput from './OtpInput';
import { requestChallengeAction, verifyChallengeAction } from '@/core/security/actions';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/legacy/ui/button"

import { Shield, Loader2, ArrowRight } from "lucide-react"
import { useTranslation } from "@/shared/i18n/client"

interface TwoFactorFormProps {
    locale: string;
}

export default function TwoFactorForm({ locale }: TwoFactorFormProps) {
    const params = useParams();
    const router = useRouter();
    const tenantSlug = params.tenantSlug as string;
    const { t } = useTranslation();

    // State
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [autoSendTriggered, setAutoSendTriggered] = useState(false);

    // Auto-send code on mount
    useEffect(() => {
        if (!autoSendTriggered && step === 'request') {
            handleRequest();
            setAutoSendTriggered(true);
        }
    }, [autoSendTriggered, step]);

    const handleRequest = async () => {
        setLoading(true);
        setError('');
        try {
            await requestChallengeAction(tenantSlug, locale);
            setStep('verify');
        } catch (err: any) {
            setError(err.message || t('failed_to_send_code'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await verifyChallengeAction(tenantSlug, code);
            if (result && result.success && result.redirectUrl) {
                router.push(result.redirectUrl);
            }
        } catch (err: any) {
            setError(err.message || t('verification_failed'));
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center relative w-full h-full">
            {/* Background Orbs (Matched from Login Layout) */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50 pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50 pointer-events-none" />

            <div className="w-full max-w-lg shadow-2xl rounded-xl border-none relative z-10 bg-white/80 backdrop-blur-sm p-0 m-4">

                {/* Header */}
                <div className="space-y-1 text-center pb-8 pt-8 px-6">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg">
                            <Shield className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                        {t('2fa_title')}
                    </h3>
                    <p className="text-slate-500 font-medium text-sm">
                        {t('verify_identity_for')}
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 pb-6">
                    {error && (
                        <div className="p-3 mb-4 text-sm bg-red-50 border border-red-200 text-red-600 rounded-lg font-medium animate-pulse">
                            {error}
                        </div>
                    )}

                    {step === 'request' && (
                        <div className="text-center py-4">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
                            <p className="text-slate-600">{t('sending_code')}</p>
                        </div>
                    )}

                    {step === 'verify' && (
                        <form onSubmit={handleVerify} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">{t('verification_code_label')}</label>
                                <div className="flex justify-center py-4">
                                    <OtpInput
                                        value={code}
                                        onChange={setCode}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('verifying')}
                                    </>
                                ) : (
                                    <>
                                        {t('verify_button')} <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>

                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={handleRequest}
                                    className="text-sm text-blue-600 hover:text-blue-500 font-medium hover:underline"
                                    disabled={loading}
                                >
                                    {t('resend_code')}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="pt-4 pb-6 text-center w-full text-slate-400 text-xs font-medium border-t border-slate-100/50">
                    {t('secure_environment')}
                </div>
            </div>

            <div className="absolute bottom-4 text-center w-full text-slate-400 text-xs font-medium">
                © {new Date().getFullYear()} Mateusz Popończyk
            </div>
        </div>

    );
}


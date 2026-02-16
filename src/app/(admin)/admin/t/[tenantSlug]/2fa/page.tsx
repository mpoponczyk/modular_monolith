// mateusz poponczyk
'use client';

import { useState } from 'react';
import { requestChallenge, verifyChallenge } from './actions';
import { useParams, useRouter } from 'next/navigation';

export default function TwoFactorPage() {
    const params = useParams();
    const router = useRouter();
    const tenantSlug = params.tenantSlug as string;

    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [emailSent, setEmailSent] = useState(false);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRequest = async () => {
        setLoading(true);
        setError('');
        try {
            await requestChallenge(tenantSlug);
            setEmailSent(true);
            setStep('verify');
        } catch (err: any) {
            setError(err.message || 'Failed to send code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await verifyChallenge(tenantSlug, code);
            // Redirect happens in action
        } catch (err: any) {
            setError(err.message || 'Verification failed');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Two-Factor Authentication
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Tenant: {tenantSlug}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {step === 'request' && (
                        <div>
                            <p className="text-sm text-gray-500 mb-4">
                                To access the admin panel, you need to verify your identity.
                            </p>
                            <button
                                onClick={handleRequest}
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? 'Sending Code...' : 'Send Login Code'}
                            </button>
                        </div>
                    )}

                    {step === 'verify' && (
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                                    Strict Usage Code
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="code"
                                        name="code"
                                        type="text"
                                        required
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="123456"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {loading ? 'Verifying...' : 'Verify'}
                                </button>
                            </div>

                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={handleRequest}
                                    className="text-sm text-indigo-600 hover:text-indigo-500"
                                >
                                    Resend Code
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

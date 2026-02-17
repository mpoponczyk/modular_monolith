"use client"

import Link from "next/link"
import { LayoutGrid } from "lucide-react"
import LanguageSwitcher from "@/components/legacy/admin/LanguageSwitcher"
import { Button } from "@/components/legacy/ui/button"
import { Input } from "@/components/legacy/ui/input"
import { Shield, Lock, Mail, Loader2 } from "lucide-react"
import { useTranslation } from "@/shared/i18n/client"

interface LegacyLoginLayoutProps {
    onLogin: (formData: FormData) => void;
    error: string | null;
    loading?: boolean;
}

export function LegacyLoginLayout({ onLogin, error, loading }: LegacyLoginLayoutProps) {
    const { t } = useTranslation();
    const [localLoading, setLocalLoading] = useState(false);
    const isLoading = loading || localLoading;

    return (
        <div className="min-h-screen flex flex-col font-sans bg-slate-50 relative overflow-hidden">
            {/* Inline Header (Public/Login) */}
            <header className="h-12 bg-[#172554] border-b border-blue-900/50 text-white flex items-center px-4 shadow-md z-50 sticky top-0 font-sans transition-colors duration-300">
                <div className="flex items-center gap-2">
                    <Link
                        href="/login"
                        className="flex items-center gap-2 font-bold text-lg hover:text-blue-200 transition-colors"
                    >
                        <LayoutGrid size={20} />
                        modMonolith
                    </Link>
                </div>

                <nav className="ml-auto flex items-center gap-4">
                    <LanguageSwitcher />
                </nav>
            </header>

            <div className="flex-1 flex items-center justify-center relative">
                {/* Background Orbs */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50 pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50 pointer-events-none" />

                <div className="w-full max-w-lg shadow-2xl rounded-xl border-none relative z-10 bg-white/80 backdrop-blur-sm p-0 m-4">
                    {/* Card Header equivalent */}
                    <div className="space-y-1 text-center pb-8 pt-8 px-6">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                            {t('admin_portal')}
                        </h3>
                        <p className="text-slate-500 font-medium text-sm">
                            {t('technical_auth_required')}
                        </p>
                    </div>

                    <form action={(formData) => {
                        setLocalLoading(true);
                        onLogin(formData);
                    }}>
                        {/* Card Content equivalent */}
                        <div className="space-y-4 px-6 pb-6">
                            {error && (
                                <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-lg font-medium animate-pulse">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">{t('email_login_label')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="text"
                                        placeholder={t('email_login_placeholder')}
                                        required
                                        className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:ring-blue-500 transition-all font-medium"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">{t('password_label')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:ring-blue-500 transition-all font-medium"
                                        placeholder={t('password_placeholder')}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Card Footer equivalent */}
                        <div className="pt-4 pb-8 px-6">
                            <Button
                                type="submit"
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('authenticating')}
                                    </>
                                ) : (
                                    t('sign_in')
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="absolute bottom-4 text-center w-full text-slate-400 text-xs font-medium">
                    © {new Date().getFullYear()} Mateusz Popończyk
                </div>
            </div>
        </div>
    )
}

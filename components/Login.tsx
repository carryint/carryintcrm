import React, { useState } from 'react';
import { User, LogIn, Eye, EyeOff, Lock } from 'lucide-react';
import Logo from './Logo';

interface LoginProps {
    onLogin: (email: string, password: string) => void;
    error?: string;
    companyName: string;
    logoUrl?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, error, companyName, logoUrl }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="min-h-screen crm-black-orange-bg flex items-center justify-center p-4 relative overflow-hidden select-none">
            {/* Ambient Company Brand Logo Blurred Behind Glassmorphism */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
                <div className="w-[450px] h-[450px] sm:w-[650px] sm:h-[650px] opacity-30 blur-[24px] sm:blur-[32px] transform -rotate-12 scale-110">
                    <Logo src={logoUrl} className="w-full h-full object-contain filter drop-shadow-[0_0_100px_rgba(255,107,0,0.85)]" />
                </div>
            </div>

            <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-300">
                <div className="glass-ultra rounded-3xl border border-orange-500/50 shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(234,88,12,0.35)] overflow-hidden text-white backdrop-blur-2xl">
                    
                    {/* Card Header with Brand Logo */}
                    <div className="p-8 text-center border-b border-white/10 bg-black/40 relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500/25 via-amber-500/15 to-transparent rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/40 shadow-inner backdrop-blur-md p-2.5">
                            <Logo src={logoUrl} className="w-full h-full object-contain filter drop-shadow-md" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-sm">{companyName}</h1>
                        <p className="text-orange-300 font-bold text-xs uppercase tracking-wider mt-1">Enterprise CRM & Invoicing Access</p>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        {error && (
                            <div className="bg-red-950/80 text-red-200 p-4 rounded-xl text-xs sm:text-sm font-bold border border-red-500/60 shadow-lg animate-bounce">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-zinc-100 uppercase tracking-widest mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-orange-500/30 bg-black/60 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40 outline-none transition-all font-semibold text-white placeholder-zinc-400 shadow-inner text-sm"
                                        placeholder="name@company.com"
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck="false"
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-zinc-100 uppercase tracking-widest mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-orange-500/30 bg-black/60 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40 outline-none transition-all font-semibold text-white placeholder-zinc-400 shadow-inner text-sm"
                                        placeholder="••••••••"
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck="false"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white active:text-orange-400 transition-colors p-1 rounded-lg focus:outline-none"
                                        title={showPassword ? "Hide password" : "Show password"}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-400 hover:brightness-110 text-black font-black py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/40 active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-wider border border-orange-300 cursor-pointer touch-manipulation"
                            >
                                <LogIn size={18} />
                                <span>Sign In to Dashboard</span>
                            </button>
                        </form>

                        <p className="text-center mt-6 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                            v1.2.2 Cloud Connected & Secured
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

import React, { useState } from 'react';
import { User, LogIn } from 'lucide-react';

interface LoginProps {
    onLogin: (email: string, password: string) => void;
    error?: string;
    companyName: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, error, companyName }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-300">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <div className="bg-orange-600 p-8 text-white text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <span className="text-4xl font-black">C</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">{companyName}</h1>
                        <p className="text-orange-100 font-medium">Enterprise CRM Access</p>
                    </div>

                    <div className="p-8">
                        {error && (
                            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 animate-bounce">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                        placeholder="name@company.com"
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck="false"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
                                <div className="relative">
                                    <LogIn className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                                        placeholder="••••••••"
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck="false"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                Sign In to Dashboard
                            </button>
                        </form>

                        <p className="text-center mt-8 text-gray-400 text-xs font-bold uppercase tracking-widest">
                            v1.2.0 Stable Build
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

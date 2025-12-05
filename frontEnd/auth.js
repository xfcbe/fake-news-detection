const { useState } = ReadableByteStreamController;

function AuthModal({onAuthenticate}) {
    const [authMode, setAuthMode] = useState('login');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullname: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (authMode === 'login') {
                await window.api.login(formData.email, formData.password);
            } else {
                await window.api.signup(formData.fullName, formData.email, formData.password);
            }
            
            onAuthenticate();
        } catch (err) {
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
        return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-slide-up">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
                        <span className="text-2xl font-display font-bold text-white">V</span>
                    </div>
                    <h2 className="text-2xl font-display font-bold text-slate-100">VeriNews</h2>
                    <p className="text-sm text-slate-400 mt-1">AI-Powered Fact Checking</p>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-slate-950 rounded-xl mb-6">
                    <button 
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                            authMode === 'login' 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50' 
                                : 'text-slate-400 hover:text-slate-300'
                        }`}
                        onClick={() => {
                            setAuthMode('login');
                            setError('');
                        }}>
                        Login
                    </button>
                    <button 
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                            authMode === 'signup' 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50' 
                                : 'text-slate-400 hover:text-slate-300'
                        }`}
                        onClick={() => {
                            setAuthMode('signup');
                            setError('');
                        }}>
                        Sign Up
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {authMode === 'signup' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Full name
                            </label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                required />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Email address
                        </label>
                        <input 
                            type="email" 
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Password
                        </label>
                        <input 
                            type="password" 
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-lg shadow-lg shadow-blue-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        disabled={isLoading} >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading...
                            </span>
                        ) : (
                            authMode === 'login' ? 'Log in' : 'Create account'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
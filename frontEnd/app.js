const {useState, useEffect} = React;

// History Section method
function HistorySection({ title, items, onItemClick, getCredibilityColor }) {
    if (!items || items.length === 0) return null;

    return (
        <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                {title}
            </h3>
            <div className="space-y-2">
                {items.map(item => (
                    <div 
                        key={item.id}
                        className="p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-slate-200 dark:hover:bg-slate-900 transition-all group"
                        onClick={() => onItemClick(item)}
                    >
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
                            {item.title}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-1 ${getCredibilityColor(item.credibility)} rounded`}>
                                {item.credibility}%
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{item.content.title}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}




function App() {
    const [theme, setTheme] = useState('dark');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentView, setCurrentView] = useState('home');
    const [inputMode, setInputMode] = useState('text');
    const [inputValue, setInputValue] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [error, setError] = useState('');

        useEffect(() => {
        const isAuth = window.api.isAuthenticated();
        setIsAuthenticated(isAuth);
        
        if (isAuth) {
            loadHistory();
        }
    }, []);


    useEffect (() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
    }, [theme]);


    const toggleTheme = () => {
        setTheme(theme === 'dark'? 'light': 'dark');
    }


    const loadHistory = async () => {
        setIsLoadingHistory(true);
        try{
            const data = await window.api.getHistory();
            setHistory(data.history || data);
        }
        catch(err){
            console.error('Failed to load History: ', err);
        }
        finally{
            setIsLoadingHistory(false);
        }
    };

    const handleAuthenticate = () => {
        setIsAuthenticated(true);
        loadHistory();
    };

    const handleLogout = async () => {
        try {
            await window.api.logout();
        }
        catch(err){
            console.error('Failed to logout: ', err);
        }
        setIsAuthenticated(false);
        setCurrentView('home');
        setIsSidebarOpen(false);
        setHistory([]);
    };

    const handleCheck = async () => {
        if(! inputValue.trim()) return;

        setIsAnalyzing(true);
        setError();
        setIsSidebarOpen(false);

        try {
            const result = await window.api.analyzeContent(inputValue, inputMode);
            await loadHistory();
            setSelectedItem(result);
            setCurrentView('results');
            setInputValue('');
        } 
        catch (err) {
            console.error('Analysis error:', err);
            setError(err.message || 'Failed to analyze content');
        } 
        finally {
            setIsAnalyzing(false);
        }
    };

    const handleHistoryClick = async (item) => {
        setSelectedItem(item);
        setCurrentView('results');
        setIsSidebarOpen(false);

        if(!item.content || !item.content.body) {
            try {
                const fullItem = await window.api.getHistoryItem(item.id);
                selectedItem(fullItem);
            }
            catch(err){
                console.error('Failed to load item details:', err);
            }
        }
    };

    // Credibility Style
        const getCredibilityColor = (score) => {
        if (score >= 70) return 'bg-emerald-500';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getCredibilityLevel = (score) => {
        if (score >= 70) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    };
    
    // Handle groups, Sorted by Date 
    const groupHistoryByDate = () => {
        const today = new Date();
        const groups = { today: [], yesterday: [], older: [] };

        history.forEach(item => {
            const itemDate = new Date(item.analyzed || item.createdAt);
            const diffDays = Math.floor((today - itemDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) groups.today.push(item);
            else if (diffDays === 1) groups.yesterday.push(item);
            else groups.older.push(item);
        });
        return groups;
    };

    const historyGroups = groupHistoryByDate();

    if (!isAuthenticated) {
        return <AuthModal onAuthenticate={handleAuthenticate} />;
    }

    
    return (
        <div className="flex h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {/* Menu Button */}
            <button 
                className={`fixed top-4 left-4 z-50 lg:hidden w-10 h-10 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${isSidebarOpen ? 'bg-slate-200 dark:bg-slate-800' : ''}`}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} >
                <span className={`w-5 h-0.5 bg-slate-900 dark:bg-slate-100 transition-all ${isSidebarOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`w-5 h-0.5 bg-slate-900 dark:bg-slate-100 transition-all ${isSidebarOpen ? 'opacity-0' : ''}`}></span>
                <span className={`w-5 h-0.5 bg-slate-900 dark:bg-slate-100 transition-all ${isSidebarOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
            </button>

            {/* Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" 
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                
                {/* Logo */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                            <span className="text-lg font-display font-bold text-white">V</span>
                        </div>
                        <span className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">VeriNews</span>
                    </div>
                </div>

                {/* Navigation bar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex gap-2">
                        <button 
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${currentView === 'home' && !selectedItem ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                            onClick={() => { setCurrentView('home'); setIsSidebarOpen(false); }} >
                            Home
                        </button>
                        <button 
                            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                            onClick={() => { setCurrentView('home'); setSelectedItem(null); setIsSidebarOpen(false); }} >
                            Check
                        </button>
                    </div>
                </div>

                {/* History */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            <p className="text-sm font-medium mb-1">No history yet</p>
                            <p className="text-xs">Start analyzing content</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <HistorySection 
                                title="Today" 
                                items={historyGroups.today}
                                onItemClick={handleHistoryClick}
                                getCredibilityColor={getCredibilityColor}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                    <button 
                        className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                        onClick={toggleTheme}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <button 
                        className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                        onClick={handleLogout} >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 lg:px-8 py-6">
                    <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900 dark:text-slate-100 ml-12 lg:ml-0">Fake News Detection</h1>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                            <p className="text-slate-600 dark:text-slate-400">Analyzing content with AI...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full px-4">
                            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 max-w-md text-center">
                                <p className="text-red-400 mb-4">{error}</p>
                                <button
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all text-white"
                                    onClick={() => setError('')} >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    ) : currentView === 'home' ? (
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                            {/* Hero */}
                            <div className="text-center mb-12 animate-slide-up">
                                <h2 className="text-4xl lg:text-5xl font-display font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
                                    Detect Fake News with AI
                                </h2>
                                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                                    Enter text content or paste a link to analyze for potential misinformation
                                </p>
                            </div>

                            {/* Features */}
                            <div className="grid md:grid-cols-3 gap-6 mb-12">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-blue-500 transition-all group">
                                    <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100 group-hover:text-blue-400 transition-colors">Text Analysis</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Paste article text or claims to verify</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-blue-500 transition-all group">
                                    <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100 group-hover:text-blue-400 transition-colors">Link Verification</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Check URLs for credibility</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-blue-500 transition-all group">
                                    <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100 group-hover:text-blue-400 transition-colors">AI-Powered</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Advanced detection algorithms</p>
                                </div>
                            </div>

                            {/* Input Section */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:p-8">
                                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl mb-6">
                                    <button 
                                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${inputMode === 'text' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                                        onClick={() => setInputMode('text')} >
                                        Text
                                    </button>
                                    <button 
                                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${inputMode === 'link' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                                        onClick={() => setInputMode('link')} >
                                        Link
                                    </button>
                                </div>

                                <div className="relative">
                                    <textarea 
                                        className="w-full min-h-[150px] px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                                        placeholder={inputMode === 'text' ? 'Paste article text or claims to verify...' : 'Paste URL to analyze...'}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)} />
                                    <button 
                                        className="absolute bottom-4 right-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleCheck}
                                        disabled={!inputValue.trim()}>
                                        Analyze 
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                            {/* Results Header */}
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
                                <button 
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center gap-2 text-slate-900 dark:text-slate-100"
                                    onClick={() => setCurrentView('home')} >
                                    ← Back to Home
                                </button>
                                <a 
                                    href="#" 
                                    className="px-4 py-2 border border-blue-500 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2">
                                    Original Source: {selectedItem?.source} 
                                </a>
                            </div>

                            {/* Credibility Score */}
                            <div className={`inline-flex items-center gap-6 ${getCredibilityColor(selectedItem?.credibility)} rounded-2xl p-6 mb-8 shadow-xl`}>
                                <div className="text-6xl font-display font-bold text-white">
                                    {selectedItem?.credibility}%
                                </div>
                                <div>
                                    <div className="text-sm font-semibold uppercase tracking-wider text-white/90 mb-1">
                                        Credibility Score
                                    </div>
                                    <div className="text-sm text-white/70">
                                        Based on AI cross-referencing
                                    </div>
                                </div>
                            </div>

                            {/* Article Content */}
                            <div className="space-y-6">
                                <h2 className="text-3xl font-display font-semibold text-slate-900 dark:text-slate-100">
                                    {selectedItem?.content?.title}
                                </h2>
                                <p className="text-lg text-slate-600 dark:text-slate-400">
                                    {selectedItem?.content?.subtitle}
                                </p>
                                <div className="text-slate-700 dark:text-slate-300 space-y-4 leading-relaxed">
                                    {selectedItem?.content?.body?.split('\n').map((para, i) => para && (
                                        <p key={i}>{para}</p>
                                    ))}
                                </div>
                            </div>

                            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
                                Analyzed {new Date(selectedItem?.analyzed).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById("root"));

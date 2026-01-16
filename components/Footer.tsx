import React from 'react';
import { ShieldCheck, Lock, ExternalLink, Github, Heart } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Brand & Security */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <img src="/Images/logo.png" alt="FiscalSunset Logo" className="w-5 h-5 object-contain" />
                            <span className="font-bold text-slate-800 dark:text-white">FiscalSunset</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Tax-efficient retirement planning made simple. Optimize your withdrawal strategy and preserve your wealth.
                        </p>
                        <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                            <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                            <span>
                                <strong>Privacy First:</strong> No data is sent to any server. All calculations run locally in your browser. Your API key and numbers are stored securely in your device's IndexedDB.
                            </span>
                        </div>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Resources</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li>
                                <a href="https://www.irs.gov/individuals/seniors-retirees" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
                                    IRS Seniors & Retirees <ExternalLink className="w-3 h-3" />
                                </a>
                            </li>
                            <li>
                                <a href="https://www.medicare.gov/basics/costs/medicare-costs" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
                                    Medicare Costs (IRMAA) <ExternalLink className="w-3 h-3" />
                                </a>
                            </li>
                            <li>
                                <a href="https://www.ssa.gov/benefits/retirement/planner/taxes.html" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
                                    Social Security Taxes <ExternalLink className="w-3 h-3" />
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Connect */}
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Connect</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li>
                                <a href="https://github.com/meva/retiresmart-tax-efficient-withdrawal-strategist" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors">
                                    <Github className="w-4 h-4" /> GitHub Repository
                                </a>
                            </li>
                            <li>
                                <a href="mailto:financepro@me.com" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors">
                                    <span className="w-4 h-4 flex items-center justify-center font-bold">@</span> Contact Developer
                                </a>
                            </li>
                        </ul>
                        <div className="mt-6 text-xs text-slate-400 dark:text-slate-600 flex items-center gap-1">
                            Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> and AI
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        © {new Date().getFullYear()} FiscalSunset. Educational purposes only. Not financial advice.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                        <span>v0.1.0 Beta</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

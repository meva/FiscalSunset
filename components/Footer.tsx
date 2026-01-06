import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-500" />
                        <span className="text-sm font-medium">No Data is Stored on Our Servers</span>
                    </div>


                </div>
                <div className="mt-4 text-center text-[10px] text-slate-400 dark:text-slate-600">
                    © {new Date().getFullYear()} RetireSmart. All calculations are performed locally in your browser.
                </div>
            </div>
        </footer>
    );
};

export default Footer;

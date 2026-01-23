import React, { useState, useEffect } from 'react';
import { X, Key, Trash2, Save, Check, RefreshCw } from 'lucide-react';
import { db } from '../../services/db';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiKey: string;
    setApiKey: (key: string) => void;
    onReset: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, apiKey, setApiKey, onReset }) => {
    const [localKey, setLocalKey] = useState(apiKey);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setLocalKey(apiKey);
    }, [apiKey]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setApiKey(localKey);

        // Persist to DB
        const existing = await db.settings.get(1);
        if (existing) {
            await db.settings.update(1, { apiKey: localKey });
        } else {
            await db.settings.add({ id: 1, apiKey: localKey });
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Key className="w-5 h-5 text-blue-600" />
                        Settings
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* content */}
                <div className="p-6 space-y-6">

                    {/* API Key Section */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Gemini API Key
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={localKey}
                                onChange={(e) => setLocalKey(e.target.value)}
                                placeholder="Enter your Gemini API Key"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                            <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Your key is stored locally on your device and never sent to our servers. Be sure to enable the key for Gemini API usage. <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Get an API key here</a>.
                        </p>
                        <button
                            onClick={handleSave}
                            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-all ${saved
                                ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
                                }`}
                        >
                            {saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save API Key</>}
                        </button>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Danger Zone */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            Reset Data
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Clear all saved profiles and return to default values. This action cannot be undone.
                        </p>
                        <button
                            onClick={onReset}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:border-red-900 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reset User Profile
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default SettingsModal;

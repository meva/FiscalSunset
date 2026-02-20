import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { HelpCircle, Info } from 'lucide-react';

interface TooltipProps {
    content: React.ReactNode;
    children?: React.ReactNode;
    icon?: 'help' | 'info';
    className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, icon = 'help', className = '' }) => {
    return (
        <TooltipPrimitive.Provider delayDuration={150}>
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>
                    {children ? (
                        <span className={`inline-flex items-center group cursor-pointer ${className}`}>
                            {children}
                        </span>
                    ) : (
                        <button
                            type="button"
                            className={`cursor-help text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors ml-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full inline-block align-middle pb-[2px] ${className}`}
                            onClick={(e) => e.preventDefault()}
                        >
                            {icon === 'help' ? (
                                <HelpCircle className="w-4 h-4 inline" aria-label="More information" />
                            ) : (
                                <Info className="w-4 h-4 inline" aria-label="Information" />
                            )}
                        </button>
                    )}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        className="z-[99999] w-max max-w-xs rounded shadow-lg bg-slate-800 dark:bg-slate-700 text-white p-2 text-xs leading-relaxed animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2"
                        sideOffset={5}
                        collisionPadding={10}
                    >
                        {content}
                        <TooltipPrimitive.Arrow className="fill-slate-800 dark:fill-slate-700 object-cover" width={11} height={5} />
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
};

export default Tooltip;

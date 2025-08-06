// src/components/dashboard/speed-dial.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, Apple, Dumbbell, Weight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogEntrySheet, LogType } from './log-entry-sheet';

type Action = {
  icon: React.ElementType,
  label: string,
  logType: Exclude<LogType, null>,
}

const actions: Action[] = [
  { icon: Apple, label: 'Log Meal', logType: 'meal' },
  { icon: Dumbbell, label: 'Log Activity', logType: 'activity' },
  { icon: Weight, label: 'Log Weight', logType: 'weight' },
];

export function SpeedDial() {
  const [isOpen, setIsOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeLogType, setActiveLogType] = useState<Exclude<LogType, null>>('meal');

  const handleActionClick = (logType: Exclude<LogType, null>) => {
    setActiveLogType(logType);
    setSheetOpen(true);
    setIsOpen(false);
  };

  return (
    <>
        {/* Backdrop */}
        <div
            className={cn(
            'fixed inset-0 z-40 bg-black/30 transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onClick={() => setIsOpen(false)}
        />
        
        <div className="fixed bottom-24 right-6 z-50 sm:bottom-8">
            <div className="relative flex flex-col items-center gap-4">
                {/* Action Buttons */}
                <div
                    className={cn(
                        'flex flex-col items-center gap-4 transition-all duration-300',
                        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
                    )}
                >
                {actions.map((action, index) => (
                    <div key={index} className="flex items-center gap-3">
                         <div className="bg-card text-card-foreground rounded-md px-3 py-1 text-sm shadow-md">
                            {action.label}
                        </div>
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-12 w-12 rounded-full shadow-lg"
                            onClick={() => handleActionClick(action.logType)}
                        >
                            <action.icon className="h-6 w-6" />
                        </Button>
                    </div>
                ))}
                </div>

                {/* Main FAB */}
                <Button
                    size="icon"
                    className="h-16 w-16 rounded-full shadow-lg bg-accent hover:bg-accent/90 relative"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <Plus
                        className={cn(
                            'h-8 w-8 transition-all duration-300 absolute',
                            isOpen ? 'rotate-45 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                        )}
                    />
                    <X
                        className={cn(
                            'h-8 w-8 transition-all duration-300 absolute',
                            isOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-45 scale-0 opacity-0'
                        )}
                    />
                    <span className="sr-only">Toggle speed dial</span>
                </Button>
            </div>
        </div>

        <LogEntrySheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          logType={activeLogType}
        />
    </>
  );
}

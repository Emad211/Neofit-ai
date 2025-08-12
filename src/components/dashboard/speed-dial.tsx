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
  const [activeLogType, setActiveLogType] = useState<Exclude<LogType, null> | null>(null);

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
        
        <div className="fixed bottom-6 right-4 z-50">
            <div className="relative flex flex-col items-end gap-4">
                {/* Action Buttons */}
                <div
                    className={cn(
                        'flex flex-col items-end gap-4 transition-all duration-300',
                        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                    )}
                >
                {actions.map((action) => (
                    <div key={action.logType} className="flex items-center gap-3">
                         <div className="bg-secondary text-secondary-foreground rounded-md px-4 py-2 text-sm font-bold shadow-md">
                            {action.label}
                        </div>
                        <Button
                            size="icon"
                            variant="default"
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
                    className="h-16 w-16 rounded-full shadow-lg bg-primary hover:bg-primary/90 relative"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <Plus
                        className={cn(
                            'h-8 w-8 transition-all duration-300 absolute',
                            isOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                        )}
                    />
                    <X
                        className={cn(
                            'h-8 w-8 transition-all duration-300 absolute',
                            isOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
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
          onClose={() => setActiveLogType(null)}
        />
    </>
  );
}

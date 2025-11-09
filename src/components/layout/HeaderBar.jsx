import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogOut, Moon, Sun, AlertTriangle } from 'lucide-react';

const HeaderBar = ({ title = 'ComputerAdminAuth', userName, theme, onToggleTheme, onLogout, channelError }) => (
  <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10 transition-colors">
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="flex items-center gap-4">
          {channelError && (
            <Card className="px-3 py-1 text-xs text-red-600 dark:text-red-300 bg-red-50/80 dark:bg-red-900/30 border-red-200 dark:border-red-800 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{channelError}</span>
            </Card>
          )}
          <span className="text-sm text-gray-600 dark:text-slate-300">
            {userName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className="gap-2"
            aria-label="Переключить тему"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4" />
                <span className="hidden sm:inline">Светлая тема</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span className="hidden sm:inline">Тёмная тема</span>
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Выход
          </Button>
        </div>
      </div>
    </div>
  </header>
);

export default HeaderBar;

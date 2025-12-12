import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, AlertCircle } from 'lucide-react';

const UserInfoCard = ({ user, loading, error, onReload }) => {
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-28">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-500 dark:text-slate-400">Полное имя</Label>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {user?.full_name || user?.name || '—'}
            </p>
          </div>
          <div>
            <Label className="text-gray-500 dark:text-slate-400">Имя пользователя</Label>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {user?.preferred_username || '—'}
            </p>
          </div>
          <div>
            <Label className="text-gray-500 dark:text-slate-400">Email</Label>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {user?.email || '—'}
            </p>
          </div>
          <div>
            <Label className="text-gray-500 dark:text-slate-400">Телефон</Label>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {user?.phone_number || '—'}
            </p>
          </div>
        </div>
        {user?.roles && user.roles.length > 0 && (
          <div>
            <Label className="text-gray-500 dark:text-slate-400">Роли</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {user.roles.map((role) => (
                <Badge
                  key={role}
                  variant="secondary"
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                >
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Информация о пользователе
          </CardTitle>
          {!loading && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-slate-600 dark:text-slate-300"
              onClick={onReload}
            >
              <Loader2 className="h-4 w-4" />
              Обновить
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{renderContent()}</CardContent>
    </Card>
  );
};

export default UserInfoCard;

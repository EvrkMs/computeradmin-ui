import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, AlertCircle, Plus, Key } from 'lucide-react';
import CreateUserDialog from '../dialogs/CreateUserDialog';
import PasswordResetDialog from '../dialogs/PasswordResetDialog';

const EmployeesPage = () => {
  const { authService } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadData();
  }, [searchQuery, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        authService.getUsers(searchQuery, statusFilter),
        authService.getRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await authService.createUser(userData);
      setShowCreateDialog(false);
      await loadData();
    } catch (err) {
      setError('Ошибка создания пользователя');
    }
  };

  const handleResetPassword = async (password, requireChange) => {
    try {
      await authService.resetPassword(selectedUser.id, password, requireChange);
      setShowPasswordDialog(false);
      setSelectedUser(null);
    } catch (err) {
      setError('Ошибка сброса пароля');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Список сотрудников
            </CardTitle>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить сотрудника
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Поиск по имени, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 border rounded-md bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-100"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Все статусы</option>
                <option value="Active">Активные</option>
                <option value="Inactive">Неактивные</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="border dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-900/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                      Сотрудник
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                      Email / Телефон
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                      Роли
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                      Статус
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{user.fullName}</p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">@{user.userName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-900 dark:text-slate-100">
                          <p>{user.email || '—'}</p>
                          <p className="text-gray-500 dark:text-slate-400">{user.phoneNumber || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role) => (
                            <Badge
                              key={role}
                              variant="secondary"
                              className="text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={user.isActive ? 'default' : 'secondary'}
                          className={
                            user.isActive
                              ? 'bg-green-500 text-slate-900'
                              : 'dark:bg-slate-800 dark:text-slate-200'
                          }
                        >
                          {user.status}
                        </Badge>
                        {user.mustChangePassword && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs dark:border-slate-700 dark:text-slate-200"
                          >
                            Смена пароля
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPasswordDialog(true);
                          }}
                          className="gap-2 text-slate-600 dark:text-slate-300"
                        >
                          <Key className="h-4 w-4" />
                          Сбросить пароль
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateUserDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateUser}
        roles={roles}
      />

      <PasswordResetDialog
        open={showPasswordDialog}
        user={selectedUser}
        onClose={() => {
          setShowPasswordDialog(false);
          setSelectedUser(null);
        }}
        onSubmit={handleResetPassword}
      />
    </div>
  );
};

export default EmployeesPage;

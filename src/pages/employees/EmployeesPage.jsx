import React, { useState, useEffect, useCallback, useRef, useActionState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, AlertCircle, Plus, Key, Pencil, Shield, Trash2 } from 'lucide-react';
import CreateUserDialog from './components/CreateUserDialog';
import PasswordResetDialog from './components/PasswordResetDialog';
import EditUserDialog from './components/EditUserDialog';
import EditRoleDialog from './components/EditRoleDialog';
import RemoveRoleDialog from './components/RemoveRoleDialog';

const TABS = {
  EMPLOYEES: 'employees',
  ROLES: 'roles',
};

const DEFAULT_ROLE_STATE = { status: 'idle', message: '' };

const EmployeesPage = ({ canManageUsers, canManageRoles, hasRoleManager }) => {
  const { authService } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS.EMPLOYEES);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);
  const [showRemoveRoleDialog, setShowRemoveRoleDialog] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState(null);
  const activeRequestRef = useRef(0);

  const canView = canManageRoles;
  const roleManagerTooltip = hasRoleManager
    ? undefined
    : 'Недостаточно прав: требуется роль RoleManager';
  const rootTooltip = canManageRoles ? undefined : 'Недостаточно прав: требуется роль Root';

  const reloadData = useCallback(async () => {
    if (!canView) {
      setUsers([]);
      setRoles([]);
      setIsInitialLoad(false);
      setIsRefreshing(false);
      return false;
    }

    const requestId = ++activeRequestRef.current;
    setIsRefreshing(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        authService.getUsers(searchQuery, statusFilter),
        authService.getRoles(),
      ]);

      if (requestId !== activeRequestRef.current) return false;

      setUsers(usersData);
      setRoles(rolesData);
      setError('');
      return true;
    } catch (err) {
      if (requestId === activeRequestRef.current) {
        setError(err.message || 'Не удалось загрузить данные');
      }
      return false;
    } finally {
      if (requestId === activeRequestRef.current) {
        setIsRefreshing(false);
        setIsInitialLoad(false);
      }
    }
  }, [authService, searchQuery, statusFilter, canView]);

  useEffect(() => {
    if (!canView) {
      setIsInitialLoad(false);
      setIsRefreshing(false);
      return () => {
        activeRequestRef.current += 1;
      };
    }

    reloadData();
    return () => {
      activeRequestRef.current += 1;
    };
  }, [reloadData, canView]);

  const handleCreateUser = useCallback(async (userData) => {
    if (!canManageUsers) return;
    try {
      await authService.createUser(userData);
      setShowCreateDialog(false);
      setError('');
      await reloadData();
    } catch (err) {
      setError(err.message || 'Ошибка создания пользователя');
      throw err;
    }
  }, [authService, canManageUsers, reloadData]);

  const handleResetPassword = useCallback(async (password, requireChange) => {
    if (!passwordUser || !canManageUsers) return;
    try {
      await authService.resetPassword(passwordUser.id, password, requireChange);
      setShowPasswordDialog(false);
      setPasswordUser(null);
      setError('');
      await reloadData();
    } catch (err) {
      setError(err.message || 'Ошибка сброса пароля');
      throw err;
    }
  }, [authService, passwordUser, canManageUsers, reloadData]);

  const handleUpdateUser = useCallback(async (payload) => {
    if (!editUser || !canManageUsers) return;
    try {
      await authService.updateUser(editUser.id, payload);
      setShowEditDialog(false);
      setEditUser(null);
      setError('');
      await reloadData();
    } catch (err) {
      setError(err.message || 'Ошибка обновления пользователя');
      throw err;
    }
  }, [authService, editUser, canManageUsers, reloadData]);

  const [roleState, createRoleAction, isRolePending] = useActionState(
    async (_prevState, formData) => {
      if (!canManageRoles) {
        return { status: 'error', message: 'Недостаточно прав для управления ролями' };
      }

      const name = formData.get('roleName');
      const trimmed = typeof name === 'string' ? name.trim() : '';
      if (!trimmed) {
        return { status: 'error', message: 'Введите название роли' };
      }

      try {
        await authService.createRole(trimmed);
        setNewRoleName('');
        await reloadData();
        return { status: 'idle', message: '' };
      } catch (err) {
        return {
          status: 'error',
          message: err.message || 'Ошибка создания роли',
        };
      }
    },
    DEFAULT_ROLE_STATE,
  );

  const roleError = roleState.status === 'error' ? roleState.message : '';

  const handleUpdateRole = useCallback(async (name) => {
    if (!roleToEdit) return;
    try {
      await authService.updateRole(roleToEdit.id, name);
      setShowEditRoleDialog(false);
      setRoleToEdit(null);
      setError('');
      await reloadData();
    } catch (err) {
      setError(err.message || 'Ошибка обновления роли');
      throw err;
    }
  }, [authService, roleToEdit, reloadData]);

  const handleRemoveRole = useCallback(async () => {
    if (!roleToRemove) return;
    try {
      await authService.deleteRole(roleToRemove.id);
      setShowRemoveRoleDialog(false);
      setRoleToRemove(null);
      setError('');
      await reloadData();
    } catch (err) {
      setError(err.message || 'Ошибка удаления роли');
      throw err;
    }
  }, [authService, roleToRemove, reloadData]);

  if (!canView) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Недостаточно прав для просмотра этой страницы. Доступ разрешён только роли Root.
        </AlertDescription>
      </Alert>
    );
  }

  if (isInitialLoad && isRefreshing) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  const showRefreshingOverlay = isRefreshing && !isInitialLoad;

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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {activeTab === TABS.EMPLOYEES ? (
                  <Users className="h-5 w-5" />
                ) : (
                  <Shield className="h-5 w-5" />
                )}
                {activeTab === TABS.EMPLOYEES ? 'Список сотрудников' : 'Управление ролями'}
              </CardTitle>
              {activeTab === TABS.EMPLOYEES && (
                <Button
                  onClick={() => {
                    if (canManageUsers) {
                      setShowCreateDialog(true);
                    }
                  }}
                  className="gap-2"
                  disabled={!canManageUsers}
                  title={canManageUsers ? undefined : roleManagerTooltip}
                >
                  <Plus className="h-4 w-4" />
                  Добавить сотрудника
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === TABS.EMPLOYEES ? 'default' : 'outline'}
                onClick={() => setActiveTab(TABS.EMPLOYEES)}
              >
                Сотрудники
              </Button>
              <Button
                variant={activeTab === TABS.ROLES ? 'default' : 'outline'}
                onClick={() => setActiveTab(TABS.ROLES)}
              >
                Роли
              </Button>
            </div>
            {showRefreshingOverlay && (
              <span className="text-sm text-gray-500 dark:text-slate-400">
                Обновление данных...
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === TABS.EMPLOYEES && (
            <div className="space-y-4">
              <div className="flex gap-4 flex-col sm:flex-row">
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
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-900/60 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {user.fullName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                              @{user.userName}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-900 dark:text-slate-100">
                            <p>{user.email || '—'}</p>
                            <p className="text-gray-500 dark:text-slate-400">
                              {user.phoneNumber || '—'}
                            </p>
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
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (!canManageUsers) return;
                                setEditUser(user);
                                setShowEditDialog(true);
                              }}
                              className="gap-2 text-slate-600 dark:text-slate-300"
                              disabled={!canManageUsers}
                              title={canManageUsers ? undefined : roleManagerTooltip}
                            >
                              <Pencil className="h-4 w-4" />
                              Редактировать
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (!canManageUsers) return;
                                setPasswordUser(user);
                                setShowPasswordDialog(true);
                              }}
                              className="gap-2 text-slate-600 dark:text-slate-300"
                              disabled={!canManageUsers}
                              title={canManageUsers ? undefined : roleManagerTooltip}
                            >
                              <Key className="h-4 w-4" />
                              Сбросить пароль
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-6 text-center text-sm text-gray-500 dark:text-slate-400"
                        >
                          Сотрудники не найдены
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === TABS.ROLES && (
            <div className="space-y-4">
              <form
                className="flex flex-col sm:flex-row gap-2"
                action={createRoleAction}
              >
                <Input
                  name="roleName"
                  placeholder="Название роли"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  disabled={!canManageRoles}
                  title={canManageRoles ? undefined : rootTooltip}
                />
                <Button
                  type="submit"
                  disabled={isRolePending || !canManageRoles}
                  className="gap-2"
                  title={canManageRoles ? undefined : rootTooltip}
                >
                  <Plus className="h-4 w-4" />
                  Создать роль
                </Button>
              </form>
              {roleError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{roleError}</AlertDescription>
                </Alert>
              )}
              <div className="border dark:border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-900/60">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                        Название
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                        Идентификатор
                      </th>
                      {canManageRoles && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">
                          Действия
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {roles.map((role) => (
                      <tr
                        key={role.id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-900/60 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {role.name}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 break-all">
                          {role.id}
                        </td>
                        {canManageRoles && (
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-slate-600 dark:text-slate-300"
                                onClick={() => {
                                  setRoleToEdit(role);
                                  setShowEditRoleDialog(true);
                                }}
                                disabled={!canManageRoles}
                                title={rootTooltip}
                              >
                                <Pencil className="h-4 w-4" />
                                Переименовать
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-red-600 dark:text-red-400"
                                onClick={() => {
                                  setRoleToRemove(role);
                                  setShowRemoveRoleDialog(true);
                                }}
                                disabled={!canManageRoles}
                                title={rootTooltip}
                              >
                                <Trash2 className="h-4 w-4" />
                                Удалить
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {roles.length === 0 && (
                      <tr>
                        <td
                          colSpan={canManageRoles ? 3 : 2}
                          className="px-4 py-6 text-center text-sm text-gray-500 dark:text-slate-400"
                        >
                          Роли не найдены
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
        onClose={() => {
          setPasswordUser(null);
          setShowPasswordDialog(false);
        }}
        onSubmit={handleResetPassword}
        user={passwordUser}
      />
      <EditUserDialog
        open={showEditDialog}
        onClose={() => {
          setEditUser(null);
          setShowEditDialog(false);
        }}
        onSubmit={handleUpdateUser}
        user={editUser}
        roles={roles}
      />
      <EditRoleDialog
        open={showEditRoleDialog}
        role={roleToEdit}
        onClose={() => {
          setShowEditRoleDialog(false);
          setRoleToEdit(null);
        }}
        onSubmit={handleUpdateRole}
      />
      <RemoveRoleDialog
        open={showRemoveRoleDialog}
        role={roleToRemove}
        onClose={() => {
          setShowRemoveRoleDialog(false);
          setRoleToRemove(null);
        }}
        onConfirm={handleRemoveRole}
      />
    </div>
  );
};

export default EmployeesPage;

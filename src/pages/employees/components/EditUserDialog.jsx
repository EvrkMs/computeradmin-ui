import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEFAULT_STATUS = 'Active';

const EditUserDialog = ({ open, onClose, user, roles, onSubmit }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    status: DEFAULT_STATUS,
    roles: [],
  });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        status: user.status || DEFAULT_STATUS,
        roles: Array.isArray(user.roles) ? [...user.roles] : [],
      });
    } else {
      setFormData({
        fullName: '',
        phoneNumber: '',
        status: DEFAULT_STATUS,
        roles: [],
      });
    }
  }, [user, open]);

  if (!user) {
    return null;
  }

  const toggleRole = (roleName) => {
    setFormData((prev) => {
      const exists = prev.roles.includes(roleName);
      const roles = exists
        ? prev.roles.filter((r) => r !== roleName)
        : [...prev.roles, roleName];
      return { ...prev, roles };
    });
  };

  const handleDialogChange = (nextOpen) => {
    if (!nextOpen && open) {
      setPending(false);
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (pending) return;
    const trimmedFullName = formData.fullName ? formData.fullName.trim() : '';
    if (!trimmedFullName) return;
    const trimmedPhone = formData.phoneNumber ? formData.phoneNumber.trim() : '';
    setPending(true);
    try {
      await onSubmit({
        fullName: trimmedFullName || undefined,
        phoneNumber: trimmedPhone,
        status: formData.status,
        roles: formData.roles,
      });
    } catch {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать сотрудника</DialogTitle>
          <DialogDescription>Настройка профиля пользователя @{user.userName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Полное имя *</Label>
            <Input
              value={formData.fullName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, fullName: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Телефон</Label>
            <Input
              value={formData.phoneNumber || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  phoneNumber: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label>Статус</Label>
            <select
              className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-100"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="Active">Активный</option>
              <option value="Inactive">Неактивный</option>
            </select>
          </div>
          <div>
            <Label>Роли</Label>
            <div className="space-y-2 mt-2">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role.name)}
                    onChange={() => toggleRole(role.name)}
                  />
                  <span>{role.name}</span>
                </label>
              ))}
              {roles.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Роли пока не созданы.
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogChange(false)} disabled={pending}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;

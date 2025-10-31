import React, { useState } from 'react';
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

const CreateUserDialog = ({ open, onClose, onSubmit, roles }) => {
  const [formData, setFormData] = useState({
    userName: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    status: 'Active',
    roles: [],
  });

  const [pending, setPending] = useState(false);

  const resetForm = () => {
    setFormData({
      userName: '',
      password: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      status: 'Active',
      roles: [],
    });
  };

  const handleDialogChange = (nextOpen) => {
    if (!nextOpen) {
      resetForm();
      setPending(false);
      if (open) {
        onClose();
      }
    }
  };

  const handleSubmit = async () => {
    if (pending) return;
    setPending(true);
    try {
      await onSubmit(formData);
      resetForm();
    } catch {
      // Ошибка обрабатывается родительским компонентом
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить сотрудника</DialogTitle>
          <DialogDescription>Создание нового пользователя в системе</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Имя пользователя *</Label>
            <Input
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
            />
          </div>
          <div>
            <Label>Пароль *</Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div>
            <Label>Полное имя *</Label>
            <Input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Телефон</Label>
            <Input
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
          </div>
          <div>
            <Label>Роли</Label>
            <div className="space-y-2 mt-2">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, roles: [...formData.roles, role.name] });
                      } else {
                        setFormData({
                          ...formData,
                          roles: formData.roles.filter((r) => r !== role.name),
                        });
                      }
                    }}
                  />
                  <span>{role.name}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? 'Сохранение...' : 'Создать'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;

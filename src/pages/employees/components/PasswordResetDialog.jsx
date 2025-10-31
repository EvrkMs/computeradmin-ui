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

const PasswordResetDialog = ({ open, user, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [requireChange, setRequireChange] = useState(true);
  const [pending, setPending] = useState(false);

  const handleClose = () => {
    setPassword('');
    setRequireChange(true);
    setPending(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (pending) return;
    setPending(true);
    try {
      await onSubmit(password, requireChange);
      setPassword('');
      setRequireChange(true);
      setPending(false);
    } catch {
      setPending(false);
    }
  };

  const handleDialogChange = (nextOpen) => {
    if (!nextOpen && open) {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Сброс пароля</DialogTitle>
          <DialogDescription>
            Установка нового пароля для {user?.fullName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Новый пароль</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={requireChange}
              onChange={(e) => setRequireChange(e.target.checked)}
            />
            <span className="text-sm">Требовать смену пароля при следующем входе</span>
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? 'Сохранение...' : 'Сбросить пароль'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetDialog;

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

const EditRoleDialog = ({ open, role, onClose, onSubmit }) => {
  const [name, setName] = useState(role?.name ?? '');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setName(role?.name ?? '');
    setPending(false);
  }, [role]);

  const handleDialogChange = (nextOpen) => {
    if (!nextOpen) {
      setName('');
      setPending(false);
      if (open) {
        onClose();
      }
    }
  };

  const handleSubmit = async () => {
    if (!role || pending) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setPending(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Переименовать роль</DialogTitle>
          <DialogDescription>
            Укажите новое имя для роли.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Новое название роли *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={pending || !name.trim()}>
            {pending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoleDialog;

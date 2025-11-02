import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const RemoveRoleDialog = ({ open, role, onClose, onConfirm }) => {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setPending(false);
    }
  }, [open]);

  const handleDialogChange = (nextOpen) => {
    if (!nextOpen) {
      setPending(false);
      if (open) {
        onClose();
      }
    }
  };

  const handleConfirm = async () => {
    if (!role || pending) return;
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Удалить роль</DialogTitle>
          <DialogDescription>
            Это действие необратимо. Роль
            {role?.name ? ` "${role.name}"` : ''} будет удалена из системы.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogChange(false)}>
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveRoleDialog;

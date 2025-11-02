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
import { Label } from '@/components/ui/label';

const ReverseChangeDialog = ({ open, change, onClose, onSubmit }) => {
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setComment('');
      setPending(false);
    }
  }, [open, change?.id]);

  const handleDialogChange = (nextOpen) => {
    if (!nextOpen) {
      setComment('');
      setPending(false);
      if (open) {
        onClose();
      }
    }
  };

  const handleSubmit = async () => {
    if (!change || pending) return;
    if (!comment.trim()) return;
    setPending(true);
    try {
      await onSubmit(comment.trim());
      setComment('');
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Реверс операции</DialogTitle>
          <DialogDescription>
            Укажите причину отмены операции #{change?.id}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Комментарий *</Label>
          <textarea
            className="w-full min-h-[120px] px-3 py-2 border rounded-md bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-100"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogChange(false)}>
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={pending || !comment.trim()}
          >
            {pending ? 'Выполняется...' : 'Отменить операцию'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReverseChangeDialog;

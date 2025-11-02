import React, { useEffect, useState, useMemo } from 'react';
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

const REASONS = [
  { value: 'Regular', label: 'Обычная операция' },
  { value: 'Surplus', label: 'Излишек' },
  { value: 'Shortage', label: 'Недостача' },
  { value: 'Correction', label: 'Коррекция' },
];

const DIRECTIONS = [
  { value: 'Credit', label: 'Приход' },
  { value: 'Debit', label: 'Расход' },
];

const defaultState = {
  reason: 'Regular',
  direction: 'Credit',
  amount: '',
  category: '',
  comment: '',
  occurredAt: '',
};

const CreateChangeDialog = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState(defaultState);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(defaultState);
      setPending(false);
    }
  }, [open]);

  const isDirectionFixed = useMemo(() => {
    return form.reason === 'Surplus' || form.reason === 'Shortage';
  }, [form.reason]);

  const effectiveDirection = useMemo(() => {
    if (form.reason === 'Surplus') return 'Credit';
    if (form.reason === 'Shortage') return 'Debit';
    return form.direction;
  }, [form.reason, form.direction]);

  const directionOptions = useMemo(() => {
    if (!isDirectionFixed) {
      return DIRECTIONS;
    }
    return DIRECTIONS.filter((dir) => dir.value === effectiveDirection);
  }, [isDirectionFixed, effectiveDirection]);

  const handleDialogChange = (nextOpen) => {
    if (!nextOpen) {
      setForm(defaultState);
      setPending(false);
      if (open) {
        onClose();
      }
    }
  };

  const handleSubmit = async () => {
    if (pending) return;

    const amountNumber = Number(form.amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return;
    }

    const payload = {
      reason: form.reason,
      direction: effectiveDirection,
      amount: Number(amountNumber.toFixed(2)),
      category: form.category.trim(),
      comment: form.comment.trim(),
      occurredAt: form.occurredAt ? new Date(form.occurredAt).toISOString() : null,
    };

    setPending(true);
    try {
      await onSubmit(payload);
      setForm(defaultState);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Новая операция</DialogTitle>
          <DialogDescription>
            Заполните информацию об операции по сейфу.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Причина *</Label>
            <select
              className="px-3 py-2 border rounded-md bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-100"
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
            >
              {REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Направление *</Label>
            <select
              className="px-3 py-2 border rounded-md bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-100"
              value={effectiveDirection}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, direction: e.target.value }))
              }
              disabled={isDirectionFixed}
            >
              {directionOptions.map((direction) => (
                <option key={direction.value} value={direction.value}>
                  {direction.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Сумма *</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Категория *</Label>
            <Input
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Комментарий *</Label>
            <textarea
              className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-100"
              value={form.comment}
              onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Дата операции</Label>
            <Input
              type="datetime-local"
              value={form.occurredAt}
              onChange={(e) => setForm((prev) => ({ ...prev, occurredAt: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              pending ||
              !form.amount ||
              Number(form.amount) <= 0 ||
              !form.category.trim() ||
              !form.comment.trim()
            }
          >
            {pending ? 'Сохранение...' : 'Создать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChangeDialog;

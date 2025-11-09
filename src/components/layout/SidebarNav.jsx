import React from 'react';
import { Button } from '@/components/ui/button';
import { User, PiggyBank, Users } from 'lucide-react';
import { DEFAULT_PAGE, SAFE_PAGE, EMPLOYEES_PAGE } from '@/constants/navigation';

const SidebarNav = ({ currentPage, onNavigate, canViewEmployees }) => (
  <aside className="w-full sm:w-64 space-y-2">
    <Button
      variant={currentPage === DEFAULT_PAGE ? 'default' : 'ghost'}
      className="w-full justify-start gap-2"
      onClick={() => onNavigate(DEFAULT_PAGE)}
    >
      <User className="h-4 w-4" />
      Профиль
    </Button>
    <Button
      variant={currentPage === SAFE_PAGE ? 'default' : 'ghost'}
      className="w-full justify-start gap-2"
      onClick={() => onNavigate(SAFE_PAGE)}
    >
      <PiggyBank className="h-4 w-4" />
      Сейф
    </Button>
    <Button
      variant={currentPage === EMPLOYEES_PAGE ? 'default' : 'ghost'}
      className="w-full justify-start gap-2"
      disabled={!canViewEmployees}
      title={
        canViewEmployees
          ? undefined
          : 'Недостаточно прав: требуется роль Root'
      }
      onClick={() => {
        if (canViewEmployees) {
          onNavigate(EMPLOYEES_PAGE);
        }
      }}
    >
      <Users className="h-4 w-4" />
      Сотрудники
    </Button>
  </aside>
);

export default SidebarNav;

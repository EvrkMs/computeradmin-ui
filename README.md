# ComputerAdminAuth Web UI

Веб-интерфейс для системы ComputerAdminAuth.

## Быстрый старт

```bash
npm install
npm run dev
```

## Конфигурация

Отредактируйте `.env` и укажите адрес вашего сервера:

```
VITE_AUTH_API_BASE_URL=https://your-auth-server.com
```

Файл `.env` также используется Docker-сборкой и docker-compose — при изменении значений не требуется дублировать их в конфигурации контейнеров.

## Команды

- `npm run dev` - запуск dev сервера (http://localhost:3000)
- `npm run build` - production сборка
- `npm run preview` - предпросмотр production сборки

## Технологии

- React 18
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React Icons

## Структура

- `src/pages/` - страницы приложения
- `src/components/` - UI компоненты
- `src/services/` - сервисы для работы с API
- `src/contexts/` - React контексты
- `src/dialogs/` - модальные окна

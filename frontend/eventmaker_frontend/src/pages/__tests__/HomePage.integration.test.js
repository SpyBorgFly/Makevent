import { render, screen, waitFor } from '@testing-library/react';
import { HomePage } from '../HomePage';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router';

// === Полный и правильный мок Telegram WebApp ===
// Это заставит твой код авторизации думать, что мы в настоящем Telegram Mini App
beforeAll(() => {
  Object.defineProperty(window, 'Telegram', {
    value: {
      WebApp: {
        initDataUnsafe: {
          user: {
            id: 123456789,
            first_name: 'Николай',
            last_name: '',
            username: 'nikolay_tg',
            language_code: 'ru',
            is_premium: false
          }
        },
        initData: 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Николай%22%7D', // закодированная строка
        ready: jest.fn(),
        expand: jest.fn(),
        close: jest.fn(),
        version: '7.0',
        platform: 'android',
        themeParams: {},
        isExpanded: true
      }
    },
    writable: true
  });
});

// === Мокаем fetch с реальными данными из твоего приложения ===
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      events: [
        { id: 1, title: '123', event_day: '2025-12-20', event_time: '18:10', status: 'planned' },
        { id: 2, title: 'вебинар 2', event_day: '2025-12-24', event_time: '20:43', status: 'planned' },
        { id: 3, title: 'Тимбилдинг 1', event_day: '2025-12-25', event_time: '18:40', status: 'planned' }
      ],
      tasks: [
        { id: 1, title: 'разработать сайт', due_date: '2025-12-16', status: 'in_progress', event: { title: 'вебинар 2' } },
        { id: 2, title: 'придти на тимбилдинг', due_date: '2025-12-25', status: 'todo', event: { title: 'Тимбилдинг 1' } }
      ],
      finance_items: [],
      notes: []
    })
  })
);

describe('HomePage — интеграционные тесты (реальное поведение)', () => {
  const renderHomePage = () => {
    return render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
  };

  test('проходит авторизацию и показывает приветствие с именем', async () => {
    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText(/Добрый день, Николай/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('показывает правильное количество запланированных мероприятий', async () => {
    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText(/У вас запланировано 3 мероприятия/i)).toBeInTheDocument();
    });
  });

  test('отображает 3 ближайших события', async () => {
    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('123')).toBeInTheDocument();
      expect(screen.getByText('вебинар 2')).toBeInTheDocument();
      expect(screen.getByText('Тимбилдинг 1')).toBeInTheDocument();
    });
  });

  test('отображает срочные дедлайны (включая сегодняшний)', async () => {
    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('разработать сайт')).toBeInTheDocument();
      expect(screen.getByText(/Сегодня/i)).toBeInTheDocument(); // если есть метка "Сегодня"
    });
  });

  test('показывает количество срочных дедлайнов в виджете', async () => {
    renderHomePage();

    await waitFor(() => {
      // Если у тебя есть счётчик "1 Срочных дедлайнов" или "2"
      const urgentText = screen.getByText(/Срочных дедлайнов/i);
      expect(urgentText).toBeInTheDocument();
    });
  });
});
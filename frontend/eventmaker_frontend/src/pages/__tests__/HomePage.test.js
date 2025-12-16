import { render, screen } from '@testing-library/react';
import { HomePage } from '../HomePage';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router';

global.Telegram = {
  WebApp: {
    initDataUnsafe: {
      user: { id: 123456789, first_name: 'TestUser', username: 'testuser' }
    },
    ready: jest.fn(),
    expand: jest.fn(),
    close: jest.fn(),
    initData: 'valid_init_data' // Добавил, чтобы авторизация прошла
  }
};

describe('HomePage', () => {
  const renderWithRouter = (ui) => render(<Router>{ui}</Router>);

  test('рендерится без критических ошибок', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('EventPro') || screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  test('отображает логотип или заголовок приложения', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('EventPro')).toBeInTheDocument();
  });

  test('отображает мобильное меню', () => {
    renderWithRouter(<HomePage />);
    const dashboardLinks = screen.getAllByText('Дашборд');
    expect(dashboardLinks.length).toBeGreaterThan(0);
  });

  test('отображает кнопку создания события', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Новое событие')).toBeInTheDocument();
  });

  test('отображает навигацию', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText('Мероприятия') || screen.getByText('Заметки') || screen.getByText('Финансы')).toBeInTheDocument();
  });
});
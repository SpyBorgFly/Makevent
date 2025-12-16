import { render, screen, waitFor } from '@testing-library/react';
import { HomePage } from './HomePage';  // Путь к твоему файлу

jest.mock('window.Telegram.WebApp', () => ({ initDataUnsafe: { user: { id: 123, first_name: 'Test' } } }));  // Мок Telegram

test('renders loading state', () => {
  render(<HomePage />);
  expect(screen.getByText('Загрузка...')).toBeInTheDocument();
});
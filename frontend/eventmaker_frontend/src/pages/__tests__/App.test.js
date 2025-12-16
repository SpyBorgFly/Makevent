import { render, screen } from '@testing-library/react';
import App from '../../App';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router';

test('renders the app without errors', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  // Проверяем любой элемент, который точно есть всегда
  expect(screen.getByText('EventPro')).toBeInTheDocument();
});
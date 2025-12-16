from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from events.models import Event, Task, FinanceItem, Note, TelegramUser
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
import logging

logger = logging.getLogger(__name__)

class FullCRUDTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        # Полная очистка перед каждым тестом
        Event.objects.all().delete()
        Task.objects.all().delete()
        FinanceItem.objects.all().delete()
        Note.objects.all().delete()
        Token.objects.all().delete()

    def authenticate(self):
        response = self.client.post('/api/auth/telegram/', {
            "id": 123456789,
            "first_name": "TestUser",
            "username": "testuser"
        }, format='json')
        self.assertEqual(response.status_code, 200)
        token = response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)
        return response

    def test_1_telegram_auth(self):
        logger.info("\n" + "="*60)
        logger.info("ЗАПУСК ТЕСТА 1: Авторизация через Telegram")
        logger.info("="*60)
        response = self.authenticate()
        self.assertIn('token', response.data)
        self.assertEqual(response.data['status'], 'success')
        self.assertTrue(User.objects.filter(username='tg_123456789').exists())
        logger.info("ТЕСТ 1 ПРОЙДЕН УСПЕШНО!\n")

    def test_2_create_and_list_event(self):
        logger.info("\n" + "="*60)
        logger.info("ЗАПУСК ТЕСТА 2: Создание события и получение списка")
        logger.info("="*60)
        self.authenticate()

        Event.objects.all().delete()
        logger.info(f"После очистки: {Event.objects.count()} событий")

        data = {
            "title": "Конференция 2025",
            "description": "Большая IT-конференция",
            "event_day": "2025-12-25",
            "event_time": "10:00:00",
            "event_type": "conference",
            "status": "planned"
        }
        create_response = self.client.post('/api/events/', data, format='json')
        self.assertEqual(create_response.status_code, 201)
        logger.info(f"После создания: {Event.objects.count()} событий")

        list_response = self.client.get('/api/events/')
        self.assertEqual(list_response.status_code, 200)

        # Поддержка пагинации
        events = list_response.data.get('results', list_response.data)
        logger.info(f"В ответе API: {len(events)} событий")

        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]['title'], "Конференция 2025")
        logger.info("ТЕСТ 2 ПРОЙДЕН УСПЕШНО!\n")

    def test_3_create_task(self):
        logger.info("\n" + "="*60)
        logger.info("ЗАПУСК ТЕСТА 3: Создание задачи")
        logger.info("="*60)
        self.authenticate()
        event_response = self.client.post('/api/events/', {
            "title": "Событие для задач",
            "description": "Описание",
            "event_day": "2025-12-26",
            "event_time": "09:00:00",
            "event_type": "teambuilding",
            "status": "planned"
        }, format='json')
        event_id = event_response.data['id']

        task_data = {
            "event": event_id,
            "title": "Подготовка презентации",
            "priority": "high",
            "status": "todo"
        }
        response = self.client.post('/api/tasks/', task_data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Task.objects.count(), 1)
        logger.info("ТЕСТ 3 ПРОЙДЕН УСПЕШНО!\n")

    def test_4_create_finance_item(self):
        logger.info("\n" + "="*60)
        logger.info("ЗАПУСК ТЕСТА 4: Создание финансовой записи")
        logger.info("="*60)
        self.authenticate()
        event_response = self.client.post('/api/events/', {
            "title": "Финансовое событие",
            "description": "Описание",
            "event_day": "2025-12-27",
            "event_time": "12:00:00",
            "event_type": "webinar",
            "status": "planned"
        }, format='json')
        event_id = event_response.data['id']

        data = {
            "event": event_id,
            "title": "Аренда зала",
            "amount": "50000.00",
            "type": "expense",
            "date": "2025-12-16"
        }
        response = self.client.post('/api/finance-items/', data, format='json')
        self.assertEqual(response.status_code, 201)
        logger.info("ТЕСТ 4 ПРОЙДЕН УСПЕШНО!\n")

    def test_5_create_note(self):
        logger.info("\n" + "="*60)
        logger.info("ЗАПУСК ТЕСТА 5: Создание заметки")
        logger.info("="*60)
        self.authenticate()
        event_response = self.client.post('/api/events/', {
            "title": "Событие с заметками",
            "description": "Описание",
            "event_day": "2025-12-28",
            "event_time": "14:00:00",
            "event_type": "conference",
            "status": "planned"
        }, format='json')
        event_id = event_response.data['id']

        data = {
            "event": event_id,
            "title": "Идеи для спикеров",
            "content": "Пригласить известных разработчиков"
        }
        response = self.client.post('/api/notes/', data, format='json')
        self.assertEqual(response.status_code, 201)
        logger.info("ТЕСТ 5 ПРОЙДЕН УСПЕШНО!\n")

    def test_6_finance_report(self):
        logger.info("\n" + "="*60)
        logger.info("ЗАПУСК ТЕСТА 6: Финансовый отчёт")
        logger.info("="*60)
        self.test_4_create_finance_item()
        response = self.client.get('/api/finance/report/?period=month&year=2025&month=12')
        self.assertEqual(response.status_code, 200)
        self.assertIn('total_expenses', response.data)
        logger.info("ТЕСТ 6 ПРОЙДЕН УСПЕШНО!\n")

    def test_7_verify_token(self):
        logger.info("\n" + "="*60)
        logger.info("ЗАПУСК ТЕСТА 7: Проверка токена")
        logger.info("="*60)
        self.authenticate()
        response = self.client.get('/api/auth/verify/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['valid'])
        logger.info("ТЕСТ 7 ПРОЙДЕН УСПЕШНО!\n")

    def test_8_health_check(self):
        logger.info("\n" + "="*60)
        logger.info("ЗАПУСК ТЕСТА 8: Health check")
        logger.info("="*60)
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'ok')
        logger.info("ТЕСТ 8 ПРОЙДЕН УСПЕШНО!\n")
        logger.info("="*60)
        logger.info("ВСЕ 8 ТЕСТОВ ПРОЙДЕНЫ УСПЕШНО!")
        logger.info("="*60 + "\n")
    
    def test_9_update_event(self):
        logger.info("\n" + "="*60)
        logger.info("ЗАПУСК ТЕСТА 9: Обновление события")
        logger.info("="*60)
        self.authenticate()
        # Создаём событие
        create_response = self.client.post('/api/events/', {
            "title": "Старое название",
            "description": "Старое описание",
            "event_day": "2025-12-25",
            "event_time": "10:00:00",
            "event_type": "conference",
            "status": "planned"
        }, format='json')
        event_id = create_response.data['id']

        # Обновляем
        update_data = {
            "title": "Новое название",
            "description": "Новое описание"
        }
        update_response = self.client.patch(f'/api/events/{event_id}/', update_data, format='json')
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data['title'], "Новое название")
        logger.info("ТЕСТ 9 ПРОЙДЕН УСПЕШНО!\n")

    def test_10_delete_event(self):
        logger.info("\n" + "="*60)
        logger.info("ЗАПУСК ТЕСТА 10: Удаление события")
        logger.info("="*60)
        self.authenticate()
        create_response = self.client.post('/api/events/', {
            "title": "Событие на удаление",
            "description": "Будет удалено",
            "event_day": "2025-12-25",
            "event_time": "10:00:00",
            "event_type": "conference",
            "status": "planned"
        }, format='json')
        event_id = create_response.data['id']

        delete_response = self.client.delete(f'/api/events/{event_id}/')
        self.assertEqual(delete_response.status_code, 204)
        self.assertEqual(Event.objects.count(), 0)
        logger.info("ТЕСТ 10 ПРОЙДЕН УСПЕШНО!\n")
        logger.info("="*60)
        logger.info("ВСЕ 10 ТЕСТОВ ПРОЙДЕНЫ УСПЕШНО!")
        logger.info("="*60 + "\n")
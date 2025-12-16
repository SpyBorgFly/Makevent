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
        # Не трогаем User и TelegramUser — они нужны для авторизации

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
        response = self.authenticate()
        self.assertIn('token', response.data)
        self.assertEqual(response.data['status'], 'success')
        self.assertTrue(User.objects.filter(username='tg_123456789').exists())

    def test_2_create_and_list_event(self):
        """Тест создания события и получения списка — с логами и фильтрацией"""
        self.authenticate()

        logger.info(f"Перед очисткой: {Event.objects.count()} событий")

        # Полная очистка
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

        # Получаем список
        list_response = self.client.get('/api/events/')
        self.assertEqual(list_response.status_code, 200)
        logger.info(f"В ответе API: {len(list_response.data)} событий")

        # Проверяем, что вернулся ровно 1
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]['title'], "Конференция 2025")

    def test_3_create_task(self):
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

    def test_4_create_finance_item(self):
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

    def test_5_create_note(self):
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

    def test_6_finance_report(self):
        self.test_4_create_finance_item()
        response = self.client.get('/api/finance/report/?period=month&year=2025&month=12')
        self.assertEqual(response.status_code, 200)
        self.assertIn('total_expenses', response.data)

    def test_7_verify_token(self):
        self.authenticate()
        response = self.client.get('/api/auth/verify/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['valid'])

    def test_8_health_check(self):
        response = self.client.get('/api/health/')  # Твой URL
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'ok')
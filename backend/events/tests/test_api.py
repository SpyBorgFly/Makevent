# events/tests/test_api.py
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth.models import User
from .models import Event, TelegramUser

class AuthTests(APITestCase):
    def test_telegram_auth(self):
        url = '/api/auth/telegram/'  # или reverse('telegram-auth') если имя есть
        data = {
            "id": 999999,
            "first_name": "TestUser",
            "username": "testuser",
            "language_code": "ru"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertTrue(Token.objects.filter(user__username='tg_999999').exists())

class EventTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser')
        TelegramUser.objects.create(telegram_id=123, django_user=self.user)
        self.client.force_authenticate(user=self.user)

    def test_create_event(self):
        url = reverse('event-list')  # Проверь имя в urls.py, может быть 'events-list'
        data = {
            "title": "Тестовое событие",
            "event_day": "2025-12-25",
            "status": "planned"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Event.objects.count(), 1)

    def test_list_events(self):
        Event.objects.create(title="Событие 1", created_by=self.user, event_day="2025-12-20", status="planned")
        url = reverse('event-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
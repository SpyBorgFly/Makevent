from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Создаем роутер для автоматической генерации URL
router = DefaultRouter()
router.register(r'events', views.EventViewSet, basename='event')
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'notes', views.NoteViewSet, basename='note')
# ВАЖНО: Добавляем finance-items в роутер
router.register(r'finance-items', views.FinanceItemViewSet, basename='finance-item')

# Дополнительные маршруты (не через роутер)
urlpatterns = [
    # ============ АУТЕНТИФИКАЦИЯ И ПОЛЬЗОВАТЕЛИ ============
    path('auth/telegram/', views.telegram_auth, name='telegram_auth'),
    path('auth/simple-telegram/', views.simple_telegram_auth, name='simple_telegram_auth'),  # ← ДОБАВЛЕН ТЕСТОВЫЙ ЭНДПОИНТ
    path('user/me/', views.get_current_user, name='get_current_user'),
    path('auth/verify/', views.verify_token, name='verify_token'),  # ← ДОБАВЛЕН ЭНДПОИНТ ПРОВЕРКИ ТОКЕНА
    
    # ============ СИСТЕМНЫЕ И СТАТИСТИКА ============
    path('health/', views.health_check, name='health_check'),
    
    # ВАЖНО: Добавляем путь для финансового отчета
    path('finance/report/', views.finance_report, name='finance_report'),
]

# Добавляем все маршруты из роутера
urlpatterns += router.urls
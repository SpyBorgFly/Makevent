from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    EventViewSet,
    TaskViewSet,
    FinanceItemViewSet,
    NoteViewSet,
    finance_summary,     
)

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='events')
router.register(r'tasks', TaskViewSet, basename='tasks')
router.register(r'finance-items', FinanceItemViewSet, basename='financeitems')
router.register(r'notes', NoteViewSet, basename='notes')

urlpatterns = [
    path('', include(router.urls)),

    # 🔥 Новый финансовый аггрегирующий эндпоинт
    path('finance/summary/', finance_summary, name='finance-summary'),
]
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, TaskViewSet, FinanceItemViewSet, NoteViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='events')
router.register(r'tasks', TaskViewSet, basename='tasks')              
router.register(r'finance-items', FinanceItemViewSet, basename='financeitems')
router.register(r'notes', NoteViewSet)  # <-- добавляем роут для заметок

urlpatterns = [
    path('', include(router.urls)),
]

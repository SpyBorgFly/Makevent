from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, TaskViewSet, FinanceItemViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='events')
router.register(r'tasks', TaskViewSet, basename='tasks')              
router.register(r'finance-items', FinanceItemViewSet, basename='financeitems')

urlpatterns = [
    path('', include(router.urls)),
]

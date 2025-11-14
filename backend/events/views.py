from rest_framework import viewsets, status, mixins, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db import IntegrityError
import logging
from .models import Event, Task, FinanceItem
from .serializers import EventSerializer, TaskSerializer, FinanceItemSerializer

logger = logging.getLogger(__name__)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    def list(self, request):
        """Получить список всех событий"""
        events = Event.objects.all()
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

    def create(self, request):
        """Создать новое событие"""
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                # Создаем событие напрямую через модель, чтобы обойти ограничения
                from django.contrib.auth.models import User
                
                # Получаем или создаем системного пользователя
                system_user, created = User.objects.get_or_create(
                    username='system',
                    defaults={
                        'email': 'system@eventmaker.com',
                        'first_name': 'System',
                        'last_name': 'User',
                        'is_active': False
                    }
                )
                
                # Создаем событие с системным пользователем
                event = Event.objects.create(
                    title=serializer.validated_data['title'],
                    description=serializer.validated_data['description'],
                    date=serializer.validated_data['date'],
                    location=serializer.validated_data['location'],
                    created_by=system_user
                )
                
                # Возвращаем сериализованные данные
                response_serializer = EventSerializer(event)
                logger.info(f"Событие создано с ID: {event.id}")
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"Ошибки валидации: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Ошибка при создании события: {str(e)}")
            return Response(
                {'error': f'Ошибка при создании события: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        # Автоматически устанавливаем создателя события
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=['get'])
    def my_events(self, request):
        """Получить события текущего пользователя"""
        events = Event.objects.filter(created_by=request.user)
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def test(self, request):
        """Тестовый endpoint для проверки работы API"""
        return Response({
            'message': 'API работает!',
            'status': 'ok',
            'total_events': Event.objects.count()
        })
    
    # ---------- Tasks endpoints: /api/events/<pk>/tasks/ ----------
    @action(detail=True, methods=['get', 'post'])
    def tasks(self, request, pk=None):
        """
        GET: список задач для события
        POST: создать задачу для события
        """
        try:
            event = self.get_object()
        except Exception:
            return Response({'detail': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            tasks = event.tasks.all()
            serializer = TaskSerializer(tasks, many=True)
            return Response(serializer.data)

        # POST
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(event=event)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ---------- Finance endpoints: /api/events/<pk>/finance/ ----------
    @action(detail=True, methods=['get', 'post'])
    def finance(self, request, pk=None):
        """
        GET: список финансовых записей (трат/доходов) для события
        POST: создать финансовую запись для события
        """
        try:
            event = self.get_object()
        except Exception:
            return Response({'detail': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            items = event.finance_items.all()
            serializer = FinanceItemSerializer(items, many=True)
            return Response(serializer.data)

        serializer = FinanceItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(event=event, created_by=request.user if request.user.is_authenticated else None)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

class FinanceItemViewSet(viewsets.ModelViewSet):
    queryset = FinanceItem.objects.all()
    serializer_class = FinanceItemSerializer

    
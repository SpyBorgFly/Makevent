from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db import IntegrityError
import logging
from .models import Event
from .serializers import EventSerializer

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

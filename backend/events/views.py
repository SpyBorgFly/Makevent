from rest_framework import viewsets, status, mixins, generics, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db import IntegrityError
import logging
from .models import Event, Task, FinanceItem, Note
from .serializers import EventSerializer, TaskSerializer, FinanceItemSerializer , NoteSerializer
from datetime import datetime, timedelta
from django.db.models import Sum
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

logger = logging.getLogger(__name__)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    # ---- Фильтры ----
    filterset_fields = {
        'event_type': ['exact'],
        'status': ['exact'],
    }

    # ---- Сортировка ----
    ordering_fields = [
    'title',
    'event_type',
    'status',
    'event_day',
    'event_time',
    'updated_at',
    'created_at',
]
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
                event_day=serializer.validated_data['event_day'],
                event_time=serializer.validated_data['event_time'],
                event_type=serializer.validated_data['event_type'],
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

    
class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def finance_summary(request):
    user = request.user

    # Все транзакции пользователя
    qs = FinanceItem.objects.filter(event__created_by=user)

    # Суммы
    total_income = qs.filter(type="income").aggregate(total=Sum("amount"))["total"] or 0
    total_expenses = qs.filter(type="expense").aggregate(total=Sum("amount"))["total"] or 0
    net_total = total_income - total_expenses

    # Даты для анализа по месяцам
    today = datetime.today()
    month_ago = today - timedelta(days=30)
    prev_month_start = today - timedelta(days=60)
    prev_month_end = today - timedelta(days=30)

    # Текущий месяц
    month_income = qs.filter(type="income", date__gte=month_ago).aggregate(total=Sum("amount"))["total"] or 0
    month_expenses = qs.filter(type="expense", date__gte=month_ago).aggregate(total=Sum("amount"))["total"] or 0

    # Прошлый месяц (для процента изменения)
    prev_month_income = qs.filter(type="income", date__gte=prev_month_start, date__lt=prev_month_end).aggregate(total=Sum("amount"))["total"] or 0
    prev_month_expenses = qs.filter(type="expense", date__gte=prev_month_start, date__lt=prev_month_end).aggregate(total=Sum("amount"))["total"] or 0

    # Изменение в процентах
    def percent_change(current, previous):
        if previous == 0:
            return 0
        return round((current - previous) / previous, 3)

    month_income_change = percent_change(month_income, prev_month_income)
    month_expenses_change = percent_change(month_expenses, prev_month_expenses)

    # Бюджеты по событиям
    events_data = []
    for event in Event.objects.filter(created_by=user):
        income = event.finance_items.filter(type="income").aggregate(total=Sum("amount"))["total"] or 0
        expenses = event.finance_items.filter(type="expense").aggregate(total=Sum("amount"))["total"] or 0
        budget = income - expenses
        events_data.append({
            "event_id": event.id,
            "title": event.title,
            "budget": budget if (income or expenses) else None
        })

    return Response({
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_total": net_total,

        "month_income": month_income,
        "month_income_change": month_income_change,

        "month_expenses": month_expenses,
        "month_expenses_change": month_expenses_change,

        "events": events_data,
    })



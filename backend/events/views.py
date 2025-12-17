from rest_framework import viewsets, status
from rest_framework.filters import OrderingFilter
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
import logging
import json
from urllib.parse import parse_qs

from .models import Event, Task, FinanceItem, Note, TelegramUser
from .serializers import EventSerializer, TaskSerializer, FinanceItemSerializer, NoteSerializer, TelegramAuthSerializer
from django.db.models import Sum
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import filters
from django.utils import timezone
from datetime import date
from calendar import monthrange

# Настройка логирования
logger = logging.getLogger(__name__)

# Декоратор для логирования всех запросов
def log_request(view_func):
    def wrapper(self, request, *args, **kwargs):
        user_info = f"User: {request.user.username if request.user.is_authenticated else 'Anonymous'}"
        user_id = f"ID: {request.user.id if request.user.is_authenticated else 'None'}"
        
        auth_header = request.headers.get('Authorization', '')
        token_info = f"Token: {auth_header[:30]}..." if auth_header else "Token: None"
        
        logger.info(f"=== REQUEST START ===")
        logger.info(f"Path: {request.path}")
        logger.info(f"Method: {request.method}")
        logger.info(f"{user_info} ({user_id})")
        logger.info(f"{token_info}")
        logger.info(f"Time: {timezone.now()}")
        logger.info(f"View: {self.__class__.__name__}.{view_func.__name__}")
        
        try:
            response = view_func(self, request, *args, **kwargs)
            logger.info(f"Response Status: {response.status_code}")
            logger.info(f"=== REQUEST END ===\n")
            return response
        except Exception as e:
            logger.error(f"ERROR in {view_func.__name__}: {str(e)}")
            logger.info(f"=== REQUEST END WITH ERROR ===\n")
            raise
    return wrapper

# ============ TELEGRAM AUTHENTICATION ============

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
@authentication_classes([])  # Отключаем любую аутентификацию на этапе авторизации
def telegram_auth(request):
    """Аутентификация через Telegram Web App"""
    try:
        logger.info(f"=== TELEGRAM AUTH REQUEST ===")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"Headers: {dict(request.headers)}")
        
        if hasattr(request, 'data'):
            logger.info(f"Request data type: {type(request.data)}")
            logger.info(f"Request data keys: {list(request.data.keys()) if isinstance(request.data, dict) else 'Not a dict'}")
        
        if 'initData' in request.data:
            logger.info(f"Processing initData authentication")
            serializer = TelegramAuthSerializer(data=request.data)
            if not serializer.is_valid():
                logger.warning(f"Invalid serializer: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            init_data = serializer.validated_data['initData']
            logger.info(f"InitData received (length: {len(init_data)})")
            user_data = parse_telegram_data_simple(init_data)
        else:
            logger.info(f"Processing direct user data authentication")
            user_data = {
                'id': request.data.get('id'),
                'username': request.data.get('username'),
                'first_name': request.data.get('first_name'),
                'last_name': request.data.get('last_name'),
                'language_code': request.data.get('language_code'),
                'is_premium': request.data.get('is_premium', False),
            }
            logger.info(f"Direct user data: {user_data}")
        
        if not user_data or 'id' not in user_data:
            logger.warning("No user data in Telegram response")
            return Response({'error': 'No user data in Telegram response'}, status=status.HTTP_400_BAD_REQUEST)
        
        telegram_id = user_data.get('id')
        logger.info(f"Telegram auth attempt for ID: {telegram_id}")
        
        telegram_user, created = TelegramUser.objects.get_or_create(
            telegram_id=telegram_id,
            defaults={
                'username': user_data.get('username', ''),
                'first_name': user_data.get('first_name', ''),
                'last_name': user_data.get('last_name', ''),
                'language_code': user_data.get('language_code', ''),
                'is_premium': user_data.get('is_premium', False),
            }
        )
        
        # ИСПРАВЛЕНО: используем .pk (всегда работает) и .telegram_id
        logger.info(f"TelegramUser: {'Created' if created else 'Exists'} (Telegram ID: {telegram_user.telegram_id}, Django PK: {telegram_user.pk})")
        
        if not created:
            telegram_user.username = user_data.get('username', telegram_user.username)
            telegram_user.first_name = user_data.get('first_name', telegram_user.first_name)
            telegram_user.last_name = user_data.get('last_name', telegram_user.last_name)
            telegram_user.language_code = user_data.get('language_code', telegram_user.language_code)
            telegram_user.is_premium = user_data.get('is_premium', telegram_user.is_premium)
            telegram_user.save()
        
        if not telegram_user.django_user:
            username = f"tg_{telegram_user.telegram_id}"
            logger.info(f"Creating Django user: {username}")
            try:
                django_user = User.objects.get(username=username)
                logger.info(f"Django user already exists: {django_user.id}")
            except User.DoesNotExist:
                django_user = User.objects.create_user(
                    username=username,
                    password=None,
                    first_name=telegram_user.first_name or '',
                    last_name=telegram_user.last_name or '',
                    email=f"{telegram_user.telegram_id}@telegram.user",
                    is_active=True
                )
                logger.info(f"Django user created: {django_user.id}")
            telegram_user.django_user = django_user
            telegram_user.save()
        
        Token.objects.filter(user=telegram_user.django_user).delete()
        token = Token.objects.create(user=telegram_user.django_user)
        logger.info(f"Token created: {token.key[:20]}... for user {telegram_user.django_user.username}")
        
        response_data = {
            'status': 'success',
            'message': 'Authentication successful',
            'user': {
                'id': telegram_user.django_user.id,
                'username': telegram_user.django_user.username,
                'first_name': telegram_user.first_name,
                'last_name': telegram_user.last_name,
            },
            'telegram_user': {
                'telegram_id': telegram_user.telegram_id,
                'username': telegram_user.username,
                'first_name': telegram_user.first_name,
            },
            'token': token.key,
            'token_type': 'Token',
            'created': created
        }
        
        logger.info(f"Auth successful, returning token")
        logger.info(f"=== TELEGRAM AUTH END ===\n")
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Telegram auth error: {str(e)}", exc_info=True)
        return Response({'error': f'Internal server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def parse_telegram_data_simple(init_data: str) -> dict:
    try:
        parsed_data = parse_qs(init_data)
        user_str = parsed_data.get('user', [''])[0]
        if user_str:
            return json.loads(user_str)
    except Exception as e:
        logger.error(f"Telegram parsing error: {str(e)}")
    return {}

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
@authentication_classes([])
def simple_telegram_auth(request):
    logger.info(f"=== SIMPLE TELEGRAM AUTH (для тестирования) ===")
    logger.info(f"Request data: {request.data}")
    
    try:
        user, created = User.objects.get_or_create(
            username="mobile_test_user",
            defaults={
                'first_name': 'Mobile',
                'last_name': 'Test',
                'is_active': True
            }
        )
        
        token, _ = Token.objects.get_or_create(user=user)
        
        logger.info(f"Test user: {user.username}, Token: {token.key[:20]}...")
        
        return Response({
            'status': 'success',
            'message': 'Test authentication for mobile',
            'user': {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'token': token.key,
            'token_type': 'Token',
            'is_test': True
        })
    except Exception as e:
        logger.error(f"Simple auth error: {str(e)}")
        return Response({'error': f'Test auth error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    logger.info(f"Get current user: {request.user.username} (ID: {request.user.id})")
    try:
        user = request.user
        telegram_data = None
        try:
            telegram_profile = TelegramUser.objects.get(django_user=user)
            telegram_data = {
                'telegram_id': telegram_profile.telegram_id,
                'username': telegram_profile.username,
                'first_name': telegram_profile.first_name,
                'last_name': telegram_profile.last_name,
            }
        except TelegramUser.DoesNotExist:
            pass
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'telegram_profile': telegram_data
        })
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def verify_token(request):
    logger.info(f"Token verification for user: {request.user.username}")
    return Response({
        'valid': True,
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'first_name': request.user.first_name,
        }
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    logger.info("Health check request")
    return Response({
        'status': 'ok',
        'service': 'EventMaker Backend',
        'timestamp': timezone.now().isoformat(),
    })

# ============ VIEWSETS ============

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    filter_backends = [DjangoFilterBackend, OrderingFilter]  # ← ИСПРАВЛЕНО
    
    filterset_fields = {
        'event_type': ['exact'],
        'status': ['exact'],
    }

    ordering_fields = [
        'title',
        'event_type',
        'status',
        'event_day',
        'event_time',
        'updated_at',
        'created_at',
    ]
    
    @log_request
    def list(self, request, *args, **kwargs):
        logger.info(f"List events for user {request.user.id} ({request.user.username})")
        return super().list(request, *args, **kwargs)
    
    @log_request
    def create(self, request, *args, **kwargs):
        logger.info(f"Create event by user {request.user.id}")
        logger.info(f"Request data: {request.data}")
        return super().create(request, *args, **kwargs)
    
    @log_request
    def retrieve(self, request, *args, **kwargs):
        event_id = kwargs.get('pk')
        logger.info(f"Retrieve event {event_id} by user {request.user.id}")
        return super().retrieve(request, *args, **kwargs)
    
    @log_request 
    def destroy(self, request, *args, **kwargs):
        event_id = kwargs.get('pk')
        logger.info(f"Delete event {event_id} by user {request.user.id}")
        return super().destroy(request, *args, **kwargs)
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            events = Event.objects.filter(created_by=self.request.user)
            logger.debug(f"Returning {events.count()} events for user {self.request.user.id}")
            return events
        return Event.objects.none()

    def perform_create(self, serializer):
        logger.info(f"Setting created_by to user {self.request.user.id}")
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def my_events(self, request):
        events = Event.objects.filter(created_by=request.user)
        logger.info(f"my_events: {events.count()} events for user {request.user.id}")
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def test(self, request):
        logger.info(f"Test endpoint called by {request.user.username}")
        return Response({
            'message': 'API работает!',
            'status': 'ok',
            'user': request.user.username if request.user.is_authenticated else 'anonymous',
            'total_events': Event.objects.filter(created_by=request.user).count() if request.user.is_authenticated else 0
        })
    
    @action(detail=True, methods=['get', 'post'])
    def tasks(self, request, pk=None):
        logger.info(f"Event tasks for event {pk} by user {request.user.id}")
        try:
            event = self.get_object()
            if event.created_by != request.user:
                logger.warning(f"User {request.user.id} tried to access event {pk} owned by {event.created_by.id}")
                return Response({'detail': 'У вас нет доступа к этому событию'}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            logger.warning(f"Event {pk} not found")
            return Response({'detail': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            tasks = event.tasks.all()
            logger.info(f"Returning {tasks.count()} tasks for event {pk}")
            serializer = TaskSerializer(tasks, many=True)
            return Response(serializer.data)

        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(event=event)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.warning(f"Task creation validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'])
    def finance(self, request, pk=None):
        logger.info(f"Event finance for event {pk} by user {request.user.id}")
        try:
            event = self.get_object()
            if event.created_by != request.user:
                logger.warning(f"User {request.user.id} tried to access finance for event {pk} owned by {event.created_by.id}")
                return Response({'detail': 'У вас нет доступа к этому событию'}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            logger.warning(f"Event {pk} not found")
            return Response({'detail': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            items = event.finance_items.all()
            logger.info(f"Returning {items.count()} finance items for event {pk}")
            serializer = FinanceItemSerializer(items, many=True)
            return Response(serializer.data)

        serializer = FinanceItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(event=event, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.warning(f"Finance creation validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    @log_request
    def list(self, request, *args, **kwargs):
        logger.info(f"List tasks for user {request.user.id}")
        return super().list(request, *args, **kwargs)
    
    @log_request
    def create(self, request, *args, **kwargs):
        logger.info(f"Create task by user {request.user.id}")
        return super().create(request, *args, **kwargs)
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            tasks = Task.objects.filter(event__created_by=self.request.user)
            logger.debug(f"Returning {tasks.count()} tasks for user {self.request.user.id}")
            return tasks
        return Task.objects.none()

class FinanceItemViewSet(viewsets.ModelViewSet):
    queryset = FinanceItem.objects.all()
    serializer_class = FinanceItemSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    @log_request
    def list(self, request, *args, **kwargs):
        logger.info(f"List finance items for user {request.user.id}")
        return super().list(request, *args, **kwargs)
    
    @log_request
    def create(self, request, *args, **kwargs):
        logger.info(f"Create finance item by user {request.user.id}")
        return super().create(request, *args, **kwargs)
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            items = FinanceItem.objects.filter(created_by=self.request.user)
            logger.debug(f"Returning {items.count()} finance items for user {self.request.user.id}")
            return items
        return FinanceItem.objects.none()
    
    def perform_create(self, serializer):
        logger.info(f"Setting created_by to user {self.request.user.id} for finance item")
        serializer.save(created_by=self.request.user)  # ← Добавлено!

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    @log_request
    def list(self, request, *args, **kwargs):
        logger.info(f"List notes for user {request.user.id}")
        return super().list(request, *args, **kwargs)
    
    @log_request
    def create(self, request, *args, **kwargs):
        logger.info(f"Create note by user {request.user.id}")
        return super().create(request, *args, **kwargs)
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            notes = Note.objects.filter(created_by=self.request.user)
            logger.debug(f"Returning {notes.count()} notes for user {self.request.user.id}")
            return notes
        return Note.objects.none()
    
    def perform_create(self, serializer):
        logger.info(f"Setting created_by to user {self.request.user.id} for note")
        serializer.save(created_by=self.request.user)  

@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def finance_report(request):
    logger.info(f"Finance report requested by user {request.user.id}")
    
    qs = FinanceItem.objects.filter(created_by=request.user)

    event_id = request.GET.get("event_id")
    if event_id:
        logger.info(f"Filtering by event: {event_id}")
        qs = qs.filter(event_id=event_id)

    period = request.GET.get("period")
    logger.info(f"Report period: {period}")

    if period == "month":
        year = int(request.GET.get("year"))
        month = int(request.GET.get("month"))
        start = date(year, month, 1)
        end = date(year, month, monthrange(year, month)[1])

    elif period == "year":
        year = int(request.GET.get("year"))
        start = date(year, 1, 1)
        end = date(year, 12, 31)

    elif period == "custom":
        start = request.GET.get("date_from")
        end = request.GET.get("date_to")
    else:
        logger.warning(f"Invalid period: {period}")
        return Response({"error": "Invalid period"}, status=400)

    qs = qs.filter(date__gte=start, date__lte=end)
    logger.info(f"Report query: {qs.count()} items")

    income = qs.filter(type="income").aggregate(total=Sum("amount"))["total"] or 0
    expenses = qs.filter(type="expense").aggregate(total=Sum("amount"))["total"] or 0
    
    logger.info(f"Report results: income={income}, expenses={expenses}, balance={income - expenses}")

    return Response({
        "period": period,
        "date_from": start,
        "date_to": end,
        "event": event_id,
        "total_income": income,
        "total_expenses": expenses,
        "balance": income - expenses
    })

# ============ ERROR HANDLERS ============

def bad_request(request, exception=None):
    from django.http import JsonResponse
    logger.error(f"Bad request: {request.path}")
    return JsonResponse({'error': 'Bad Request', 'status_code': 400}, status=400)

def permission_denied(request, exception=None):
    from django.http import JsonResponse
    logger.warning(f"Permission denied: {request.path} - {exception}")
    return JsonResponse({'error': 'Permission Denied', 'status_code': 403}, status=403)

def page_not_found(request, exception):
    from django.http import JsonResponse
    logger.warning(f"Page not found: {request.path}")
    return JsonResponse({'error': 'Page Not Found', 'status_code': 404, 'path': request.path}, status=404)

def server_error(request):
    from django.http import JsonResponse
    logger.error("Internal server error")
    return JsonResponse({'error': 'Internal Server Error', 'status_code': 500}, status=500)


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def setup_event_notifications(request, event_id):
    """API для автоматической настройки уведомлений при создании события"""
    try:
        event = Event.objects.get(id=event_id, created_by=request.user)
        
        # Получаем Telegram пользователя
        telegram_user = TelegramUser.objects.filter(django_user=request.user).first()
        if not telegram_user:
            return Response({'error': 'Telegram user not found'}, status=400)
        
        # Здесь можно вызвать функцию настройки уведомлений
        # В реальности нужно запустить асинхронную задачу
        return Response({
            'success': True,
            'message': 'Уведомления будут настроены',
            'event_id': event.id
        })
        
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=404)
    except Exception as e:
        logger.error(f"Error setting up notifications: {e}")
        return Response({'error': str(e)}, status=500)
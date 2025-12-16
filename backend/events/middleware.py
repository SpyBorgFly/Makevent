import logging
from django.utils import timezone
import json

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Начало обработки запроса
        start_time = timezone.now()
        
        # Запоминаем IP и метод для логирования
        client_ip = request.META.get('REMOTE_ADDR', 'Unknown')
        method = request.method
        path = request.path
        
        # Логируем входящий запрос (простой формат без эмодзи)
        logger.info(f"[REQUEST START] {method} {path} | IP: {client_ip}")
        
        # Логируем заголовок Authorization если есть
        auth_header = request.headers.get('Authorization', '')
        if auth_header:
            token_preview = auth_header[:50] + "..." if len(auth_header) > 50 else auth_header
            logger.info(f"Authorization: {token_preview}")
        
        # Логируем тело запроса для POST/PUT/PATCH
        if method in ['POST', 'PUT', 'PATCH']:
            try:
                body = request.body.decode('utf-8')
                if body and len(body) > 0:
                    # Логируем первые 200 символов тела запроса
                    logger.info(f"Request Body (first 200 chars): {body[:200]}")
            except Exception:
                logger.info("Request Body: [Cannot decode or empty]")
        
        # Обрабатываем запрос
        response = self.get_response(request)
        
        # После обработки получаем актуальную информацию о пользователе
        user_info = "Anonymous"
        user_id = "None"
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_info = request.user.username
            user_id = request.user.id
        
        # Логируем ответ
        end_time = timezone.now()
        duration = (end_time - start_time).total_seconds()
        
        logger.info(f"[REQUEST END] {method} {path} | Status: {response.status_code} | Duration: {duration:.3f}s | User: {user_info} (ID: {user_id})")
        
        return response



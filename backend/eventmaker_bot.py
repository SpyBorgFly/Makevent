"""
EventMaker Telegram Bot - РАБОЧИЙ БОТ УВЕДОМЛЕНИЙ (ПОЛНАЯ ВЕРСИЯ)
"""
import os
import sys
import logging
import asyncio
from datetime import datetime, timedelta
import threading
from typing import Optional
from io import BytesIO

# Настройка Django ДО импорта telegram
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventmaker_backend.settings')

import django
django.setup()

# Теперь можно безопасно импортировать модели
from django.contrib.auth.models import User
from events.models import Task, NotificationSettings, TelegramUser
from django.utils import timezone
from django.db.models import Q

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, Bot
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from telegram.constants import ParseMode
from telegram.error import TelegramError

# Используем sync_to_async для Django ORM
from django.core.exceptions import ObjectDoesNotExist
from asgiref.sync import sync_to_async

# Для генерации iCal
from icalendar import Calendar, Event

# ============ КОНФИГУРАЦИЯ ============
BOT_TOKEN = "8044102940:AAFLL-CLGeJa34HhZEopCstf1U1bnRxUKHE"
CHECK_INTERVAL = 3600 * 24  # Проверять каждые 24 часа (86400 секунд)

# ============ НАСТРОЙКА ЛОГИРОВАНИЯ ============
# Функция для обработки Unicode в Windows
def configure_logging():
    class SafeStreamHandler(logging.StreamHandler):
        def emit(self, record):
            try:
                msg = self.format(record)
                stream = self.stream
                stream.write(msg + self.terminator)
                stream.flush()
            except UnicodeEncodeError:
                # Заменяем эмодзи на ASCII
                msg = self.format(record)
                safe_msg = msg.encode('utf-8', errors='replace').decode('utf-8')
                stream = self.stream
                stream.write(safe_msg + self.terminator)
                stream.flush()

    logging.basicConfig(
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        level=logging.INFO,
        handlers=[
            logging.FileHandler('eventmaker_bot.log', encoding='utf-8'),
            SafeStreamHandler(sys.stdout)
        ]
    )

configure_logging()
logger = logging.getLogger(__name__)

# ============ БОТ ============
bot = Bot(token=BOT_TOKEN)

# ============ АСИНХРОННЫЕ ФУНКЦИИ ============

@sync_to_async
def get_or_create_notification_settings(user):
    settings, created = NotificationSettings.objects.get_or_create(user=user)
    return settings

@sync_to_async
def get_telegram_user(telegram_id):
    try:
        return TelegramUser.objects.select_related('django_user').get(telegram_id=telegram_id)
    except TelegramUser.DoesNotExist:
        return None

@sync_to_async
def get_user_tasks(user):
    return list(Task.objects.filter(
        event__created_by=user,
        due_date__isnull=False,
        is_completed=False,
        status__in=['todo', 'in_progress']
    ).select_related('event'))

@sync_to_async
def get_users_with_settings():
    return list(User.objects.filter(
        notification_settings__isnull=False
    ).prefetch_related('notification_settings'))

@sync_to_async
def get_user_tasks_with_settings(user):
    today = timezone.now().date()
    week_later = today + timedelta(days=7)
    
    return list(Task.objects.filter(
        event__created_by=user,
        due_date__isnull=False,
        is_completed=False
    ).order_by('due_date')[:10])

@sync_to_async
def get_user_tasks_for_calendar(user):
    # Берём задачи на 30 дней вперёд
    now = timezone.now()
    end_date = now + timedelta(days=30)
    return list(Task.objects.filter(
        event__created_by=user,
        due_date__isnull=False,
        due_date__lte=end_date,
        is_completed=False
    ).select_related('event'))

@sync_to_async
def save_chat_id(user, chat_id):
    settings, created = NotificationSettings.objects.get_or_create(user=user)
    settings.telegram_chat_id = str(chat_id)
    settings.save()

@sync_to_async
def get_notification_settings(user):
    try:
        return NotificationSettings.objects.get(user=user)
    except NotificationSettings.DoesNotExist:
        return None

@sync_to_async
def update_notification_setting(user, field, value):
    settings, created = NotificationSettings.objects.get_or_create(user=user)
    setattr(settings, field, value)
    settings.save()

# ============ ОСНОВНЫЕ ФУНКЦИИ ============

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start - начало работы"""
    user = update.effective_user
    chat_id = update.effective_chat.id
    
    try:
        telegram_user = await get_telegram_user(user.id)
        
        if telegram_user and telegram_user.django_user:
            await save_chat_id(telegram_user.django_user, chat_id)
            logger.info(f"Сохранён chat_id {chat_id} для {telegram_user.django_user.username}")
            
    except Exception as e:
        logger.error(f"Ошибка сохранения chat_id: {e}")
    
    welcome_text = (
        f"👋 Привет, {user.first_name}!\n\n"
        f"🤖 <b>EventMaker Bot</b>\n\n"
        f"📊 Ваш ID: <code>{user.id}</code>\n"
        f"💬 Chat ID: <code>{chat_id}</code>\n\n"
        f"Я буду напоминать о дедлайнах:\n"
        f"✅ За 3 дня до срока\n"
        f"✅ За 1 день до срока\n\n"
        f"Команды:\n"
        f"/start — эта информация\n"
        f"/settings — настройки уведомлений\n"
        f"/calendar — задачи в календарь\n"
        f"/test — тест уведомления\n"
        f"/mytasks — мои задачи\n"
        f"/help — помощь\n\n"
        f"⚡ <b>Автопроверка:</b> Раз в {CHECK_INTERVAL//3600} часа\n"
        f"🔔 <b>Уведомления:</b> Автоматически"
    )
    
    await update.message.reply_text(welcome_text, parse_mode='HTML')

async def settings_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /settings - настройки уведомлений"""
    user = update.effective_user
    
    try:
        telegram_user = await get_telegram_user(user.id)
        
        if telegram_user and telegram_user.django_user:
            settings = await get_notification_settings(telegram_user.django_user)
            
            if settings:
                keyboard = [
                    [
                        InlineKeyboardButton(
                            "✅ За 3 дня" if settings.notify_3_days else "❌ За 3 дня",
                            callback_data="toggle_3"
                        ),
                        InlineKeyboardButton(
                            "✅ За 1 день" if settings.notify_1_day else "❌ За 1 день",
                            callback_data="toggle_1"
                        )
                    ],
                    [
                        InlineKeyboardButton(
                            "🔕 Выключить" if settings.enabled else "🔔 Включить",
                            callback_data="toggle_all"
                        )
                    ],
                    [
                        InlineKeyboardButton("🔄 Проверить сейчас", callback_data="check_now")
                    ]
                ]
                
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                status_text = (
                    f"⚙️ <b>Настройки уведомлений</b>\n\n"
                    f"👤 Пользователь: {telegram_user.django_user.username}\n"
                    f"💬 Chat ID: <code>{settings.telegram_chat_id or 'не настроен'}</code>\n\n"
                    f"<b>Статус:</b>\n"
                    f"• Уведомления: {'✅ ВКЛ' if settings.enabled else '❌ ВЫКЛ'}\n"
                    f"• За 3 дня: {'✅ ВКЛ' if settings.notify_3_days else '❌ ВЫКЛ'}\n"
                    f"• За 1 день: {'✅ ВКЛ' if settings.notify_1_day else '❌ ВЫКЛ'}\n\n"
                    f"_Нажмите кнопку для изменения_"
                )
                
                await update.message.reply_text(
                    status_text, 
                    reply_markup=reply_markup, 
                    parse_mode='HTML'
                )
            else:
                await update.message.reply_text(
                    "❌ <b>Настройки не найдены!</b>\n\n"
                    "Сначала войдите в мини-апп:\n"
                    "1. Откройте @EventMakerBot\n"
                    "2. Нажмите 'Запустить приложение'\n"
                    "3. Создайте тестовое событие\n"
                    "4. Вернитесь сюда\n\n"
                    f"Ваш Telegram ID: <code>{user.id}</code>",
                    parse_mode='HTML'
                )
        else:
            await update.message.reply_text(
                "❌ <b>Пользователь не найден!</b>\n\n"
                "Сначала войдите в мини-апп:\n"
                "1. Откройте @EventMakerBot\n"
                "2. Нажмите 'Запустить приложение'\n"
                "3. Создайте тестовое событие\n"
                "4. Вернитесь сюда\n\n"
                f"Ваш Telegram ID: <code>{user.id}</code>",
                parse_mode='HTML'
            )
            
    except Exception as e:
        logger.error(f"Ошибка в /settings: {e}")
        await update.message.reply_text("❌ Ошибка загрузки настроек")

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик кнопок"""
    query = update.callback_query
    await query.answer()
    data = query.data
    user_id = query.from_user.id
    
    try:
        telegram_user = await get_telegram_user(user_id)
        
        if telegram_user and telegram_user.django_user:
            settings = await get_notification_settings(telegram_user.django_user)
            
            if not settings:
                await query.answer("❌ Сначала напишите /start")
                return
            
            if data == "toggle_3":
                settings.notify_3_days = not settings.notify_3_days
                status = "ВКЛ" if settings.notify_3_days else "ВЫКЛ"
                await query.answer(f"Уведомления за 3 дня: {status}")
                
            elif data == "toggle_1":
                settings.notify_1_day = not settings.notify_1_day
                status = "ВКЛ" if settings.notify_1_day else "ВЫКЛ"
                await query.answer(f"Уведомления за 1 день: {status}")
                
            elif data == "toggle_all":
                settings.enabled = not settings.enabled
                status = "ВКЛ" if settings.enabled else "ВЫКЛ"
                await query.answer(f"Уведомления: {status}")
                
            elif data == "check_now":
                await query.answer("⏳ Проверяю дедлайны...")
                # Запускаем проверку в фоне
                asyncio.create_task(check_and_send_for_user(telegram_user.django_user))
                return
            
            await sync_to_async(settings.save)()
            
            # Обновляем сообщение
            keyboard = [
                [
                    InlineKeyboardButton(
                        "✅ За 3 дня" if settings.notify_3_days else "❌ За 3 дня",
                        callback_data="toggle_3"
                    ),
                    InlineKeyboardButton(
                        "✅ За 1 день" if settings.notify_1_day else "❌ За 1 день",
                        callback_data="toggle_1"
                    )
                ],
                [
                    InlineKeyboardButton(
                        "🔕 Выключить" if settings.enabled else "🔔 Включить",
                        callback_data="toggle_all"
                    )
                ],
                [
                    InlineKeyboardButton("🔄 Проверить сейчас", callback_data="check_now")
                ]
            ]
            
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            status_text = (
                f"⚙️ <b>Настройки уведомлений</b>\n\n"
                f"👤 Пользователь: {telegram_user.django_user.username}\n"
                f"💬 Chat ID: <code>{settings.telegram_chat_id or 'не настроен'}</code>\n\n"
                f"<b>Статус:</b>\n"
                f"• Уведомления: {'✅ ВКЛ' if settings.enabled else '❌ ВЫКЛ'}\n"
                f"• За 3 дня: {'✅ ВКЛ' if settings.notify_3_days else '❌ ВЫКЛ'}\n"
                f"• За 1 день: {'✅ ВКЛ' if settings.notify_1_day else '❌ ВЫКЛ'}\n\n"
                f"_Нажмите кнопку для изменения_"
            )
            
            await query.edit_message_text(
                status_text, 
                reply_markup=reply_markup, 
                parse_mode='HTML'
            )
            
        else:
            await query.answer("❌ Сначала напишите /start")
            
    except Exception as e:
        logger.error(f"Ошибка обработки кнопки: {e}")
        await query.answer("❌ Ошибка")

async def send_notification(chat_id: str, task, days_left: int):
    """Отправляет уведомление в Telegram"""
    try:
        if days_left == 1:
            emoji = "⏰"
            text = "ЗАВТРА ДЕДЛАЙН!"
        else:  # 3 дня
            emoji = "📅"
            text = "ЧЕРЕЗ 3 ДНЯ ДЕДЛАЙН"
        
        message = (
            f"{emoji} <b>{text}</b>\n\n"
            f"📝 <b>Задача:</b> {task.title}\n"
            f"📅 <b>Дедлайн:</b> {task.due_date.strftime('%d.%m.%Y %H:%M')}\n"
            f"📋 <b>Событие:</b> {await sync_to_async(lambda: task.event.title if task.event else 'Без события')()}\n"
            f"📊 <b>Статус:</b> {await sync_to_async(lambda: task.get_status_display())()}\n"
            f"🚨 <b>Приоритет:</b> {await sync_to_async(lambda: task.get_priority_display())()}\n\n"
            f"Не забудьте выполнить задачу вовремя!"
        )
        
        await bot.send_message(
            chat_id=chat_id,
            text=message,
            parse_mode=ParseMode.HTML,
            disable_web_page_preview=True
        )
        
        logger.info(f"Уведомление отправлено в {chat_id} для задачи {task.id}")
        
    except Exception as e:
        logger.error(f"Ошибка отправки уведомления: {e}")

async def check_and_send_for_user(user):
    """Проверяет и отправляет уведомления для конкретного пользователя"""
    try:
        today = timezone.now().date()
        
        # Получаем настройки пользователя
        settings = await get_notification_settings(user)
        
        if not settings or not settings.enabled or not settings.telegram_chat_id:
            return
        
        tasks = await get_user_tasks(user)
        
        notifications_sent = 0
        
        for task in tasks:
            task_date = task.due_date.date()
            days_left = (task_date - today).days
            
            # Проверяем условия
            if days_left == 3 and settings.notify_3_days:
                await send_notification(settings.telegram_chat_id, task, 3)
                notifications_sent += 1
                
            elif days_left == 1 and settings.notify_1_day:
                await send_notification(settings.telegram_chat_id, task, 1)
                notifications_sent += 1
        
        if notifications_sent > 0:
            logger.info(f"Отправлено {notifications_sent} уведомлений для {user.username}")
        
    except Exception as e:
        logger.error(f"Ошибка проверки для пользователя {user.username}: {e}")

async def check_all_deadlines():
    """Проверяет все дедлайны для всех пользователей"""
    try:
        logger.info(f"🔍 Автопроверка дедлайнов в {datetime.now().strftime('%H:%M:%S')}")
        
        users_with_settings = await get_users_with_settings()
        
        for user in users_with_settings:
            await check_and_send_for_user(user)
        
        logger.info("✅ Автопроверка завершена")
        
    except Exception as e:
        logger.error(f"Ошибка автопроверки: {e}")

async def test_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /test - тестовое уведомление"""
    user = update.effective_user
    
    test_message = (
        "🧪 <b>ТЕСТОВОЕ УВЕДОМЛЕНИЕ</b>\n\n"
        "📝 Задача: Проверить работу бота\n"
        "📅 Время: Сейчас\n"
        "✅ Тест пройден успешно!\n\n"
        f"Ваш Telegram ID: <code>{user.id}</code>\n"
        f"Chat ID: <code>{update.effective_chat.id}</code>\n\n"
        "_Если видите это, бот работает корректно_"
    )
    
    await update.message.reply_text(test_message, parse_mode='HTML')
    logger.info(f"Тестовое уведомление отправлено пользователю {user.username}")

async def mytasks_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /mytasks - показывает задачи пользователя"""
    user = update.effective_user
    
    try:
        telegram_user = await get_telegram_user(user.id)
        
        if telegram_user and telegram_user.django_user:
            today = timezone.now().date()
            
            # ИСПРАВЛЕНО: вызываем через sync_to_async
            tasks = await get_user_tasks_with_settings(telegram_user.django_user)
            
            if tasks:
                text = "📋 <b>Ваши задачи с дедлайнами:</b>\n\n"
                
                for task in tasks:
                    due_date = task.due_date.date()
                    days_left = (due_date - today).days
                    
                    if days_left < 0:
                        status = "❌ ПРОСРОЧЕНО"
                        emoji = "⚠️"
                    elif days_left == 0:
                        status = "⏰ СЕГОДНЯ!"
                        emoji = "🚨"
                    elif days_left == 1:
                        status = "ЗАВТРА"
                        emoji = "⏰"
                    elif days_left <= 3:
                        status = f"ЧЕРЕЗ {days_left} ДНЯ"
                        emoji = "📅"
                    else:
                        status = f"ЧЕРЕЗ {days_left} ДНЕЙ"
                        emoji = "📝"
                    
                    # Оборачиваем обращение к связанному полю event
                    event_title = await sync_to_async(lambda: task.event.title if task.event else 'Без события')()
                    
                    text += (
                        f"{emoji} <b>{task.title}</b>\n"
                        f"📅 {due_date.strftime('%d.%m.%Y')} ({status})\n"
                        f"📋 Событие: {event_title}\n"
                        f"🚨 Приоритет: {await sync_to_async(lambda: task.get_priority_display())()}\n"
                        f"📊 Статус: {await sync_to_async(lambda: task.get_status_display())()}\n\n"
                    )
            else:
                text = "🎉 <b>Отлично!</b>\n\nУ вас нет задач с дедлайнами."
            
            await update.message.reply_text(text, parse_mode='HTML')
            
        else:
            await update.message.reply_text(
                "❌ Сначала войдите в мини-апп Telegram!"
            )
            
    except Exception as e:
        logger.error(f"Ошибка в /mytasks: {e}")
        await update.message.reply_text("❌ Ошибка загрузки задач")

async def calendar_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /calendar - генерирует iCal файл с задачами"""
    user = update.effective_user
    telegram_user = await get_telegram_user(user.id)
    
    if not (telegram_user and telegram_user.django_user):
        await update.message.reply_text("❌ Сначала войдите в мини-апп!")
        return

    tasks = await get_user_tasks_for_calendar(telegram_user.django_user)
    
    if not tasks:
        await update.message.reply_text("📅 Нет задач для календаря.")
        return

    # Создаём iCal
    cal = Calendar()
    cal.add('prodid', '-//EventMaker Bot//')
    cal.add('version', '2.0')

    for task in tasks:
        event = Event()
        event.add('summary', f"📅 Дедлайн: {task.title}")
        event.add('dtstart', task.due_date)
        event.add('dtend', task.due_date + timedelta(minutes=30))
        event.add('description', f"Событие: {await sync_to_async(lambda: task.event.title if task.event else 'Без события')()}\n"
                                f"Статус: {await sync_to_async(lambda: task.get_status_display())()}\n"
                                f"Приоритет: {await sync_to_async(lambda: task.get_priority_display())()}")
        cal.add_component(event)

    # Отправляем файл
    ical_data = cal.to_ical()
    file = BytesIO(ical_data)
    file.name = "my_tasks.ics"

    await update.message.reply_document(
        document=file,
        filename="my_tasks.ics",
        caption="📅 Ваши задачи в формате iCal. Добавьте в Google Calendar или Outlook."
    )

async def check_now_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /checknow - проверить дедлайны сейчас"""
    user = update.effective_user
    
    await update.message.reply_text("⏳ Проверяю дедлайны...")
    
    try:
        telegram_user = await get_telegram_user(user.id)
        
        if telegram_user and telegram_user.django_user:
            await check_and_send_for_user(telegram_user.django_user)
            await update.message.reply_text("✅ Проверка завершена!")
        else:
            await update.message.reply_text("❌ Пользователь не найден")
            
    except Exception as e:
        logger.error(f"Ошибка в /checknow: {e}")
        await update.message.reply_text("❌ Ошибка проверки")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /help - помощь"""
    help_text = (
        "📋 <b>EventMaker Bot — Помощь</b>\n\n"
        "Команды:\n"
        "/start — Начало работы\n"
        "/settings — Настройки уведомлений\n"
        "/calendar — Задачи в календарь\n"
        "/test — Тест уведомления\n"
        "/mytasks — Мои задачи\n"
        "/checknow — Проверить дедлайны сейчас\n"
        "/help — Эта справка\n\n"
        "👉 <a href='https://t.me/EventMakerBot'>Открыть мини-апп</a>\n\n"
        "Как работает:\n"
        "1. Настройте уведомления через /settings\n"
        "2. Создавайте события и задачи в мини-аппе\n"
        "3. Получайте уведомления и в календаре автоматически!\n\n"
        f"⚡ <b>Автопроверка:</b> Раз в {CHECK_INTERVAL//3600} часа\n"
        "🤖 <b>Бот работает 24/7</b>"
    )
    
    await update.message.reply_text(help_text, parse_mode='HTML')

async def periodic_check_task():
    """Фоновая задача для периодической проверки"""
    while True:
        try:
            await check_all_deadlines()
        except Exception as e:
            logger.error(f"Ошибка в периодической проверке: {e}")
        
        await asyncio.sleep(CHECK_INTERVAL)

async def post_init(application):
    """Инициализация после запуска бота"""
    # Запускаем периодическую проверку в фоне
    application.create_task(periodic_check_task())
    
    logger.info("✅ Бот запущен с автопроверкой")
    print("=" * 60)
    print("🤖 EventMaker Bot ЗАПУЩЕН!")
    print("=" * 60)
    print(f"Токен: {BOT_TOKEN[:15]}...")
    print(f"Автопроверка: каждые {CHECK_INTERVAL//3600} часа")
    print(f"Время: {datetime.now().strftime('%H:%M:%S')}")
    print("=" * 60)
    print("\n📋 Команды в Telegram:")
    print("  /start     — Начало работы")
    print("  /settings  — Настройки уведомлений")
    print("  /calendar  — Задачи в календарь")
    print("  /test      — Тестовое уведомление")
    print("  /mytasks   — Мои задачи")
    print("  /checknow  — Проверить сейчас")
    print("  /help      — Помощь")
    print("=" * 60)
    print("\n⚡ Бот будет проверять дедлайны автоматически!")
    print("=" * 60)

def main():
    """Запуск бота"""
    # Создаем приложение
    app = Application.builder().token(BOT_TOKEN).build()
    
    # Добавляем обработчики команд
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("settings", settings_command))
    app.add_handler(CommandHandler("calendar", calendar_command))
    app.add_handler(CommandHandler("test", test_command))
    app.add_handler(CommandHandler("mytasks", mytasks_command))
    app.add_handler(CommandHandler("checknow", check_now_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CallbackQueryHandler(button_handler))
    
    # Инициализация после запуска
    app.post_init = post_init
    
    # Запускаем бота
    app.run_polling()

if __name__ == '__main__':
    main()
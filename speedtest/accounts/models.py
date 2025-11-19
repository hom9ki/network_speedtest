from django.db import models
from django.contrib.auth.models import User
from django.db.models import ForeignKey


class ConnectionData(models.Model):
    user = ForeignKey(User, on_delete=models.CASCADE, verbose_name='Пользователь', related_name='users')
    ip_address = models.GenericIPAddressField(verbose_name='IP Адрес')
    city = models.CharField(max_length=20, verbose_name='Город')
    country = models.CharField(max_length=20, verbose_name='Страна')
    provider = models.CharField(max_length=20, verbose_name='Провайдер')
    connection_type = models.CharField(max_length=20, verbose_name='Тип подключения')
    time_zone = models.CharField(max_length=50, verbose_name='Часовой пояс')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Данные о подключении'
        verbose_name_plural = 'Данные о подключении'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', 'ip_address'])]

    def __str__(self):
        return f'{self.user.username} - {self.ip_address}'


class TestResult(models.Model):
    user = ForeignKey(User, on_delete=models.CASCADE, verbose_name='Пользователь', related_name='users')
    connection_data = ForeignKey(ConnectionData, on_delete=models.CASCADE, verbose_name='Данные о подключении',
                                 related_name='connection_data')
    ping = models.FloatField(verbose_name='Пинг')
    download_speed = models.FloatField(verbose_name='Скорость  скачивания')
    upload_speed = models.FloatField(verbose_name='Скорость загрузки')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Результат теста'
        verbose_name_plural = 'Результаты тестов'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', 'connection_data'])]

    def __str__(self):
        return f'{self.user.username} - {self.connection_data.ip_address} - {self.created_at}'
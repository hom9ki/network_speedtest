from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/ping', views.api_ping, name='api_ping'),
    path('api/download', views.api_download, name='api_download'),
    path('api/upload', views.api_upload, name='api_upload'),
    path('api/save', views.save_result, name='api_save'),
    path('api/stats', views.api_stat, name='api_stat')
]

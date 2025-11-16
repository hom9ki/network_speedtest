import json
import os
import time
from turtledemo.penrose import start

from django.shortcuts import render
from django.http import HttpResponse, JsonResponse


# Create your views here.

def index(request):
    context = {
        'title': 'Home',
        'heading': 'Home',
        'description': 'Home Page'
    }
    return render(request, 'index.html', context)


def api_ping(request):
    if request.method == 'GET':
        return JsonResponse({'status': 'success', 'message': 'pong'})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})


def api_download(request):
    if request.method == 'GET':
        try:
            size = request.GET.get('size', '1048576')

            size_bytes = int(size)
            size_bytes = min(size_bytes, 50 * 1024 * 1024)

            test_data = os.urandom(size_bytes)
            print(test_data)
            response = HttpResponse(test_data, content_type='application/octet-stream')
            response['Content-Disposition'] = 'attachment; filename="test.bin"'
            return response
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})


def api_upload(request):
    if request.method == 'POST':
        try:
            start_time = time.time()
            file_content = request.body
            file_size = len(file_content)
            duration = time.time() - start_time
            if duration > 0:
                upload_speed_mbps = (file_size * 8) / duration / 1000000
            else:
                upload_speed_mbps = 0

            client_ip = request.META.get('REMOTE_ADDR')

            return JsonResponse({'upload_speed_mbps': upload_speed_mbps, 'file_size': file_size, 'client_ip': client_ip,
                                 'duration': duration})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})


def save_result(request):
    data = json.loads(request.body)
    print(data)
    required_fields = ['upload_speed', 'download_speed', 'ping']
    if not all(field in data for field in required_fields):
        return JsonResponse({'status': 'error', 'message': 'Missing required fields'})

    return JsonResponse(
        {'status': 'success', 'download_speed_mbps': data['download_speed'], 'upload_speed_mbps': data['upload_speed'],
         'ping': data['ping']})


def api_stat(request):
    return JsonResponse({
        'avg_download': 50.2,
        'avg_upload': 20.1,
        'avg_ping': 25,
        'total_tests': 123
    })

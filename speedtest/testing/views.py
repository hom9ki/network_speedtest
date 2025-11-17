import json
import os
import time
from turtledemo.penrose import start

from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt


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
            size_bytes = min(size_bytes, 100 * 1024 * 1024)
            print(f'размер файла {size_bytes} байт')
            test_data = os.urandom(size_bytes)

            response = HttpResponse(test_data, content_type='application/octet-stream')
            response['Content-Disposition'] = 'attachment; filename="test.bin"'
            response['Content-Length'] = size_bytes

            # chunk_size = 1024 * 2048
            # for i in range(0, len(test_data), chunk_size):
            #     response.write(test_data[i:i + chunk_size])
            #     response.flush()
            #     time.sleep(0.1)

            return response
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})


@csrf_exempt
def api_upload(request):
    if request.method == 'POST':
        try:
            file_content = request.body
            file_size = len(file_content)

            client_ip = request.META.get('REMOTE_ADDR')

            return JsonResponse({'file_size': file_size, 'client_ip': client_ip})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})


@csrf_exempt
def save_result(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'})
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON format'})
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

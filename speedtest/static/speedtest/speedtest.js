class SpeedTest {
    constructor() {
        this.baseUrl = 'http://localhost:8000/api'; // Замените на ваш URL
        this.isTesting = false;
        this.currentTest = null;
        this.loadStats();
    }

    async startTest() {
        if (this.isTesting) return;

        this.isTesting = true;
        this.updateButton(true);
        this.resetResults();

        try {
            // 1. Тест пинга
            await this.testPing();

            // 2. Тест скачивания
            await this.testDownload();

            // 3. Тест отдачи
            await this.testUpload();

            // 4. Сохранение результатов
            await this.saveResults();

            // 5. Обновление статистики
            await this.loadStats();

        } catch (error) {
            this.updateStatus('Ошибка при тестировании: ' + error.message);
            console.error('Test error:', error);
        } finally {
            this.isTesting = false;
            this.updateButton(false);
            this.updateProgress(100, 'Тест завершен');
        }
    }

    async testPing() {
        this.updateStatus('Измерение пинга...');
        this.updateProgress(10, 'Пинг');

        const times = [];

        // Делаем 3 измерения для точности
        for (let i = 0; i < 3; i++) {
            const startTime = performance.now();
            try {
                await fetch(`${this.baseUrl}/ping`, {
                    method: 'GET',
                    cache: 'no-cache'
                });
                const endTime = performance.now();
                times.push(endTime - startTime);
            } catch (error) {
                console.error('Ping test error:', error);
            }

            // Небольшая пауза между измерениями
            if (i < 2) await this.delay(100);
        }

        const averagePing = times.length > 0 ?
            times.reduce((a, b) => a + b) / times.length : 0;

        this.ping = Math.round(averagePing * 10) / 10;
        this.updateResult('ping', this.ping);

        return this.ping;
    }

    async testDownload() {
        this.updateStatus('Тест скорости скачивания...');
        this.updateProgress(40, 'Скачивание');

        const fileSizes = [5 * 1024 * 1024, 10 * 1024 * 1024, 25 * 1024 * 1024 ];
        let totalSpeed = 0;
        let testCount = 0;

        for (const size of fileSizes) {
            try {
                const speed = await this.measureDownloadSpeed(size);
                if (speed > 0) {
                    totalSpeed += speed;
                    testCount++;
                }
            } catch (error) {
                console.error('Download test error:', error);
            }
        }

        this.downloadSpeed = testCount > 0 ?
            Math.round((totalSpeed / testCount) * 100) / 100 : 0;

        this.updateResult('download', this.downloadSpeed);
        return this.downloadSpeed;
    }

    async measureDownloadSpeed(fileSize) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const startTime = performance.now();

            xhr.open('GET', `${this.baseUrl}/download?size=${fileSize}`, true);
            xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            xhr.setRequestHeader('Pragma', 'no-cache');
            xhr.responseType = 'blob';

            xhr.onload = function() {
                if (xhr.status === 200) {
                    const endTime = performance.now();
                    const duration = (endTime - startTime) / 1000; // в секундах
                    const sizeBits = xhr.response.size * 8;
                    const speedMbps = sizeBits / duration / 1000000;
                    resolve(speedMbps);
                } else {
                    reject(new Error(`HTTP ${xhr.status}`));
                }
            };

            xhr.onerror = function() {
                reject(new Error('Network error'));
            };

            xhr.send();
        });
    }

    async testUpload() {
        this.updateStatus('Тест скорости отдачи...');
        this.updateProgress(70, 'Отдача');

        const testSizes = [5 * 1024 * 1024, 10 * 1024 * 1024, 25 * 1024 * 1024 ];
        let totalSpeed = 0;
        let testCount = 0;

        for (const size of testSizes) {
            try {
                const testData = this.generateTestData(size);
                const speed = await this.measureUploadSpeed(testData);
                if (speed > 0) {
                    totalSpeed += speed;
                    testCount++;
                }
            } catch (error) {
                console.error('Upload test error:', error);
            }
        }

        this.uploadSpeed = testCount > 0 ?
            Math.round((totalSpeed / testCount) * 100) / 100 : 0;

        this.updateResult('upload', this.uploadSpeed);
        return this.uploadSpeed;
    }

    async measureUploadSpeed(testData) {
        const start = performance.now();

        try {
            const response = await fetch(`${this.baseUrl}/upload`, {
                method: 'POST',
                cache: 'no-store',
                body: testData,
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'X-CSRFToken': csrfToken
                }
            });
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.file_size) {
                console.error('No file_size in upload response', result);
                return 0;
            }

            const end = performance.now();
            const duration = (end - start) / 1000; // в секундах

            const sizeBits = result.file_size * 8;
            const speedMbps = sizeBits / duration / 1000000;
            console.log(`Upload speed: ${speedMbps.toFixed(2)} Mbps`);

            return speedMbps;

        } catch (error) {
            console.error('Upload error:', error);
            return 0;
        }
    }

    generateTestData(size) {
        // Генерируем тестовые данные
        const data = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }
        return data;
    }

    async saveResults() {
        if (this.ping === undefined || this.downloadSpeed === undefined || this.uploadSpeed === undefined) {
            console.error('Incomplete test results');
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/save`, {
                method: 'POST',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    download_speed: this.downloadSpeed,
                    upload_speed: this.uploadSpeed,
                    ping: this.ping,
                    isp: 'Unknown', // Можно определить через IP
                    city: 'Unknown'  // Можно определить через IP
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save results');
            }

            this.updateStatus('Результаты сохранены');
        } catch (error) {
            console.error('Save results error:', error);
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.baseUrl}/stats`);
            if (response.ok) {
                const stats = await response.json();
                this.displayStats(stats);
            }
        } catch (error) {
            console.error('Load stats error:', error);
        }
    }

    displayStats(stats) {
        const statsElement = document.getElementById('stats');
        statsElement.innerHTML = `
            <div class="stat-item">
                <div>Средняя загрузка</div>
                <div class="stat-value">${stats.avg_download} Мбит/с</div>
            </div>
            <div class="stat-item">
                <div>Средняя отдача</div>
                <div class="stat-value">${stats.avg_upload} Мбит/с</div>
            </div>
            <div class="stat-item">
                <div>Средний пинг</div>
                <div class="stat-value">${stats.avg_ping} мс</div>
            </div>
            <div class="stat-item">
                <div>Тестов сегодня</div>
                <div class="stat-value">${stats.total_tests}</div>
            </div>
        `;
    }

    updateResult(type, value) {
        const element = document.getElementById(`${type}Result`);
        if (element) {
            element.textContent = value;
            element.style.color = '#4CAF50';
        }
    }

    updateStatus(message) {
        const statusElement = document.getElementById('testStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    updateProgress(percent, stage) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }

        if (progressText) {
            progressText.textContent = stage ? `${stage}...` : `${percent}%`;
        }
    }

    updateButton(testing) {
        const button = document.getElementById('startTest');
        if (button) {
            button.disabled = testing;
            button.textContent = testing ? 'Тестирование...' : 'Начать тест скорости';
        }
    }

    resetResults() {
        const results = ['ping', 'download', 'upload'];
        results.forEach(type => {
            const element = document.getElementById(`${type}Result`);
            if (element) {
                element.textContent = '-';
                element.style.color = '#333';
            }
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Глобальная функция для кнопки
let speedTest;

function startSpeedTest() {
    if (!speedTest) {
        speedTest = new SpeedTest();
    }
    speedTest.startTest();
}

// Загрузка статистики при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    speedTest = new SpeedTest();
});
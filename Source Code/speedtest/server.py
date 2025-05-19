from flask import Flask, request, jsonify, render_template_string, send_file
import csv
import os
from datetime import datetime
from werkzeug.middleware.proxy_fix import ProxyFix
from io import StringIO

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

# Configuration
CSV_FILE = 'speedtest_results.csv'
CSV_HEADERS = [
    'timestamp', 'ip', 'country', 'colo', 'server',
    'download', 'upload', 'ping', 'jitter', 'packet_loss',
    'user_agent', 'client_time', 'test_method'
]

def init_csv():
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
            writer.writeheader()

init_csv()

@app.route('/')
def index():
    return render_template_string(open('speedtest.html').read())

@app.route('/api/save-result', methods=['POST'])
def save_result():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['download', 'upload', 'ping', 'jitter', 'packetLoss']
        if not all(field in data for field in required_fields):
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
        
        # Prepare record
        record = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'ip': data.get('ip', ''),
            'country': data.get('country', 'Unknown'),
            'colo': data.get('colo', ''),
            'server': data.get('server', 'Unknown'),
            'download': float(data['download']),
            'upload': float(data['upload']),
            'ping': float(data['ping']),
            'jitter': float(data['jitter']),
            'packet_loss': float(data['packetLoss']),
            'user_agent': request.headers.get('User-Agent', 'Unknown'),
            'client_time': data.get('timestamp', ''),
            'test_method': 'Cloudflare'
        }
        
        # Write to CSV
        with open(CSV_FILE, 'a', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
            writer.writerow(record)
        
        return jsonify({'status': 'success'})
    
    except ValueError as e:
        return jsonify({'status': 'error', 'message': f'Invalid data format: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/results')
def view_results():
    try:
        results = []
        with open(CSV_FILE, 'r') as f:
            reader = csv.DictReader(f)
            results = list(reader)
        
        return render_template_string('''
            <!DOCTYPE html>
            <html>
            <head>
                <title>Test Results</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #f2f2f2; position: sticky; top: 0; }
                    tr:hover { background-color: #f5f5f5; }
                    .actions { margin: 20px 0; }
                    .btn { 
                        display: inline-block; 
                        padding: 10px 15px; 
                        background: #3498db; 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 4px; 
                    }
                </style>
            </head>
            <body>
                <h1>Speed Test Results</h1>
                <div class="actions">
                    <a href="/" class="btn">Back to Test</a>
                    <a href="/download-results" class="btn">Download CSV</a>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Server</th>
                            <th>Download (Mbps)</th>
                            <th>Upload (Mbps)</th>
                            <th>Ping (ms)</th>
                            <th>Jitter (ms)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for row in results %}
                        <tr>
                            <td>{{ row.timestamp }}</td>
                            <td>{{ row.server }}</td>
                            <td>{{ row.download }}</td>
                            <td>{{ row.upload }}</td>
                            <td>{{ row.ping }}</td>
                            <td>{{ row.jitter }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </body>
            </html>
        ''', results=results[::-1])  # Reverse to show newest first
    
    except Exception as e:
        return f"Error loading results: {str(e)}", 500

@app.route('/download-results')
def download_results():
    try:
        csv_data = StringIO()
        writer = csv.DictWriter(csv_data, fieldnames=CSV_HEADERS)
        writer.writeheader()
        
        with open(CSV_FILE, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                writer.writerow(row)
        
        csv_data.seek(0)
        return csv_data.getvalue(), 200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=speedtest_results.csv'
        }
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
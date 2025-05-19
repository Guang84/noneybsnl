document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    const video = document.getElementById('scan-video');
    const scanButton = document.getElementById('scan-button');
    const scanButtonText = document.getElementById('scan-button-text');
    const scanButtonLoader = document.getElementById('scan-button-loader');
    const fileInput = document.getElementById('file-input');
    const statusMessage = document.getElementById('status-message');
    const resultContainer = document.getElementById('result-container');
    const permissionHelp = document.getElementById('permission-help');
    
    let scanning = false;
    let stream = null;
    let scanTimeout = null;
    
    // Toggle scanner
    scanButton.addEventListener('click', async function() {
        if (scanning) {
            stopScanner();
        } else {
            await startScanner();
        }
    });
    
    // Handle file upload
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        if (!file.type.match('image.*')) {
            showStatus('Please upload an image file', 'error');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            processImage(event.target.result);
        };
        
        reader.onerror = function() {
            showStatus('Error reading the image file', 'error');
        };
        
        reader.readAsDataURL(file);
    });
    
    async function startScanner() {
        try {
            scanButtonText.textContent = 'Requesting Camera...';
            scanButtonLoader.classList.remove('hidden');
            scanButton.disabled = true;
            statusMessage.className = 'status-message';
            permissionHelp.classList.add('hidden');
            
            // First check if we already have permission
            if (navigator.permissions) {
                try {
                    const permissionStatus = await navigator.permissions.query({ name: 'camera' });
                    
                    if (permissionStatus.state === 'denied') {
                        showPermissionDeniedMessage();
                        return;
                    }
                } catch (e) {
                    console.log('Permission API not supported or failed');
                }
            }
            
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            // Success - setup video
            video.srcObject = stream;
            await video.play();
            
            scanning = true;
            scanButtonText.textContent = 'Stop Scanner';
            scanButtonLoader.classList.add('hidden');
            scanButton.disabled = false;
            showStatus('Scanner ready. Point at a Wi-Fi QR code.', 'success');
            
            // Start scanning loop
            scanFrame();
        } catch (err) {
            console.error('Error starting scanner:', err);
            handleCameraError(err);
            scanButtonText.textContent = 'Start Scanner';
            scanButtonLoader.classList.add('hidden');
            scanButton.disabled = false;
        }
    }
    
    function stopScanner() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        if (scanTimeout) {
            cancelAnimationFrame(scanTimeout);
            scanTimeout = null;
        }
        
        video.srcObject = null;
        scanning = false;
        scanButtonText.textContent = 'Start Scanner';
        scanButtonLoader.classList.add('hidden');
        showStatus('Scanner stopped', 'warning');
    }
    
    function scanFrame() {
        if (!scanning) return;
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            try {
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });
                
                if (code) {
                    processQRCode(code.data);
                }
            } catch (e) {
                console.error('Error scanning QR code:', e);
            }
        }
        
        scanTimeout = requestAnimationFrame(scanFrame);
    }
    
    function processImage(imageSrc) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            try {
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });
                
                if (code) {
                    processQRCode(code.data);
                    showStatus('QR code found in uploaded image', 'success');
                } else {
                    showStatus('No QR code found in the image', 'error');
                }
            } catch (e) {
                console.error('Error scanning QR code:', e);
                showStatus('Error scanning the image', 'error');
            }
        };
        
        img.onerror = function() {
            showStatus('Error loading the image', 'error');
        };
        
        img.src = imageSrc;
    }
    
    function processQRCode(data) {
        if (!data) {
            showStatus('No data found in QR code', 'error');
            return;
        }
        
        // Check if it's a Wi-Fi QR code
        if (data.startsWith('WIFI:')) {
            const wifiData = parseWifiQR(data);
            displayWifiDetails(wifiData);
            showStatus('Wi-Fi network details found!', 'success');
        } else {
            showStatus('The QR code doesn\'t contain Wi-Fi details', 'warning');
            displayNonWifiContent(data);
        }
    }
    
    function parseWifiQR(qrData) {
        // Remove WIFI: prefix
        const data = qrData.substring(5);
        
        // Split into key-value pairs
        const pairs = data.split(';').filter(pair => pair.includes(':'));
        
        const result = {};
        pairs.forEach(pair => {
            const [key, value] = pair.split(':', 2);
            result[key] = value;
        });
        
        return {
            ssid: result['S'] || '',
            password: result['P'] || '',
            encryption: result['T'] || 'nopass',
            hidden: result['H'] === 'true'
        };
    }
    
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    function displayWifiDetails(wifiData) {
        let encryptionName = 'None';
        if (wifiData.encryption === 'WPA') encryptionName = 'WPA/WPA2';
        if (wifiData.encryption === 'WEP') encryptionName = 'WEP';
        
        const escapedSsid = escapeHtml(wifiData.ssid);
        const escapedPassword = escapeHtml(wifiData.password);
        
        const html = `
            <div class="result-card">
                <h3 class="result-title">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                    Wi-Fi Network Details
                </h3>
                
                <div class="detail-item">
                    <div class="detail-label">Network Name:</div>
                    <div class="detail-value">${escapedSsid || 'Not specified'}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Password:</div>
                    <div class="password-container">
                        <div class="password-value" id="password-value">${escapedPassword || 'No password'}</div>
                        ${wifiData.password ? '<button class="toggle-password" onclick="window.togglePasswordVisibility()">Show</button>' : ''}
                        ${wifiData.password ? `<button class="copy-button" onclick="window.copyToClipboard('${escapedPassword.replace(/'/g, "\\'")}')">Copy</button>` : ''}
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Encryption:</div>
                    <div class="detail-value">${encryptionName}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Hidden:</div>
                    <div class="detail-value">${wifiData.hidden ? 'Yes' : 'No'}</div>
                </div>
            </div>
            
            <div class="result-card">
                <h3 class="result-title">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Connection Instructions
                </h3>
                
                <p>To connect to this Wi-Fi network:</p>
                <ol>
                    <li>Go to your device's Wi-Fi settings</li>
                    <li>Select the network "${escapedSsid}"</li>
                    ${wifiData.password ? `<li>Enter the password when prompted</li>` : `<li>No password required</li>`}
                    <li>Enjoy your internet connection!</li>
                </ol>
            </div>
        `;
        
        resultContainer.innerHTML = html;
    }
    
    function displayNonWifiContent(content) {
        const escapedContent = escapeHtml(content);
        
        const html = `
            <div class="result-card">
                <h3 class="result-title">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    QR Code Content
                </h3>
                
                <p>This QR code doesn't contain Wi-Fi network details. Here's what it says:</p>
                
                <div class="detail-item">
                    <div class="detail-label">Content:</div>
                    <div class="detail-value">${escapedContent}</div>
                </div>
                
                <button class="copy-button" onclick="window.copyToClipboard('${escapedContent.replace(/'/g, "\\'")}')">Copy Text</button>
            </div>
        `;
        
        resultContainer.innerHTML = html;
    }
    
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message ' + type;
    }
    
    function showPermissionDeniedMessage() {
        scanButtonText.textContent = 'Start Scanner';
        scanButtonLoader.classList.add('hidden');
        scanButton.disabled = false;
        
        showStatus('Camera access denied. Please enable camera permissions in your browser settings to use the scanner. Alternatively, you can upload an image of the QR code.', 'error');
        permissionHelp.classList.remove('hidden');
    }
    
    function handleCameraError(err) {
        let message = 'Error accessing camera';
        
        if (err.name === 'NotAllowedError') {
            message = 'Camera access was denied. Please check your permissions.';
            permissionHelp.classList.remove('hidden');
        } else if (err.name === 'NotFoundError') {
            message = 'No camera found on this device.';
        } else if (err.name === 'NotReadableError') {
            message = 'Camera is already in use by another application.';
        } else if (err.name === 'OverconstrainedError') {
            message = 'Camera doesn\'t support the requested features. Try using a different browser.';
        } else if (err.name === 'SecurityError') {
            message = 'Camera access is disabled for security reasons.';
        } else if (err.name === 'AbortError') {
            message = 'Camera access was aborted.';
        }
        
        showStatus(message, 'error');
    }
    
    // Add global functions for button actions
    window.togglePasswordVisibility = function() {
        const passwordEl = document.getElementById('password-value');
        const buttonEl = document.querySelector('.toggle-password');
        
        if (!passwordEl || !buttonEl) return;
        
        if (passwordEl.getAttribute('data-original') === null) {
            passwordEl.setAttribute('data-original', passwordEl.textContent);
            passwordEl.textContent = '•'.repeat(passwordEl.textContent.length);
            buttonEl.textContent = 'Show';
        } else {
            passwordEl.textContent = passwordEl.getAttribute('data-original');
            buttonEl.textContent = 'Hide';
        }
    };
    
    window.copyToClipboard = function(text) {
        if (!text) return;
        
        navigator.clipboard.writeText(text).then(() => {
            showStatus('Copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            showStatus('Failed to copy. Please try again.', 'error');
        });
    };
    
    // Clean up on page unload
    window.addEventListener('beforeunload', function() {
        stopScanner();
    });
});
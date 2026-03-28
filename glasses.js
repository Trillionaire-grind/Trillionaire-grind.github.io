document.addEventListener('DOMContentLoaded', () => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('Service Worker registered'))
            .catch(error => console.log('Service Worker registration failed'));
    }

    const THEME_KEY = 'jakov-theme';
    const themeToggle = document.getElementById('theme-toggle');
    const applyTheme = (mode) => {
        const next = mode === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        try {
            localStorage.setItem(THEME_KEY, next);
        } catch (e) { /* ignore */ }
        if (themeToggle) {
            themeToggle.textContent = next === 'dark' ? 'Light' : 'Dark';
            themeToggle.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
            themeToggle.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
    };
    if (themeToggle) {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === 'dark' || saved === 'light') applyTheme(saved);
        else applyTheme('light');
        themeToggle.addEventListener('click', () => {
            const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            applyTheme(cur === 'dark' ? 'light' : 'dark');
        });
    }

    /**
     * Chrome on some glasses/Android builds reports as "mobile" and does not
     * apply :hover from a mouse reliably. Mirroring hover styles with a class
     * driven by pointer/mouse enter+leave fixes that.
     */
    /**
     * Uses pointerover/pointerout (bubbling) so descendants count — needed
     * for fixed children like #compass-distance and for whole-panel hovers.
     */
    function bindPointerHover(el) {
        if (!el) return;
        const add = () => { el.classList.add('is-pointer-hover'); };
        const remove = () => { el.classList.remove('is-pointer-hover'); };
        const maybeRemove = (e) => {
            const to = e.relatedTarget;
            if (to && el.contains(to)) return;
            remove();
        };
        el.addEventListener('pointerover', (e) => {
            if (el.contains(e.target)) add();
        });
        el.addEventListener('pointerout', maybeRemove);
        el.addEventListener('mouseover', (e) => {
            if (el.contains(e.target)) add();
        });
        el.addEventListener('mouseout', maybeRemove);
    }

    function initPointerHoverBindings() {
        const q = (sel) => document.querySelector(sel);
        bindPointerHover(q('#tasks'));
        bindPointerHover(q('#task-tracker'));
        bindPointerHover(q('#comic-text'));
        bindPointerHover(q('#text-badge'));
        bindPointerHover(q('#close-text'));
        bindPointerHover(q('#minimap'));
        bindPointerHover(q('#compass'));
        bindPointerHover(q('#destination-ui'));
        bindPointerHover(q('#datetime'));
        bindPointerHover(q('#theme-toggle'));
        bindPointerHover(q('.modal-content'));
        bindPointerHover(q('#face-name-input'));
        bindPointerHover(q('#save-face-btn'));
        bindPointerHover(q('#skip-face-btn'));
        bindPointerHover(q('.close-modal'));
    }
    initPointerHoverBindings();

    const video = document.getElementById('video');
    const canvas = document.getElementById('face-canvas');
    const ctx = canvas.getContext('2d');
    const tasks = document.querySelectorAll('.task');

    // Face recognition variables
    let faceMatcher = null;
    let labeledFaceDescriptors = [];
    let unknownFaceDetected = false;
    let lastUnknownDescriptor = null;
    let faceOverlays = []; // Store overlay elements

    // Handle window resize
    window.addEventListener('resize', () => {
        // Clear existing overlays on resize
        faceOverlays.forEach(overlay => overlay.remove());
        faceOverlays = [];
    });

    // Initialize face recognition
    async function initFaceRecognition() {
        console.log("Loading face recognition models...");
        const MODEL_URL = './models';

        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
            ]);

            console.log("Face recognition models loaded.");
            loadFacesFromLocalStorage();
        } catch (err) {
            console.error("Face recognition initialization failed:", err);
        }
    }

    // Load saved faces from localStorage
    function loadFacesFromLocalStorage() {
        const data = localStorage.getItem('face_db');
        if (!data) return;

        const parsedData = JSON.parse(data);
        labeledFaceDescriptors = parsedData.map(item => {
            const descriptors = item.descriptors.map(d => new Float32Array(d));
            return new faceapi.LabeledFaceDescriptors(item.label, descriptors);
        });

        if (labeledFaceDescriptors.length > 0) {
            faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
            console.log(`Restored ${labeledFaceDescriptors.length} faces from memory.`);
        }
    }

    const drawFaceBox = (box, label = 'persoon') => {
        const x = box.x;
        const y = box.y;
        const width = box.width;
        const height = box.height;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Anton, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + width / 2, y - 10);
    };

    const createFaceOverlay = (box, label) => {
        const overlay = document.createElement('div');
        overlay.className = 'face-overlay';
        overlay.style.position = 'fixed';
        overlay.style.left = box.x + 'px';
        overlay.style.top = box.y + 'px';
        overlay.style.width = box.width + 'px';
        overlay.style.height = box.height + 'px';
        overlay.style.border = '3px solid #ffffff';
        overlay.style.borderRadius = '8px';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '10';

        const labelDiv = document.createElement('div');
        labelDiv.className = 'face-label';
        labelDiv.textContent = label;
        labelDiv.style.position = 'absolute';
        labelDiv.style.top = '-25px';
        labelDiv.style.left = '50%';
        labelDiv.style.transform = 'translateX(-50%)';
        labelDiv.style.color = '#ffffff';
        labelDiv.style.fontFamily = 'Anton, sans-serif';
        labelDiv.style.fontSize = '18px';
        labelDiv.style.fontWeight = 'bold';
        labelDiv.style.textAlign = 'center';
        labelDiv.style.textShadow = '0 0 8px rgba(255, 255, 255, 0.8)';
        labelDiv.style.whiteSpace = 'nowrap';

        overlay.appendChild(labelDiv);
        document.body.appendChild(overlay);
        faceOverlays.push(overlay);
    };

    const runDetectionLoop = async () => {
        if (video.readyState !== 4) {
            requestAnimationFrame(runDetectionLoop);
            return;
        }

        try {
            // Use face-api for detection and recognition
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();

            // Clear existing overlays
            faceOverlays.forEach(overlay => overlay.remove());
            faceOverlays = [];

            if (detections.length > 0) {
                detections.forEach(detection => {
                    const box = detection.detection.box;
                    let label = 'persoon';

                    if (faceMatcher) {
                        const result = faceMatcher.findBestMatch(detection.descriptor);
                        if (result.label !== 'unknown') {
                            label = result.label;
                        } else {
                            // Unknown face detected
                            if (!unknownFaceDetected) {
                                unknownFaceDetected = true;
                                lastUnknownDescriptor = detection.descriptor;
                                showFaceModal();
                            }
                        }
                    } else {
                        // No faces saved yet, show modal for first face
                        if (!unknownFaceDetected) {
                            unknownFaceDetected = true;
                            lastUnknownDescriptor = detection.descriptor;
                            showFaceModal();
                        }
                    }

                    // Create overlay element instead of drawing on canvas
                    createFaceOverlay(box, label);
                });
            }

        } catch (err) {
            console.error('Face detection error (face-api):', err);
        }

        requestAnimationFrame(runDetectionLoop);
    };

    const startFaceDetection = async () => {
        await initFaceRecognition();
        runDetectionLoop();
    };

    // Modal functions
    const showFaceModal = () => {
        const modal = document.getElementById('face-modal');
        modal.classList.remove('hidden');
    };

    const hideFaceModal = () => {
        const modal = document.getElementById('face-modal');
        modal.classList.add('hidden');
        unknownFaceDetected = false;
        lastUnknownDescriptor = null;
    };

    const saveFace = () => {
        const nameInput = document.getElementById('face-name-input');
        const name = nameInput.value.trim();
        if (!name || !lastUnknownDescriptor) return;

        // Create labeled descriptor
        const newDescriptor = new faceapi.LabeledFaceDescriptors(name, [lastUnknownDescriptor]);
        labeledFaceDescriptors.push(newDescriptor);

        // Save to localStorage
        const storageData = labeledFaceDescriptors.map(ld => ({
            label: ld.label,
            descriptors: ld.descriptors.map(d => Array.from(d))
        }));
        localStorage.setItem('face_db', JSON.stringify(storageData));

        // Update matcher
        faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

        alert(`Successfully saved ${name}!`);
        nameInput.value = '';
        hideFaceModal();
    };

    const skipFace = () => {
        hideFaceModal();
    };

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            video.addEventListener('loadedmetadata', () => {
                startFaceDetection();
            });
        })
        .catch(err => {
            console.error('Error accessing webcam:', err);
        });

    // Task toggle
    tasks.forEach(task => {
        task.addEventListener('click', () => {
            const circle = task.querySelector('.circle');
            circle.classList.toggle('checked');
        });
    });

    // Task tracker functionality
    const trackerTasks = document.querySelectorAll('.tracker-task');
    trackerTasks.forEach(task => {
        task.addEventListener('click', () => {
            task.classList.toggle('completed');
        });
    });

    // Comic text badge functionality
    const comicText = document.getElementById('comic-text');
    const textBadge = document.getElementById('text-badge');
    const closeBtn = document.getElementById('close-text');

    // Badge click toggles popup visibility and hides badge
    textBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        comicText.classList.remove('hidden');
        textBadge.style.display = 'none';
    });

    // Close button hides popup and shows badge
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        comicText.classList.add('hidden');
        textBadge.style.display = 'flex';
    });

    // Date and time update
    const datetime = document.getElementById('datetime');
    setInterval(() => {
        datetime.textContent = new Date().toLocaleString();
    }, 1000);

    let currentPos = null;
    let destinationPos = null;
    let routingControl = null;

    const compassDistanceEl = document.getElementById('compass-distance');

    const toRad = deg => deg * Math.PI / 180;
    const toDeg = rad => rad * 180 / Math.PI;

    const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371000; // meters
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const bearingTo = (lat1, lon1, lat2, lon2) => {
        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const Δλ = toRad(lon2 - lon1);
        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        return (toDeg(Math.atan2(y, x)) + 360) % 360;
    };

    const formatDistance = meters => {
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(1)} km`;
    };

    const bearingToCardinal = (deg) => {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(deg / 22.5) % 16;
        return directions[index];
    };

    const updateDirection = () => {
        if (!currentPos || !destinationPos) {
            if (compassDistanceEl) compassDistanceEl.textContent = '--';
            return;
        }
        const bearing = bearingTo(currentPos[0], currentPos[1], destinationPos[0], destinationPos[1]);
        const distance = haversineDistance(currentPos[0], currentPos[1], destinationPos[0], destinationPos[1]);
        setCompassHeading(bearing);

        if (compassDistanceEl) {
            const cardinal = bearingToCardinal(bearing);
            compassDistanceEl.textContent = `${cardinal} · ${formatDistance(distance)}`;
        }
    };

    // Initialize map
    const map = L.map('minimap', { zoomControl: false }).setView([51.505, -0.09], 16);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">Carto</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(map);

    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            currentPos = [lat, lng];
            map.setView([lat, lng], 16);
            L.marker([lat, lng]).addTo(map);
            updateDirection();
        });

        navigator.geolocation.watchPosition(position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            currentPos = [lat, lng];
            updateDirection();
        });
    }

    const compass = document.getElementById('compass');
    function setCompassHeading(deg) {
        if (!compass) return;
        // CSS rotate: 0deg = right, but compass bearing: 0deg = up
        // So subtract 90 to convert bearing to CSS rotation
        const cssRotation = (deg - 90 + 360) % 360;
        compass.style.setProperty('--heading', `${cssRotation}deg`);
    }

    const destinationInput = document.getElementById('destination');
    const destinationResults = document.getElementById('destination-results');
    let searchTimeout = null;

    const clearResults = () => {
        destinationResults.innerHTML = '';
        destinationResults.style.display = 'none';
    };

    const selectDestination = (name, lat, lng) => {
        destinationInput.value = name;
        destinationPos = [lat, lng];
        updateDirection();

        L.marker([lat, lng]).addTo(map).bindPopup(name).openPopup();
        map.setView([lat, lng], 16);

        if (currentPos) {
            if (routingControl) {
                map.removeControl(routingControl);
            }
            routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(currentPos[0], currentPos[1]),
                    L.latLng(lat, lng)
                ]
            }).addTo(map);
        }

        clearResults();
    };

    const showResults = (results) => {
        clearResults();
        if (!results || results.length === 0) return;

        results.slice(0, 5).forEach(item => {
            const option = document.createElement('div');
            option.className = 'destination-result';
            option.textContent = item.display_name;
            option.addEventListener('click', () => {
                selectDestination(item.display_name, parseFloat(item.lat), parseFloat(item.lon));
            });
            destinationResults.appendChild(option);
        });
        destinationResults.style.display = 'block';
    };

    const searchLocation = (query) => {
        if (!query) return;
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                showResults(data);
            })
            .catch(err => console.error('Geocoding error:', err));
    };

    destinationInput.addEventListener('input', () => {
        const query = destinationInput.value.trim();
        clearTimeout(searchTimeout);
        if (!query) {
            clearResults();
            return;
        }
        searchTimeout = setTimeout(() => searchLocation(query), 250);
    });

    document.getElementById('search').addEventListener('click', () => {
        const query = destinationInput.value.trim();
        if (query) {
            searchLocation(query);
        }
    });

    document.addEventListener('click', (event) => {
        if (!destinationResults.contains(event.target) && event.target !== destinationInput) {
            clearResults();
        }
    });

    // Modal event listeners
    document.querySelector('.close-modal').addEventListener('click', hideFaceModal);
    document.getElementById('save-face-btn').addEventListener('click', saveFace);
    document.getElementById('skip-face-btn').addEventListener('click', skipFace);

    // Close modal when clicking outside
    document.getElementById('face-modal').addEventListener('click', (e) => {
        if (e.target.id === 'face-modal') {
            hideFaceModal();
        }
    });
});

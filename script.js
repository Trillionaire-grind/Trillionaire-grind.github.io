const video = document.getElementById('video');
const nameDisplay = document.getElementById('person-name');
let faceMatcher = null;
let labeledFaceDescriptors = [];

// 1. Initialize the App
async function init() {
    console.log("Loading models...");
    // Update path to './models' if your folder is in the same directory
    const MODEL_URL = './models'; 

    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
        ]);
        
        console.log("Models loaded.");
        loadFromLocalStorage(); // Restore saved faces
        startVideo();
    } catch (err) {
        console.error("Initialization failed:", err);
    }
}

// 2. Start Webcam
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => { video.srcObject = stream; })
        .catch(err => console.error("Camera Error:", err));
}

// 3. Save Face to LocalStorage
async function saveCurrentFace() {
    const name = prompt("Enter the person's name:");
    if (!name) return;

    // Detect the face (using SSD Mobilenet for higher accuracy during saving)
    const detection = await faceapi.detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (detection) {
        // Create the descriptor object
        const newDescriptor = new faceapi.LabeledFaceDescriptors(name, [detection.descriptor]);
        labeledFaceDescriptors.push(newDescriptor);

        // Save to LocalStorage
        // We must convert the Float32Array to a regular Array for JSON
        const storageData = labeledFaceDescriptors.map(ld => ({
            label: ld.label,
            descriptors: ld.descriptors.map(d => Array.from(d))
        }));
        localStorage.setItem('face_db', JSON.stringify(storageData));

        // Update the active matcher
        faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
        
        alert(`Successfully saved ${name}!`);
    } else {
        alert("Face not found. Please center your face in the frame.");
    }
}

// 4. Load from LocalStorage
function loadFromLocalStorage() {
    const data = localStorage.getItem('face_db');
    if (!data) return;

    const parsedData = JSON.parse(data);
    labeledFaceDescriptors = parsedData.map(item => {
        // Reconstruct the Float32Arrays from the stored regular arrays
        const descriptors = item.descriptors.map(d => new Float32Array(d));
        return new faceapi.LabeledFaceDescriptors(item.label, descriptors);
    });

    if (labeledFaceDescriptors.length > 0) {
        faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
        console.log(`Restored ${labeledFaceDescriptors.length} faces from memory.`);
    }
}

// 5. Real-time Recognition Loop
video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        // Use TinyFaceDetector for performance during the live loop
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        if (faceMatcher && resizedDetections.length > 0) {
            resizedDetections.forEach(detection => {
                const result = faceMatcher.findBestMatch(detection.descriptor);
                const box = detection.detection.box;
                
                // Draw the label on the canvas
                const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
                drawBox.draw(canvas);
                
                // Update text status
                if (result.label !== 'unknown') {
                    nameDisplay.innerText = result.label;
                    nameDisplay.style.color = 'green';
                } else {
                    nameDisplay.innerText = "Unknown Person";
                    nameDisplay.style.color = 'red';
                }
            });
        }
    }, 100);
});

// Attach button event
document.getElementById('register').addEventListener('click', saveCurrentFace);

// Run the app
init();
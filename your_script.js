navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        const video = document.getElementById('webcam');
        const audio = document.getElementById('microphone');

        video.srcObject = stream;
        audio.srcObject = stream;

    })
    .catch((error) => {
        console.error('Error accessing webcam:', error);
    });

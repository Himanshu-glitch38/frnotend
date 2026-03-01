// Online Counter Logic
const counterElement = document.getElementById('counter');
let currentOnline = 30447;

function updateCounter() {
    // Thoda realistic badlav (+ ya - 5)
    const change = Math.floor(Math.random() * 11) - 5; 
    currentOnline += change;
    
    // Number format (1,234 style)
    counterElement.textContent = currentOnline.toLocaleString();
}

// Har 3 second mein update
setInterval(updateCounter, 3000);

// Simple Tilt effect for Glass Cards
document.querySelectorAll('.glass:not(#video-chat-area)').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = card.getBoundingClientRect();
        const x = (clientX - left) / width - 0.5;
        const y = (clientY - top) / height - 0.5;
        
        card.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${y * -5}deg)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    });
});

// WebRTC Video Chat Logic
const startBtn = document.querySelector('.liquid-btn');
const videoArea = document.getElementById('video-chat-area');
const videoContainer = document.querySelector('.video-container');
const videoResizeHandle = document.getElementById('videoResizeHandle');
let localStream;
let resizeState = null;

function isPhoneLayout() {
    return window.matchMedia('(max-width: 600px)').matches;
}

function setMobileVideoPane(heightPx) {
    if (!videoArea) return;
    const hostHeight = videoArea.clientHeight || window.innerHeight;
    const minHeight = 120;
    const maxHeight = Math.max(minHeight + 24, Math.floor(hostHeight * 0.64));
    const clamped = Math.min(maxHeight, Math.max(minHeight, Math.round(heightPx)));
    videoArea.style.setProperty('--mobile-video-pane', `${clamped}px`);
}

function setDefaultMobileVideoPane() {
    if (!videoArea || !isPhoneLayout()) return;
    const hostHeight = videoArea.clientHeight || window.innerHeight;
    setMobileVideoPane(hostHeight * 0.4);
}

if (videoResizeHandle && videoContainer) {
    videoResizeHandle.addEventListener('pointerdown', (event) => {
        if (!document.body.classList.contains('in-chat') || !isPhoneLayout()) return;
        event.preventDefault();
        resizeState = {
            startY: event.clientY,
            startHeight: videoContainer.getBoundingClientRect().height
        };
        videoResizeHandle.classList.add('active');
    });

    document.addEventListener('pointermove', (event) => {
        if (!resizeState) return;
        const deltaY = event.clientY - resizeState.startY;
        setMobileVideoPane(resizeState.startHeight + deltaY);
    });

    document.addEventListener('pointerup', () => {
        if (!resizeState) return;
        resizeState = null;
        videoResizeHandle.classList.remove('active');
    });
}

window.addEventListener('resize', () => {
    if (!videoArea) return;
    if (document.body.classList.contains('in-chat') && isPhoneLayout()) {
        const currentHeight = videoContainer ? videoContainer.getBoundingClientRect().height : videoArea.clientHeight * 0.4;
        setMobileVideoPane(currentHeight);
    } else {
        videoArea.style.removeProperty('--mobile-video-pane');
    }
});

// 18+ Confirmation Logic
const ageCheckbox = document.getElementById('age-confirm');
const loadingSpinner = document.getElementById('loading-spinner');

if (startBtn) {
    startBtn.addEventListener('click', async () => {
        if (ageCheckbox && !ageCheckbox.checked) {
            startBtn.classList.add('shake');
            setTimeout(() => startBtn.classList.remove('shake'), 500);
            return;
        }

        // Show Spinner & Hide Button
        if (loadingSpinner) loadingSpinner.style.display = 'block';
        startBtn.style.display = 'none';

        try {
            // Request Camera & Mic
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            // Hide Landing Page Elements
            document.querySelector('.hero-card').style.display = 'none';
            document.querySelector('.visual-grid').style.display = 'none';
            document.querySelector('.info-section').style.display = 'none';
            
            // Show Video Area
            videoArea.style.display = 'block';
            document.body.classList.add('in-chat');
            if (isPhoneLayout()) {
                setTimeout(setDefaultMobileVideoPane, 40);
            }
            
            // Attach Stream to Video Element
            document.getElementById('localVideo').srcObject = localStream;
            document.getElementById('remoteVideo').srcObject = localStream; // Mirror for frontend demo
            
        } catch (err) {
            alert("Please allow camera access to start video chat.");
            console.error(err);
            document.body.classList.remove('in-chat');
            if (videoArea) videoArea.style.removeProperty('--mobile-video-pane');
            // Restore Button on Error
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            startBtn.style.display = '';
        }
    });
}

// Mute Button Logic
const muteBtn = document.getElementById('muteBtn');
if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                muteBtn.innerHTML = audioTrack.enabled 
                    ? '<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>' 
                    : '<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
                muteBtn.classList.toggle('muted');
            }
        }
    });
}

// Stop Button
document.getElementById('stopChat').addEventListener('click', () => location.reload());

// Chat Functionality
const chatInput = document.getElementById('chat-msg');
const sendBtn = document.getElementById('send-btn');
const chatLog = document.getElementById('chat-log');
const blobs = document.querySelectorAll('.blob');
const typingSound = new Audio('typing.mp3'); // Make sure you have a 'typing.mp3' file

function sendMessage() {
    const msg = chatInput.value.trim();
    if (msg) {
        // Add User Message
        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg msg-me';
        msgDiv.textContent = msg;
        chatLog.appendChild(msgDiv);
        chatLog.scrollTop = chatLog.scrollHeight; // Auto scroll
        chatInput.value = '';
        
        // Change background to User Theme (Blue/Cool)
        blobs[0].style.background = 'linear-gradient(45deg, #00d2ff, #3a7bd5)';
        blobs[1].style.background = '#48dbfb';
        
        // Simulate Stranger Reply
        setTimeout(simulateStrangerReply, 600);
    }
}

function simulateStrangerReply() {
    // Change background to Stranger Theme (Warm/Pink)
    blobs[0].style.background = 'linear-gradient(45deg, #ff9a9e, #fecfef)';
    blobs[1].style.background = '#ff6b6b';

    // Play Typing Sound
    typingSound.loop = true;
    typingSound.play().catch(() => {});

    const typingDiv = document.createElement('div');
    typingDiv.className = 'msg msg-stranger';
    typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatLog.appendChild(typingDiv);
    chatLog.scrollTop = chatLog.scrollHeight;

    setTimeout(() => {
        typingSound.pause();
        typingSound.currentTime = 0;

        if (!typingDiv.parentNode) return; // Stop if chat was cleared
        typingDiv.remove();
        
        const replies = ["Hey!", "Where are you from?", "Nice to meet you", "What's up?", "Cool", "I am a bot 🤖"];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        
        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg msg-stranger';
        msgDiv.textContent = randomReply;
        chatLog.appendChild(msgDiv);
        chatLog.scrollTop = chatLog.scrollHeight;
    }, 2000);
}

if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Skip Button Logic
const skipBtn = document.getElementById('skipBtn');

if (skipBtn) {
    skipBtn.addEventListener('click', () => {
        // Stop sound
        typingSound.pause();
        typingSound.currentTime = 0;

        // Clear Chat
        chatLog.innerHTML = '';
        
        // Reset background to original
        blobs[0].style.background = '';
        blobs[1].style.background = '';
        
        // Show Searching Message
        const searchMsg = document.createElement('div');
        searchMsg.className = 'msg';
        searchMsg.style.cssText = 'text-align: center; width: 100%; color: #666; background: none;';
        searchMsg.textContent = 'Skipping... Searching for a new stranger...';
        chatLog.appendChild(searchMsg);
        
        // Simulate finding someone
        setTimeout(() => {
            chatLog.innerHTML = '<div class="msg msg-stranger">Stranger found! Say hi!</div>';
        }, 1500);
    });
}

// Dark Mode Toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeToggle.innerHTML = isDark 
            ? '<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' 
            : '<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    });
}

// Report Button Logic
const reportBtn = document.getElementById('reportBtn');
if (reportBtn) {
    reportBtn.addEventListener('click', () => alert("User reported for violating terms."));
}

// Screenshot Functionality
const screenshotBtn = document.getElementById('screenshotBtn');
if (screenshotBtn) {
    screenshotBtn.addEventListener('click', async () => {
        const target = document.getElementById('video-chat-area');
        
        // Workaround: Replace video elements with canvas for capture
        // (html2canvas often renders video as black, so we draw the frame manually)
        const videos = target.querySelectorAll('video');
        const tempCanvases = [];

        videos.forEach(video => {
            const canvas = document.createElement('canvas');
            canvas.width = video.offsetWidth;
            canvas.height = video.offsetHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Style canvas to look like the video
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.borderRadius = '10px';
            
            video.parentNode.insertBefore(canvas, video);
            video.style.display = 'none';
            tempCanvases.push({ video, canvas });
        });

        try {
            const canvas = await html2canvas(target, { backgroundColor: null, scale: 2 });
            const link = document.createElement('a');
            link.download = `omegle-moment-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        } catch (err) {
            console.error("Screenshot failed:", err);
        } finally {
            // Restore videos immediately
            tempCanvases.forEach(item => {
                item.video.style.display = 'block';
                item.canvas.remove();
            });
        }
    });
}

// Fullscreen Logic
const fullscreenBtn = document.getElementById('fullscreenBtn');
if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            videoArea.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    });
}

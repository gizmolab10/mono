// Unique key for localStorage communication
const HEARTBEAT_KEY = 'app_heartbeat';
const HEARTBEAT_INTERVAL = 5000; // Time in milliseconds between heartbeats
const HEARTBEAT_TIMEOUT = 7000; // Time in milliseconds to consider a tab "dead"

let lastHeartbeatTimestamp = Date.now();

// Function to broadcast heartbeat
function sendHeartbeat(): void {
    localStorage.setItem(HEARTBEAT_KEY, JSON.stringify({ timestamp: Date.now() }));
    localStorage.removeItem(HEARTBEAT_KEY); // Trigger the storage event
}

// Function to check if another tab is already open
function checkIfAnotherTabIsOpen(): boolean {
    const lastTimestamp = JSON.parse(localStorage.getItem(HEARTBEAT_KEY) || 'null');
    const now = Date.now();
    return lastTimestamp !== null && (now - lastTimestamp.timestamp) < HEARTBEAT_TIMEOUT;
}

// Event listener for storage events
window.addEventListener('storage', (event) => {
    if (event.key === HEARTBEAT_KEY && event.newValue) {
        const data = JSON.parse(event.newValue);
        if (data.timestamp > lastHeartbeatTimestamp) {
            lastHeartbeatTimestamp = data.timestamp;
            console.log('Another tab is active.');
        }
    }
});

// Send initial heartbeat and set interval for further heartbeats
sendHeartbeat();
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

// Optionally check on tab focus if another tab is already open
window.addEventListener('focus', () => {
    if (checkIfAnotherTabIsOpen()) {
        console.log('Detected another tab upon focusing.');
    }
});

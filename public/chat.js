const socket = io();

// Get username and room from the URL
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

// Join the chat room
socket.emit("joinRoom", { username, room });

// Update room name and user list
socket.on("roomUsers", ({ room, users }) => {
    document.getElementById("room-name").innerText = room;
    document.getElementById("users").innerHTML = `
        ${users.map((user) => `<li>${user.username}</li>`).join("")}
    `;
});

// Receive and display messages
socket.on("message", (message) => {
    const div = document.createElement("div");
    div.classList.add("message");
    div.innerHTML = `<p>${message.user}: ${message.text}</p>`;
    document.getElementById("chat-messages").appendChild(div);
    document.getElementById("chat-messages").scrollTop =
        document.getElementById("chat-messages").scrollHeight;
});

// Send message
document.getElementById("chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const message = document.getElementById("message").value;
    socket.emit("sendMessage", { username, room, message });
    document.getElementById("message").value = "";
});

// Leave room
function leaveRoom() {
    window.location = "/index.html";
}

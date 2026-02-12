const user = JSON.parse(localStorage.getItem("user"));
if (!user) window.location.href = "/view/login.html";

$("#userName").text(`${user.firstname} ${user.lastname} (@${user.username})`);

const socket = io();
let currentRoom = null;

socket.emit("registerUser", { username: user.username });

$("#logoutBtn").click(() => {
  localStorage.removeItem("user");
  window.location.href = "/view/login.html";
});

$("#joinBtn").click(() => {
  const room = $("#roomSelect").val();

  if (currentRoom) {
    $("#msg").text("Leave current room first.");
    return;
  }

  socket.emit("joinRoom", { username: user.username, room });
  currentRoom = room;

  $("#currentRoom").text(room);
  $("#msg").text("");

  $("#groupMessage").prop("disabled", false);
  $("#sendGroupBtn").prop("disabled", false);

 
  fetch(`/api/group-messages/${encodeURIComponent(room)}`)
    .then((res) => res.json())
    .then((list) => {
      $("#chatBox").html("");
      list.forEach((m) => {
        const time = new Date(m.date_sent).toLocaleTimeString();
        $("#chatBox").append(
          `<div><b>${m.from_user}</b> <span class="text-muted" style="font-size:12px">(${time})</span>: ${m.message}</div>`
        );
      });
      $("#chatBox").scrollTop($("#chatBox")[0].scrollHeight);
    });

  $("#chatBox").append(`<div class="text-muted">✅ Joined room: ${room}</div>`);
});


$("#leaveBtn").click(() => {
  if (!currentRoom) {
    $("#msg").text("You are not in any room.");
    return;
  }

  socket.emit("leaveRoom", { username: user.username, room: currentRoom });

  $("#chatBox").append(`<div class="text-muted">❌ Left room: ${currentRoom}</div>`);

  currentRoom = null;
  $("#currentRoom").text("None");

  $("#groupMessage").prop("disabled", true);
  $("#sendGroupBtn").prop("disabled", true);
});


$("#sendGroupBtn").click(() => {
  const text = $("#groupMessage").val().trim();
  if (!currentRoom) return $("#msg").text("Join a room first.");
  if (!text) return;

  socket.emit("groupMessage", {
    from_user: user.username,
    room: currentRoom,
    message: text,
  });

  $("#groupMessage").val("");
});

socket.on("roomMessage", (data) => {
  const time = new Date(data.date_sent).toLocaleTimeString();
  $("#chatBox").append(
    `<div><b>${data.from_user}</b> <span class="text-muted" style="font-size:12px">(${time})</span>: ${data.message}</div>`
  );
  $("#chatBox").scrollTop($("#chatBox")[0].scrollHeight);
});


$("#toUser").on("change", () => {
  const to_user = $("#toUser").val().trim();
  if (!to_user) return;

  fetch(
    `/api/private-messages/${encodeURIComponent(user.username)}/${encodeURIComponent(to_user)}`
  )
    .then((res) => res.json())
    .then((list) => {
      $("#privateBox").html("");
      list.forEach((m) => {
        const time = new Date(m.date_sent).toLocaleTimeString();
        $("#privateBox").append(
          `<div><b>${m.from_user}</b> <span class="text-muted" style="font-size:12px">(${time})</span>: ${m.message}</div>`
        );
      });
      $("#privateBox").scrollTop($("#privateBox")[0].scrollHeight);
    });
});

$("#sendPrivateBtn").click(() => {
  const to_user = $("#toUser").val().trim();
  const message = $("#privateMessage").val().trim();

  if (!to_user) return;
  if (!message) return;

  socket.emit("privateMessage", {
    from_user: user.username,
    to_user,
    message,
  });

  $("#privateMessage").val("");
  socket.emit("typing", { from_user: user.username, to_user, isTyping: false });
});


socket.on("privateMessage", (data) => {
  const time = new Date(data.date_sent).toLocaleTimeString();
  $("#privateBox").append(
    `<div><b>${data.from_user}</b> <span class="text-muted" style="font-size:12px">(${time})</span>: ${data.message}</div>`
  );
  $("#privateBox").scrollTop($("#privateBox")[0].scrollHeight);
});


let typingTimer = null;

$("#privateMessage").on("input", () => {
  const to_user = $("#toUser").val().trim();
  if (!to_user) return;

  socket.emit("typing", { from_user: user.username, to_user, isTyping: true });

  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    socket.emit("typing", { from_user: user.username, to_user, isTyping: false });
  }, 800);
});

socket.on("typing", ({ from_user, isTyping }) => {
  if (isTyping) {
    $("#typingText").text(`${from_user} is typing...`);
  } else {
    $("#typingText").text("");
  }
});

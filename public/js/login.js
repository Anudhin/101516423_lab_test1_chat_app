$("#loginBtn").click(async function () {
  const username = $("#username").val().trim();
  const password = $("#password").val().trim();

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  $("#msg").text(data.message);

  if (res.ok) {
    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "/view/chat.html";
  }
});

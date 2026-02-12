$("#signupBtn").click(async function () {
  const username = $("#username").val().trim();
  const firstname = $("#firstname").val().trim();
  const lastname = $("#lastname").val().trim();
  const password = $("#password").val().trim();

  const res = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, firstname, lastname, password })
  });

  const data = await res.json();
  $("#msg").text(data.message);

  if (res.ok) {
    window.location.href = "/view/login.html";
  }
});

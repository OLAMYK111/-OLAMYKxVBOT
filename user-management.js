document.addEventListener("DOMContentLoaded", () => {
  const userList = document.getElementById("userList");

  fetch("http://localhost:5000/users") // Change this to your API URL
    .then(res => res.json())
    .then(users => {
      users.forEach(user => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${user.name || 'No Name'}</td>
          <td>${user.phone || 'N/A'}</td>
          <td>${user.status || 'Unknown'}</td>
          <td>${user.active ? "✅" : "❌"}</td>
          <td>
            <button class="delete-btn" onclick="deleteUser('${user.id}')">Delete</button>
          </td>
        `;

        userList.appendChild(row);
      });
    })
    .catch(error => {
      console.error("Error loading users:", error);
    });
});

function deleteUser(userId) {
  fetch(`http://localhost:5000/users/${userId}`, {
    method: "DELETE",
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      window.location.reload(); // Refresh the table
    })
    .catch(error => {
      console.error("Error deleting user:", error);
    });
}

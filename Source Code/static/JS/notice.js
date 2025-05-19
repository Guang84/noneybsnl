document.addEventListener("DOMContentLoaded", function() {
    const noticeDiv = document.getElementById("notice");

// Function to fetch and display all notices
function updateNotices() {
fetch("./db/Json/notice.json") // Replace with real API URL
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    })
    .then(data => {
        // Clear existing notices
        noticeDiv.innerHTML = "";

        // Append the title again after fetching new notices
        const noticeTitle = document.createElement("h2");
        noticeTitle.textContent = "Notice"; // Static title
        noticeDiv.appendChild(noticeTitle);

        // Loop through notifications and add them to the noticeDiv
        data.notifications.forEach(notification => {
            const noticeContainer = document.createElement("div");
            noticeContainer.classList.add("notice-container");

            const noticeMessage = document.createElement("p");
            noticeMessage.textContent = notification.message;

            const noticeImage = document.createElement("img");
            noticeImage.src = notification.image;
            noticeImage.alt = "Notice Image";

            noticeContainer.appendChild(noticeMessage);
            noticeContainer.appendChild(noticeImage);

            noticeDiv.appendChild(noticeContainer);
        });
    })
    .catch(error => {
        console.error("Error fetching notices:", error);
        noticeDiv.innerHTML = "<p>Failed to load notices. Please try again later.</p>";
    });
}

    // Initial load
    updateNotices();

    // Periodically update notices every 30 seconds
    setInterval(updateNotices, 30000);
});

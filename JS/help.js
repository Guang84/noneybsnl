document.addEventListener('DOMContentLoaded', () => {
    // Fetch the FAQ data from /db/faq.json
    fetch('https://raw.githubusercontent.com/Guang84/myweb-link/refs/heads/main/Json/faq.json')
        .then(response => response.json())
        .then(data => {
            const faqTableBody = document.querySelector('#faqTable tbody');
            data.faq.forEach(faq => {
                const row = document.createElement('tr');
                const questionCell = document.createElement('td');
                const categoryCell = document.createElement('td');

                // Create question link if there's an answerLink
                const questionLink = document.createElement('a');
                questionLink.href = "#";
                questionLink.textContent = faq.question;
                questionLink.onclick = function(event) {
                    event.preventDefault();  // Prevent default link behavior
                    toggleAnswer(faq.id, faq.answerLink);  // Toggle the answer div visibility
                };

                questionCell.appendChild(questionLink);
                categoryCell.textContent = faq.category;

                row.appendChild(questionCell);
                row.appendChild(categoryCell);
                faqTableBody.appendChild(row);

                // Create an answer div for each FAQ
                const answerDiv = document.createElement('div');
                answerDiv.id = 'answer-' + faq.id;
                answerDiv.classList.add('answer');
                answerDiv.style.display = 'none'; // Initially hidden

                const answerText = document.createElement('p');
                if (faq.answerLink) {
                    const answerLink = document.createElement('a');
                    answerLink.href = faq.answerLink;
                    answerLink.textContent = "Click here for more information.";
                    answerText.appendChild(answerLink);
                } else {
                    answerText.textContent = faq.answer;
                }
                answerDiv.appendChild(answerText);

                // Add the answer below the question in the table
                faqTableBody.appendChild(answerDiv);
            });
        })
        .catch(error => {
            console.error('Error loading FAQ data:', error);
        });
});

// Search function to filter FAQs by question
function searchFAQ() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toLowerCase();
    const table = document.getElementById('faqTable');
    const rows = table.getElementsByTagName('tr');

    // Loop through all rows, and hide those that don't match the search query
    for (let i = 1; i < rows.length; i++) { // start from 1 to skip header row
        const cells = rows[i].getElementsByTagName('td');
        if (cells.length > 0) {
            const questionCell = cells[0];
            const categoryCell = cells[1];
            const questionText = questionCell.textContent || questionCell.innerText;
            const categoryText = categoryCell.textContent || categoryCell.innerText;

            // Show row if either the question or category contains the search term
            if (questionText.toLowerCase().indexOf(filter) > -1 || categoryText.toLowerCase().indexOf(filter) > -1) {
                rows[i].style.display = '';
                rows[i + 1].style.display = ''; // Make sure the answer is visible if the question is visible
            } else {
                rows[i].style.display = 'none';
                rows[i + 1].style.display = 'none'; // Hide the answer if the question is hidden
            }
        }
    }
}

// Toggle the visibility of the answer when the question is clicked
function toggleAnswer(faqId, answerLink) {
    const answerDiv = document.getElementById('answer-' + faqId);
    
    // Toggle visibility of the answer div
    if (answerDiv.style.display === 'none' || answerDiv.style.display === '') {
        answerDiv.style.display = 'block'; // Show answer
        
        // If the link is present, append an expandable div with the linked content
        if (answerLink) {
            const expandedDiv = document.createElement('div');
            expandedDiv.classList.add('expanded-info');
            const iframe = document.createElement('iframe');
            iframe.src = answerLink;
            iframe.width = "100%";
            iframe.height = "400px";  // Adjust the height based on content
            expandedDiv.appendChild(iframe);

            // Append the expanded div to the answer div
            answerDiv.appendChild(expandedDiv);
        }
    } else {
        answerDiv.style.display = 'none'; // Hide answer
        
        // Remove the expandable div if it exists
        const expandedDiv = answerDiv.querySelector('.expanded-info');
        if (expandedDiv) {
            answerDiv.removeChild(expandedDiv);
        }
    }
}

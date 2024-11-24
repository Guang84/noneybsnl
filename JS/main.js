// Function to open the sidebar
function w3_open() {
    document.getElementById("mySidebar").style.display = "block";
  }
  
  // Function to close the sidebar
  function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
  }
  
  // Add event listeners to the menu items to close the sidebar after clicking
  document.querySelectorAll('#mySidebar .w3-bar-item').forEach(function(item) {
    item.addEventListener('click', function() {
      w3_close();  // Close the sidebar when a menu item is clicked
    });
  });
  
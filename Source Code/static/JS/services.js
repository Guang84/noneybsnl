document.addEventListener("DOMContentLoaded", function () {
    // Fetch the JSON data
    fetch('db/Json/services.json')
        .then(response => response.json())
        .then(data => {
            const servicesList = document.getElementById('services-list');
            data.services.forEach(service => {
                // Create a service item
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item';

                // Add image
                const serviceImage = document.createElement('img');
                serviceImage.src = service.image;
                serviceImage.alt = service.name;
                serviceImage.className = 'service-image';
                serviceItem.appendChild(serviceImage);

                // Add service name
                const serviceName = document.createElement('h3');
                serviceName.textContent = service.name;
                serviceItem.appendChild(serviceName);

                // Add service description
                const serviceDescription = document.createElement('p');
                serviceDescription.textContent = service.description;
                serviceItem.appendChild(serviceDescription);

                // Add charges list
                const chargesList = document.createElement('ul');
                service.charges.forEach(charge => {
                    const chargeItem = document.createElement('li');
                    chargeItem.innerHTML = `<strong>${charge.label}:</strong> ${charge.amount}`;
                    chargesList.appendChild(chargeItem);
                });
                serviceItem.appendChild(chargesList);

                // Append the service item to the services list
                servicesList.appendChild(serviceItem);
            });
        })
        .catch(error => console.error('Error loading JSON data:', error));
});
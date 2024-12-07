// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    // Navigation Menu Toggle for Mobile
    const nav = document.querySelector('nav');
    const navToggle = document.createElement('button');
    navToggle.classList.add('nav-toggle');
    navToggle.setAttribute('aria-label', 'Toggle Navigation Menu');
    navToggle.innerHTML = `
        <span class="hamburger"></span>
        <span class="hamburger"></span>
        <span class="hamburger"></span>
    `;
    nav.prepend(navToggle);

    navToggle.addEventListener('click', () => {
        nav.classList.toggle('nav-open');
    });

    // Close the navigation menu when a link is clicked (useful for single-page navigation)
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('nav-open')) {
                nav.classList.remove('nav-open');
            }
        });
    });

    // Contact Form Submission Handling
    const contactForm = document.getElementById('contact-form');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent the default form submission

        // Simple form validation
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();

        if (name === '' || email === '' || message === '') {
            alert('Please fill in all required fields.');
            return;
        }

        // Simulate form submission (since there's no backend)
        // In a real application, you would send the form data to a server here
        setTimeout(() => {
            alert('Thank you for your message! I will get back to you soon.');
            contactForm.reset();
        }, 1000);
    });

    // Scroll-Based Animations for CV Sections
    const cvSections = document.querySelectorAll('.cv-section');

    const options = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target); // Stop observing once the element has been revealed
            }
        });
    }, options);

    cvSections.forEach(section => {
        observer.observe(section);
    });

    // Back-to-Top Button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.setAttribute('aria-label', 'Back to Top');
    document.body.appendChild(backToTopBtn);

    // Style the Back-to-Top button (optional, can also be in styles.css)
    backToTopBtn.style.position = 'fixed';
    backToTopBtn.style.bottom = '40px';
    backToTopBtn.style.right = '40px';
    backToTopBtn.style.padding = '10px 15px';
    backToTopBtn.style.fontSize = '1.5rem';
    backToTopBtn.style.backgroundColor = '#4A90E2';
    backToTopBtn.style.color = '#fff';
    backToTopBtn.style.border = 'none';
    backToTopBtn.style.borderRadius = '50%';
    backToTopBtn.style.cursor = 'pointer';
    backToTopBtn.style.display = 'none';
    backToTopBtn.style.zIndex = '1000';
    backToTopBtn.style.transition = 'opacity 0.3s ease';

    // Show or hide the Back-to-Top button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.style.display = 'block';
            backToTopBtn.style.opacity = '1';
        } else {
            backToTopBtn.style.opacity = '0';
            setTimeout(() => {
                backToTopBtn.style.display = 'none';
            }, 300);
        }
    });

    // Scroll to top when the Back-to-Top button is clicked
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
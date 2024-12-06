// Smooth Scrolling for Navigation Links
document.querySelectorAll('nav ul li a').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);

    window.scrollTo({
      top: targetElement.offsetTop - 50, // Adjust for header height
      behavior: 'smooth'
    });
  });
});

// Scroll-to-Top Button
const scrollToTopButton = document.createElement('button');
scrollToTopButton.textContent = '↑ Top';
scrollToTopButton.style.position = 'fixed';
scrollToTopButton.style.bottom = '20px';
scrollToTopButton.style.right = '20px';
scrollToTopButton.style.padding = '10px 15px';
scrollToTopButton.style.backgroundColor = '#1abc9c';
scrollToTopButton.style.color = '#fff';
scrollToTopButton.style.border = 'none';
scrollToTopButton.style.borderRadius = '5px';
scrollToTopButton.style.cursor = 'pointer';
scrollToTopButton.style.display = 'none';
scrollToTopButton.style.zIndex = '1000';

document.body.appendChild(scrollToTopButton);

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    scrollToTopButton.style.display = 'block';
  } else {
    scrollToTopButton.style.display = 'none';
  }
});

scrollToTopButton.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// Toggle Dark/Light Mode
const toggleModeButton = document.createElement('button');
toggleModeButton.textContent = 'Toggle Dark Mode';
toggleModeButton.style.position = 'fixed';
toggleModeButton.style.bottom = '20px';
toggleModeButton.style.right = '90px';
toggleModeButton.style.padding = '10px 15px';
toggleModeButton.style.backgroundColor = '#1abc9c';
toggleModeButton.style.color = '#fff';
toggleModeButton.style.border = 'none';
toggleModeButton.style.borderRadius = '5px';
toggleModeButton.style.cursor = 'pointer';
toggleModeButton.style.zIndex = '1000';

document.body.appendChild(toggleModeButton);

toggleModeButton.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  toggleModeButton.textContent = document.body.classList.contains('dark-mode') 
    ? 'Toggle Light Mode' 
    : 'Toggle Dark Mode';
});

// Add Dark Mode Styles
const darkModeStyles = document.createElement('style');
darkModeStyles.textContent = `
  body.dark-mode {
    background-color: #121212;
    color: #f4f4f4;
  }
  body.dark-mode header,
  body.dark-mode footer {
    background-color: #1c1c1c;
  }
  body.dark-mode nav ul li a {
    color: #1abc9c;
  }
  body.dark-mode button {
    background-color: #16a085;
    color: #fff;
  }
`;
document.head.appendChild(darkModeStyles);
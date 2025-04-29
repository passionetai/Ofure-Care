// Mobile Menu Toggle
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    mobileMenuButton.innerHTML = mobileMenu.classList.contains('hidden') ?
        '<i class="fas fa-bars"></i>' : '<i class="fas fa-times"></i>';
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        if(this.getAttribute('href') === '#') return;

        const target = document.querySelector(this.getAttribute('href'));
        if(target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });

            // Close mobile menu if open
            mobileMenu.classList.add('hidden');
            mobileMenuButton.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
});

// Testimonial Carousel
let currentTestimonial = 0;
const testimonials = document.querySelectorAll('.testimonial-slide');
const indicators = document.querySelectorAll('.indicator');

function showTestimonial(index) {
    testimonials.forEach((testimonial, i) => {
        if(i === index) {
            testimonial.classList.remove('hidden');
        } else {
            testimonial.classList.add('hidden');
        }
    });

    indicators.forEach((indicator, i) => {
        if(i === index) {
            indicator.classList.remove('bg-opacity-30');
            indicator.classList.add('bg-opacity-100');
        } else {
            indicator.classList.add('bg-opacity-30');
            indicator.classList.remove('bg-opacity-100');
        }
    });

    currentTestimonial = index;
}

document.getElementById('prevTestimonial').addEventListener('click', () => {
    showTestimonial((currentTestimonial - 1 + testimonials.length) % testimonials.length);
});

document.getElementById('nextTestimonial').addEventListener('click', () => {
    showTestimonial((currentTestimonial + 1) % testimonials.length);
});

indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => showTestimonial(index));
});

// Show first testimonial initially
showTestimonial(0);

// Auto-rotate testimonials
setInterval(() => {
    showTestimonial((currentTestimonial + 1) % testimonials.length);
}, 8000);

// Professional Gallery Slider
const gallerySlides = document.querySelectorAll('.gallery-slide');
const galleryIndicators = document.querySelectorAll('.gallery-indicator');
const prevSlideBtn = document.getElementById('prevSlide');
const nextSlideBtn = document.getElementById('nextSlide');
let currentSlide = 0;
const slideInterval = 3000; // 3 seconds transition
let slideTimer;

// Initialize the gallery slider
function initGallerySlider() {
    if (gallerySlides.length === 0) return;

    // Set the first slide as active
    showSlide(0);

    // Start the automatic slideshow
    startSlideTimer();

    // Add event listeners to controls
    prevSlideBtn?.addEventListener('click', () => {
        showSlide(currentSlide - 1);
        resetSlideTimer();
    });

    nextSlideBtn?.addEventListener('click', () => {
        showSlide(currentSlide + 1);
        resetSlideTimer();
    });

    // Add event listeners to indicators
    galleryIndicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showSlide(index);
            resetSlideTimer();
        });
    });

    // Update indicator for first slide
    updateIndicators(0);
}

// Show a specific slide
function showSlide(index) {
    // Handle wrapping around
    if (index < 0) {
        index = gallerySlides.length - 1;
    } else if (index >= gallerySlides.length) {
        index = 0;
    }

    // Hide all slides
    gallerySlides.forEach(slide => {
        slide.style.opacity = '0';
        slide.style.zIndex = '0';
    });

    // Show the current slide
    gallerySlides[index].style.opacity = '1';
    gallerySlides[index].style.zIndex = '1';

    // Update indicators
    updateIndicators(index);

    // Update current slide index
    currentSlide = index;
}

// Update the indicator dots
function updateIndicators(index) {
    galleryIndicators.forEach((indicator, i) => {
        if (i === index) {
            indicator.classList.add('bg-opacity-100');
        } else {
            indicator.classList.remove('bg-opacity-100');
        }
    });
}

// Start the automatic slideshow timer
function startSlideTimer() {
    slideTimer = setInterval(() => {
        showSlide(currentSlide + 1);
    }, slideInterval);
}

// Reset the slideshow timer
function resetSlideTimer() {
    clearInterval(slideTimer);
    startSlideTimer();
}

// Initialize the gallery slider when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initGallerySlider();
});

// Gallery Lightbox (for other images)
const galleryItems = document.querySelectorAll('.gallery-item');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('caption');
const closeBtn = document.querySelector('.close');

galleryItems.forEach(item => {
    item.addEventListener('click', () => {
        const img = item.querySelector('img');
        lightboxImg.src = img.src;
        lightboxCaption.textContent = img.alt;
        lightbox.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });
});

closeBtn.addEventListener('click', () => {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
});

lightbox.addEventListener('click', (e) => {
    if(e.target === lightbox) {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// FAQ Toggle
const faqToggles = document.querySelectorAll('.faq-toggle');

faqToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
        const content = toggle.querySelector('.faq-content');
        const icon = toggle.querySelector('.fa-plus');

        content.classList.toggle('hidden');

        if(content.classList.contains('hidden')) {
            icon.classList.remove('fa-minus');
            icon.classList.add('fa-plus');
        } else {
            icon.classList.remove('fa-plus');
            icon.classList.add('fa-minus');
        }
    });
});

// Back to Top Button
const backToTopButton = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTopButton.classList.remove('opacity-0', 'invisible');
        backToTopButton.classList.add('opacity-100', 'visible');
    } else {
        backToTopButton.classList.remove('opacity-100', 'visible');
        backToTopButton.classList.add('opacity-0', 'invisible');
    }

    // Check if stats section is in view for counter animation
    const statsSection = document.querySelector('.stat-bubble');
    if (statsSection) {
        const statsSectionPosition = statsSection.getBoundingClientRect();
        // Use data attribute on the body to track if animation has started
        const hasAnimated = document.body.getAttribute('data-counter-animated') === 'true';
        if (statsSectionPosition.top < window.innerHeight && statsSectionPosition.bottom >= 0 && !hasAnimated) {
            startCounterAnimation();
            document.body.setAttribute('data-counter-animated', 'true');
        }
    }
});

backToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Smooth Scrolling for all links with smooth-scroll class
document.querySelectorAll('.smooth-scroll').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Offset for header
                behavior: 'smooth'
            });
        }
    });
});

// Stats Counter Animation
function startCounterAnimation() {
    const counters = document.querySelectorAll('.counter');
    const speed = 200; // The lower the faster

    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const increment = target / speed;

        const updateCount = () => {
            const count = +counter.innerText;

            // If count is less than target, continue incrementing
            if (count < target) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(updateCount, 1);
            } else {
                counter.innerText = target + (target === 560 ? '+' : ''); // Add + sign to 560+
            }
        };

        updateCount();
    });
}

// reCAPTCHA widget IDs
let registrationRecaptchaWidgetId;
let contactRecaptchaWidgetId;

// Function to handle reCAPTCHA rendering
function onRecaptchaLoad() {
    // Render reCAPTCHA for registration form
    const registrationRecaptcha = document.querySelector('#registrationForm .g-recaptcha');
    if (registrationRecaptcha) {
        registrationRecaptchaWidgetId = grecaptcha.render(registrationRecaptcha, {
            'sitekey': '6LfkzScrAAAAAPsby-uLG6xEXJ39Jadkih1YD8Aa'
        });
        registrationRecaptcha.setAttribute('data-widget-id', registrationRecaptchaWidgetId);
    }

    // Render reCAPTCHA for contact form
    const contactRecaptcha = document.querySelector('#contactForm .g-recaptcha');
    if (contactRecaptcha) {
        contactRecaptchaWidgetId = grecaptcha.render(contactRecaptcha, {
            'sitekey': '6LfkzScrAAAAAPsby-uLG6xEXJ39Jadkih1YD8Aa'
        });
        contactRecaptcha.setAttribute('data-widget-id', contactRecaptchaWidgetId);
    }
}

// Make the function globally accessible for reCAPTCHA
window.onRecaptchaLoad = onRecaptchaLoad;

// EmailJS Integration
document.addEventListener('DOMContentLoaded', function() {
    // Check if EmailJS is loaded and initialize with your public key
    if (typeof emailjs !== 'undefined') {
        try {
            emailjs.init("Fn14pgrjNZVN6PMyb");
            console.log("EmailJS initialized with public key: Fn14pgrjNZVN6PMyb");
        } catch (error) {
            console.error("Error initializing EmailJS:", error);
        }
    } else {
        console.error("EmailJS library not loaded. Please check the script inclusion in the HTML.");
    }

    // Registration Form Handling
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get references to success and error message elements
            const formSuccess = document.getElementById('formSuccess');
            const formError = document.getElementById('formError');
            const errorDetails = document.getElementById('formErrorDetails');

            // Hide any previous error/success messages
            formSuccess.classList.add('hidden');
            formError.classList.add('hidden');

            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;

            // Get reCAPTCHA response - find the reCAPTCHA in this form
            const recaptchaWidget = registrationForm.querySelector('.g-recaptcha');
            const recaptchaResponse = recaptchaWidget ? grecaptcha.getResponse(recaptchaWidget.getAttribute('data-widget-id') || 0) : grecaptcha.getResponse();

            // Log reCAPTCHA response for debugging
            console.log('reCAPTCHA response length:', recaptchaResponse ? recaptchaResponse.length : 0);

            // Check if reCAPTCHA is completed
            if (!recaptchaResponse) {
                alert("Please complete the reCAPTCHA verification.");
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            // Get all form values
            const templateParams = {
                from_name: document.getElementById('fullName').value,
                to_name: "Ofure Care Giver Institute",
                reply_to: document.getElementById('email').value,
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                education: document.getElementById('education').value,
                format: document.querySelector('input[name="format"]:checked')?.value || 'Not specified',
                motivation: document.getElementById('motivation').value,
                'g-recaptcha-response': recaptchaResponse
            };

            // Define service and template IDs
            const serviceID = 'service_ofurecaregivers';
            const templateID = 'template_registration';

            // Log the parameters for debugging
            console.log('Sending registration with params:', templateParams);
            console.log('Using service ID:', serviceID);
            console.log('Using template ID:', templateID);

            // Send the email using EmailJS
            emailjs.send(serviceID, templateID, templateParams)
                .then(function(response) {
                    console.log('Registration email sent successfully:', response);

                    // Show success message
                    formSuccess.classList.remove('hidden');
                    registrationForm.reset();

                    // Reset reCAPTCHA
                    if (typeof registrationRecaptchaWidgetId !== 'undefined') {
                        grecaptcha.reset(registrationRecaptchaWidgetId);
                    } else {
                        grecaptcha.reset();
                    }

                    // Restore button
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;

                    // Scroll to success message
                    setTimeout(() => {
                        formSuccess.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                })
                .catch(function(error) {
                    console.error('Error sending registration email:', error);
                    console.log('Error details:', JSON.stringify(error));

                    // Add error details to the error message
                    if (errorDetails) {
                        errorDetails.textContent = 'Error: ' + (error.text || error.message || 'Unknown error');
                    }

                    formError.classList.remove('hidden');

                    // Restore button
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;

                    // Scroll to error message
                    setTimeout(() => {
                        formError.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                });
        });
    }

    // Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get references to success and error message elements
            const contactSuccess = document.getElementById('contactSuccess');
            const contactError = document.getElementById('contactError');
            const errorDetails = document.getElementById('contactErrorDetails');

            // Hide any previous error/success messages
            contactSuccess.classList.add('hidden');
            contactError.classList.add('hidden');

            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            // Get reCAPTCHA response - find the reCAPTCHA in this form
            const recaptchaWidget = contactForm.querySelector('.g-recaptcha');
            const recaptchaResponse = recaptchaWidget ? grecaptcha.getResponse(recaptchaWidget.getAttribute('data-widget-id') || 0) : grecaptcha.getResponse();

            // Log reCAPTCHA response for debugging
            console.log('Contact form reCAPTCHA response length:', recaptchaResponse ? recaptchaResponse.length : 0);

            // Check if reCAPTCHA is completed
            if (!recaptchaResponse) {
                alert("Please complete the reCAPTCHA verification.");
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            // Get form values
            const templateParams = {
                from_name: document.getElementById('contactName').value,
                to_name: "Ofure Care Giver Institute",
                reply_to: document.getElementById('contactEmail').value,
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                phone: document.getElementById('contactPhone').value || 'Not provided',
                subject: document.getElementById('contactSubject').value,
                message: document.getElementById('contactMessage').value,
                'g-recaptcha-response': recaptchaResponse
            };

            // Define service and template IDs
            const serviceID = 'service_ofurecaregivers';
            const templateID = 'template_contact';

            // Log the parameters for debugging
            console.log('Sending contact form with params:', templateParams);
            console.log('Using service ID:', serviceID);
            console.log('Using template ID:', templateID);

            // Send the email using EmailJS
            emailjs.send(serviceID, templateID, templateParams)
                .then(function(response) {
                    console.log('Contact email sent successfully:', response);

                    // Show success message
                    contactSuccess.classList.remove('hidden');
                    contactForm.reset();

                    // Reset reCAPTCHA
                    if (typeof contactRecaptchaWidgetId !== 'undefined') {
                        grecaptcha.reset(contactRecaptchaWidgetId);
                    } else {
                        grecaptcha.reset();
                    }

                    // Restore button
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;

                    // Scroll to success message
                    setTimeout(() => {
                        contactSuccess.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                })
                .catch(function(error) {
                    console.error('Error sending contact email:', error);
                    console.log('Contact error details:', JSON.stringify(error));

                    // Add error details to the error message
                    if (errorDetails) {
                        errorDetails.textContent = 'Error: ' + (error.text || error.message || 'Unknown error');
                    }

                    contactError.classList.remove('hidden');

                    // Restore button
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;

                    // Scroll to error message
                    setTimeout(() => {
                        contactError.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                });
        });
    }
});



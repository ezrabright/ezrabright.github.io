(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();
    
    // Initiate the wowjs
    new WOW().init();

    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.sticky-top').addClass('shadow-sm').css('top', '0px');
        } else {
            $('.sticky-top').removeClass('shadow-sm').css('top', '-100px');
        }
    });

    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });

    // Facts counter
    $('[data-toggle="counter-up"]').counterUp({
        delay: 10,
        time: 2000
    });

    // Header carousel
    $(".header-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        items: 1,
        dots: true,
        loop: true,
        nav : true,
        navText : [
            '<i class="bi bi-chevron-left"></i>',
            '<i class="bi bi-chevron-right"></i>'
        ]
    });

    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        center: true,
        dots: false,
        loop: true,
        nav : true,
        navText : [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsive: {
            0:{ items:1 },
            768:{ items:2 }
        }
    });
  $(document).ready(function() {
        $('.grid').isotope({
            itemSelector: '.grid-item',
            layoutMode: 'masonry'
        });
    });

    var portfolioIsotope = $('.portfolio-container').isotope({
        itemSelector: '.portfolio-item',
        layoutMode: 'fitRows'
    });
    $('#portfolio-flters li').on('click', function () {
        $("#portfolio-flters li").removeClass('active');
        $(this).addClass('active');
        portfolioIsotope.isotope({ filter: $(this).data('filter') });
    });
    
})(jQuery);


// Toggle embed sections
function toggleEmbed(id) {
    const el = document.getElementById(id);
    el.style.display = (el.style.display === "none") ? "block" : "none";
}

// Hide all sections except the one in the URL hash
document.addEventListener("DOMContentLoaded", () => {
    const allSections = document.querySelectorAll('.report-section');
    const hash = window.location.hash; 
    if(hash) {
        allSections.forEach(section => {
            if('#' + section.id !== hash){
                section.style.display = 'none';
            }
        });
    }
});

// Contact form submission with fetch
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("form-status");

    if (form && status) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = {
                name: form.name.value,
                email: form.email.value,
                subject: form.subject.value,
                message: form.message.value,
            };

            status.textContent = "Sending...";
            status.style.color = "black";

            try {
                const res = await fetch("/api/sendmail", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                if (res.ok) {
                    status.textContent = "✅ Thank you! Your message has been sent.";
                    status.style.color = "green";
                    form.reset();
                } else {
                    const error = await res.json();
                    status.textContent = "❌ Error: " + (error.message || "Something went wrong.");
                    status.style.color = "red";
                }
            } catch (err) {
                status.textContent = "❌ Network error. Please try again later.";
                status.style.color = "red";
            }
        });
    }
});

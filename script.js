// script.js — carousel + indicators + highlight-strip sync + survey handler + lightbox
// -----------------------------------------------------------
// Survey endpoint:
// If you want to submit survey responses to a remote endpoint (Formspree, Netlify Forms, your server),
// set FORM_ENDPOINT to that URL (example: "https://formspree.io/f/<your-id>").
// If left as an empty string responses will be saved to localStorage for testing.
var FORM_ENDPOINT = ""; // <-- set your endpoint here if you want remote collection

// -----------------------------------------------------------
// Page logic
document.addEventListener('DOMContentLoaded', function () {
  // Header nav toggle (if present)
  var navToggle = document.getElementById('nav-toggle');
  var siteNav = document.getElementById('site-nav');
  navToggle && navToggle.addEventListener('click', function () {
    var expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    siteNav.classList.toggle('open');
  });

  // Footer year
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // -----------------------------------------------------------
  // Carousel functionality (dots overlay)
  var carousel = document.getElementById('photoCarousel');
  var indicators = document.getElementById('carouselIndicators');

  if (carousel) {
    var items = Array.from(carousel.querySelectorAll('.carousel-item'));
    var currentIndex = 0;

    // highlight content mapped to slides
    var highlights = [
      { title: 'HIGHLIGHT CONTENT #1', desc: 'Belize: Best snorkeling spots and conservation-friendly tours.' },
      { title: 'HIGHLIGHT CONTENT #2', desc: 'Aruba: Beach picks, sunset viewpoints, and where to sip local rum.' },
      { title: 'HIGHLIGHT CONTENT #3', desc: 'Dominican Republic: Beyond resorts — markets, day trips, and local eats.' },
      { title: 'HIGHLIGHT CONTENT #4', desc: 'Jet Setter Moments: Local markets, hidden coves, and travel stories.' }
    ];

    var highlightTitle = document.getElementById('highlightTitle');
    var highlightDesc  = document.getElementById('highlightDesc');

    function buildIndicators() {
      if (!indicators) return;
      indicators.innerHTML = '';
      items.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.className = 'dot';
        dot.setAttribute('aria-label', 'Go to photo ' + (i + 1));
        dot.dataset.index = i;
        dot.addEventListener('click', function (e) {
          goToIndex(parseInt(e.currentTarget.dataset.index, 10));
        });
        indicators.appendChild(dot);
      });
      updateIndicators();
    }

    function updateIndicators() {
      if (!indicators) return;
      Array.from(indicators.children).forEach(function (dot, i) {
        var active = i === currentIndex;
        dot.classList.toggle('active', active);
        dot.setAttribute('aria-pressed', active ? 'true' : 'false');
        dot.tabIndex = active ? 0 : -1;
      });
    }

    function updateHighlight() {
      var hl = highlights[currentIndex] || highlights[0];
      if (highlightTitle) highlightTitle.textContent = hl.title;
      if (highlightDesc) highlightDesc.textContent = hl.desc;
    }

    function goToIndex(index) {
      index = Math.max(0, Math.min(items.length - 1, index));
      currentIndex = index;
      var item = items[index];
      if (!item) return;
      var containerRect = carousel.getBoundingClientRect();
      var itemRect = item.getBoundingClientRect();
      var scrollLeft = carousel.scrollLeft + (itemRect.left - containerRect.left) - (containerRect.width - itemRect.width) / 2;
      carousel.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      updateIndicators();
      updateHighlight();
    }

    // Update currentIndex on scroll (debounced)
    var scrollTimeout = null;
    carousel.addEventListener('scroll', function () {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        var containerRect = carousel.getBoundingClientRect();
        var containerCenter = containerRect.left + containerRect.width / 2;
        var closestIndex = 0;
        var closestDistance = Infinity;
        items.forEach(function (it, i) {
          var r = it.getBoundingClientRect();
          var itemCenter = r.left + r.width / 2;
          var d = Math.abs(containerCenter - itemCenter);
          if (d < closestDistance) {
            closestDistance = d;
            closestIndex = i;
          }
        });
        if (currentIndex !== closestIndex) {
          currentIndex = closestIndex;
          updateIndicators();
          updateHighlight();
        }
      }, 80);
    }, { passive: true });

    // Keyboard nav when focused on carousel
    carousel.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowRight') { ev.preventDefault(); goToIndex(currentIndex + 1); }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); goToIndex(currentIndex - 1); }
    });

    // Touch flick support
    (function addTouchFlick() {
      var startX = 0, startTime = 0;
      carousel.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        startX = t.clientX;
        startTime = Date.now();
      }, { passive: true });
      carousel.addEventListener('touchend', function (e) {
        var t = e.changedTouches[0];
        var dx = t.clientX - startX;
        var dt = Date.now() - startTime;
        if (Math.abs(dx) > 40 && dt < 400) {
          if (dx < 0) goToIndex(currentIndex + 1);
          else goToIndex(currentIndex - 1);
        }
      }, { passive: true });
    })();

    // init
    buildIndicators();
    updateHighlight();
    // center first item on load
    setTimeout(function () { goToIndex(0); }, 100);
  }

  // -----------------------------------------------------------
  // Survey handling (if survey page present)
  var surveyForm = document.getElementById('survey-form');
  if (surveyForm) {
    var submitSuccess = document.getElementById('submitSuccess');
    var clearLocalBtn = document.getElementById('clearLocal');

    // Helper: save to localStorage bucket
    function saveLocally(payload) {
      try {
        var key = 'lts_survey_responses';
        var data = JSON.parse(localStorage.getItem(key) || '[]');
        data.push(payload);
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (e) {
        console.error('local save error', e);
        return false;
      }
    }

    surveyForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var country = document.getElementById('country').value.trim();
      var frequency = document.getElementById('frequency').value;
      var d1 = document.getElementById('destination1').value.trim();
      var d2 = document.getElementById('destination2').value.trim();
      var d3 = document.getElementById('destination3').value.trim();
      var age = document.getElementById('age').value;

      // Simple validation
      if (!country || !frequency || !age || !d1) {
        alert('Please answer the required questions (country, travel frequency, at least one destination, and age).');
        return;
      }

      var payload = {
        country: country,
        frequency: frequency,
        destinations: [d1 || null, d2 || null, d3 || null].filter(Boolean),
        age: age,
        submittedAt: new Date().toISOString()
      };

      // If FORM_ENDPOINT configured, POST JSON there
      if (FORM_ENDPOINT && FORM_ENDPOINT.length > 4) {
        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (res) {
          if (!res.ok) throw new Error('Submission failed: ' + res.status);
          // success
          submitSuccess.style.display = 'block';
          submitSuccess.textContent = 'Thanks — your response was submitted. This survey is anonymous.';
          surveyForm.reset();
        }).catch(function (err) {
          console.error(err);
          alert('Submission to remote endpoint failed. Your response will be saved locally for testing.');
          saveLocally(payload);
          submitSuccess.style.display = 'block';
          submitSuccess.textContent = 'Saved locally (remote submit failed).';
          surveyForm.reset();
        });
      } else {
        // no endpoint: save locally for testing
        var ok = saveLocally(payload);
        if (ok) {
          submitSuccess.style.display = 'block';
          submitSuccess.textContent = 'Thanks — your response was saved locally for testing. Configure FORM_ENDPOINT in script.js to collect remotely.';
          surveyForm.reset();
        } else {
          alert('Could not save response locally. See console for details.');
        }
      }
    });

    if (clearLocalBtn) {
      clearLocalBtn.addEventListener('click', function () {
        if (confirm('Clear locally saved survey responses? This only affects localStorage on this browser.')) {
          localStorage.removeItem('lts_survey_responses');
          alert('Local survey responses cleared.');
        }
      });
    }
  }

  // -----------------------------------------------------------
  // LIGHTBOX: open images wrapped by .lightbox-trigger
  (function setupLightbox() {
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightboxImg');
    var lightboxClose = document.getElementById('lightboxClose');

    if (!lightbox || !lightboxImg) return;

    // Helper to choose best large source (webp preferred)
    function bestLargeSource(trigger) {
      var webp = trigger.dataset.largeWebp;
      var jpg = trigger.dataset.largeJpg;
      // Prefer webp if browser supports it -> check by using <picture> feature detection is complex,
      // but most modern browsers support webp. We'll choose webp if provided.
      if (webp) return webp;
      return jpg || '';
    }

    function openLightbox(src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      // focus close button for accessibility
      if (lightboxClose) lightboxClose.focus();
    }

    function closeLightbox() {
      lightbox.setAttribute('aria-hidden', 'true');
      lightboxImg.src = '';
      lightboxImg.alt = '';
      document.body.style.overflow = '';
    }

    // Click on trigger opens lightbox with large image
    var triggers = Array.from(document.querySelectorAll('.lightbox-trigger'));
    triggers.forEach(function (t) {
      t.addEventListener('click', function (e) {
        e.preventDefault();
        var large = bestLargeSource(t);
        // fallback: if no large provided, look inside the picture/img
        if (!large) {
          var img = t.querySelector('img');
          large = img ? img.src : '';
        }
        var alt = (t.querySelector('img') && t.querySelector('img').alt) || '';
        if (large) openLightbox(large, alt);
      });
    });

    // close handlers
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      // close when clicking outside the image
      if (e.target === lightbox) closeLightbox();
    });

    // close on Esc
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.getAttribute('aria-hidden') === 'false') {
        closeLightbox();
      }
    });
  })();

});
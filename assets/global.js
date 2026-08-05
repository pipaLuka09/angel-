document.documentElement.classList.remove('no-js');

/* Mobile navigation toggle */
document.addEventListener('click', function (event) {
  var toggle = event.target.closest('[data-mobile-nav-toggle]');
  if (!toggle) return;
  var nav = document.querySelector('[data-mobile-nav]');
  if (!nav) return;
  nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', nav.classList.contains('is-open'));
});

/* Quantity selectors (+ / -) */
document.addEventListener('click', function (event) {
  var button = event.target.closest('[data-quantity-step]');
  if (!button) return;
  var wrapper = button.closest('.quantity-selector');
  if (!wrapper) return;
  var input = wrapper.querySelector('input[type="number"]');
  if (!input) return;
  var step = parseInt(button.getAttribute('data-quantity-step'), 10);
  var min = parseInt(input.getAttribute('min') || '1', 10);
  var value = parseInt(input.value || '1', 10) + step;
  input.value = Math.max(min, value);
  input.dispatchEvent(new Event('change', { bubbles: true }));
});

/* Product variant picker */
(function () {
  var forms = document.querySelectorAll('[data-product-form]');
  forms.forEach(function (form) {
    var dataEl = form.querySelector('[data-product-json]');
    if (!dataEl) return;

    var product;
    try {
      product = JSON.parse(dataEl.textContent);
    } catch (e) {
      return;
    }

    var optionSelects = form.querySelectorAll('[data-option-index]');
    var variantIdInput = form.querySelector('[data-variant-id]');
    var priceEl = form.closest('.product-info, .product-card__body')
      ? form.parentElement.querySelector('[data-price]') || document.querySelector('[data-price]')
      : null;
    var addButton = form.querySelector('[data-add-to-cart]');
    var availabilityEl = document.querySelector('[data-availability]');
    var mainImage = document.querySelector('[data-product-main-image]');

    function getSelectedOptions() {
      var selected = [];
      optionSelects.forEach(function (select) {
        selected[parseInt(select.getAttribute('data-option-index'), 10)] = select.value;
      });
      return selected;
    }

    function findVariant(options) {
      return product.variants.find(function (variant) {
        return variant.options.every(function (value, index) {
          return value === options[index];
        });
      });
    }

    function updateForVariant(variant) {
      if (!variant) {
        if (addButton) {
          addButton.disabled = true;
          addButton.textContent = window.themeStrings.unavailable;
        }
        if (availabilityEl) availabilityEl.textContent = window.themeStrings.unavailable;
        return;
      }

      if (variantIdInput) variantIdInput.value = variant.id;

      if (priceEl) {
        priceEl.innerHTML = variant.compare_at_price && variant.compare_at_price > variant.price
          ? '<span data-money>' + formatMoney(variant.price) + '</span> <span class="price__compare">' + formatMoney(variant.compare_at_price) + '</span>'
          : '<span data-money>' + formatMoney(variant.price) + '</span>';
      }

      if (addButton) {
        addButton.disabled = !variant.available;
        addButton.textContent = variant.available ? window.themeStrings.addToCart : window.themeStrings.soldOut;
      }

      if (availabilityEl) {
        availabilityEl.textContent = variant.available ? '' : window.themeStrings.soldOut;
      }

      if (mainImage && variant.featured_image && variant.featured_image.src) {
        mainImage.src = variant.featured_image.src;
      }
    }

    function formatMoney(cents) {
      return (cents / 100).toLocaleString(undefined, { style: 'currency', currency: window.themeStrings.currency || 'USD' });
    }

    optionSelects.forEach(function (select) {
      select.addEventListener('change', function () {
        var variant = findVariant(getSelectedOptions());
        updateForVariant(variant);
      });
    });
  });
})();

/* Product gallery thumbnails */
document.addEventListener('click', function (event) {
  var thumb = event.target.closest('[data-gallery-thumb]');
  if (!thumb) return;
  var gallery = thumb.closest('[data-product-gallery]');
  if (!gallery) return;
  var mainImage = gallery.querySelector('[data-product-main-image]');
  if (mainImage) mainImage.src = thumb.getAttribute('data-full-src');
  gallery.querySelectorAll('[data-gallery-thumb]').forEach(function (el) {
    el.classList.remove('is-active');
  });
  thumb.classList.add('is-active');
});

/* Scroll reveal */
(function () {
  var targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(function (el) { observer.observe(el); });
})();

/* 3D tilt on cards (pointer devices only) */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll('[data-tilt]').forEach(function (card) {
    card.addEventListener('mousemove', function (event) {
      var rect = card.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform =
        'perspective(700px) rotateX(' + (y * -8).toFixed(2) + 'deg) rotateY(' + (x * 8).toFixed(2) + 'deg) translateZ(4px)';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    });
  });
})();

/* Hero constellation canvas */
(function () {
  var canvas = document.querySelector('[data-hero-canvas]');
  if (!canvas || !canvas.getContext) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ctx = canvas.getContext('2d');
  var rootStyle = getComputedStyle(document.documentElement);
  var accent = rootStyle.getPropertyValue('--color-accent').trim() || '#12D6DF';
  var primary = rootStyle.getPropertyValue('--color-primary').trim() || '#2F6FEB';
  var particles = [];
  var running = true;
  var frame;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    var count = Math.min(70, Math.floor((canvas.width * canvas.height) / 14000));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.5 + 0.5
      });
    }
  }

  function step() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.6;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    for (var a = 0; a < particles.length; a++) {
      for (var b = a + 1; b < particles.length; b++) {
        var dx = particles[a].x - particles[b].x;
        var dy = particles[a].y - particles[b].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.strokeStyle = primary;
          ctx.globalAlpha = (1 - dist / 120) * 0.25;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    frame = requestAnimationFrame(step);
  }

  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) step();
    else cancelAnimationFrame(frame);
  });

  window.addEventListener('resize', resize);
  resize();
  step();
})();

/* AJAX add to cart */
(function () {
  function updateCartCount() {
    fetch(window.themeRoutes.cartUrl + '.js', { headers: { Accept: 'application/json' } })
      .then(function (response) { return response.json(); })
      .then(function (cart) {
        document.querySelectorAll('[data-cart-count]').forEach(function (el) {
          el.textContent = cart.item_count;
          el.classList.toggle('is-hidden', cart.item_count === 0);
          el.classList.remove('is-bumping');
          void el.offsetWidth;
          el.classList.add('is-bumping');
        });
      });
  }

  function showCartToast(message, isError) {
    var toast = document.querySelector('[data-cart-toast]');
    if (!toast) return;
    toast.innerHTML = message || window.themeStrings.addedToCart;
    toast.classList.toggle('cart-toast--error', !!isError);
    toast.classList.add('is-visible');
    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 3500);
  }

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form.matches || !form.matches('[data-product-form]')) return;

    event.preventDefault();

    var button = form.querySelector('[data-add-to-cart], button[type="submit"]');
    var originalText = button ? button.textContent : '';

    fetch(form.getAttribute('action') + '.js', {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) throw data;
          return data;
        });
      })
      .then(function () {
        if (button) {
          button.classList.add('is-success');
          button.textContent = window.themeStrings.added;
          setTimeout(function () {
            button.classList.remove('is-success');
            button.textContent = originalText;
          }, 1800);
        }
        updateCartCount();
        showCartToast(
          window.themeStrings.addedToCart +
            ' <a href="' + window.themeRoutes.cartUrl + '">' + window.themeStrings.viewCart + '</a>'
        );
      })
      .catch(function (error) {
        var message = (error && error.description) || window.themeStrings.unavailable;
        showCartToast(message, true);
      });
  });
})();

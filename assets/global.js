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

/* Product variant picker (pill / color-swatch buttons) */
(function () {
  var SWATCH_COLORS = {
    negro: '#111111', black: '#111111',
    blanco: '#f5f5f5', white: '#f5f5f5',
    azul: '#2F6FEB', blue: '#2F6FEB',
    rojo: '#e5484d', red: '#e5484d',
    verde: '#2f9e44', green: '#2f9e44',
    amarillo: '#f5c518', yellow: '#f5c518',
    rosa: '#ec4899', pink: '#ec4899',
    'rose gold': '#e0a899', oro: '#d4af37', gold: '#d4af37',
    plata: '#c0c0c0', plateado: '#c0c0c0', silver: '#c0c0c0',
    gris: '#8a8f98', grey: '#8a8f98', gray: '#8a8f98',
    morado: '#8b5cf6', purple: '#8b5cf6', violeta: '#8b5cf6',
    cafe: '#6b4423', marron: '#6b4423', brown: '#6b4423',
    naranja: '#f76707', orange: '#f76707',
    dorado: '#d4af37', beige: '#e8dcc8'
  };

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

    var optionGroups = form.querySelectorAll('[data-option-index]');
    var availabilityEl = document.querySelector('[data-availability]');
    var mainImage = document.querySelector('[data-product-main-image]');

    optionGroups.forEach(function (group) {
      group.querySelectorAll('[data-swatch-name]').forEach(function (pill) {
        var key = pill.getAttribute('data-swatch-name').trim().toLowerCase();
        if (SWATCH_COLORS[key]) {
          pill.style.setProperty('--swatch-color', SWATCH_COLORS[key]);
          pill.classList.add('has-swatch');
        }
      });
    });

    function getSelectedOptions() {
      var selected = [];
      optionGroups.forEach(function (group) {
        var index = parseInt(group.getAttribute('data-option-index'), 10);
        var selectedPill = group.querySelector('.option-pill.is-selected');
        selected[index] = selectedPill ? selectedPill.getAttribute('data-option-value') : null;
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

    function formatMoney(cents) {
      return (cents / 100).toLocaleString(undefined, { style: 'currency', currency: window.themeStrings.currency || 'USD' });
    }

    function updateForVariant(variant) {
      var addButtons = document.querySelectorAll('[data-add-to-cart]');
      var variantInputs = document.querySelectorAll('[data-variant-id]');
      var priceEls = document.querySelectorAll('[data-price]');

      if (!variant) {
        addButtons.forEach(function (btn) {
          btn.disabled = true;
          btn.textContent = window.themeStrings.unavailable;
        });
        if (availabilityEl) availabilityEl.textContent = window.themeStrings.unavailable;
        return;
      }

      variantInputs.forEach(function (input) {
        input.value = variant.id;
      });

      priceEls.forEach(function (priceEl) {
        priceEl.innerHTML = variant.compare_at_price && variant.compare_at_price > variant.price
          ? '<span data-money>' + formatMoney(variant.price) + '</span> <span class="price__compare">' + formatMoney(variant.compare_at_price) + '</span>'
          : '<span data-money>' + formatMoney(variant.price) + '</span>';
      });

      addButtons.forEach(function (btn) {
        btn.disabled = !variant.available;
        btn.textContent = variant.available ? window.themeStrings.addToCart : window.themeStrings.soldOut;
      });

      if (availabilityEl) {
        availabilityEl.textContent = variant.available ? '' : window.themeStrings.soldOut;
      }

      if (mainImage && variant.featured_image && variant.featured_image.src) {
        mainImage.src = variant.featured_image.src;
      }
    }

    optionGroups.forEach(function (group) {
      var pills = group.querySelectorAll('.option-pill');
      var selectedLabel = group.querySelector('[data-option-selected-value]');

      pills.forEach(function (pill) {
        pill.addEventListener('click', function () {
          pills.forEach(function (p) { p.classList.remove('is-selected'); });
          pill.classList.add('is-selected');
          if (selectedLabel) selectedLabel.textContent = pill.getAttribute('data-option-value');
          var variant = findVariant(getSelectedOptions());
          updateForVariant(variant);
        });
      });
    });
  });
})();

/* Sticky add-to-cart bar */
(function () {
  var bar = document.querySelector('[data-sticky-cart]');
  var sentinel = document.querySelector('[data-product-form] [data-add-to-cart]');
  if (!bar || !sentinel || !('IntersectionObserver' in window)) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        var scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        bar.classList.toggle('is-visible', scrolledPast);
        document.body.classList.toggle('has-sticky-cart', scrolledPast);
      });
    },
    { threshold: 0 }
  );
  observer.observe(sentinel);
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

/* Scroll reveal and 3D tilt now live in assets/motion.js (GSAP + ScrollTrigger). */

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
        if (window.themeCartDrawer) {
          window.themeCartDrawer.open();
        }
      })
      .catch(function (error) {
        var message = (error && error.description) || window.themeStrings.unavailable;
        showCartToast(message, true);
      });
  });
})();

/* Cart drawer */
(function () {
  var drawer = document.querySelector('[data-cart-drawer]');
  if (!drawer) return;

  var body = drawer.querySelector('[data-cart-drawer-body]');
  var footer = drawer.querySelector('[data-cart-drawer-footer]');
  var freeShippingEl = drawer.querySelector('[data-cart-drawer-free-shipping]');
  var lastFocused = null;

  function formatMoney(cents) {
    return (cents / 100).toLocaleString(undefined, { style: 'currency', currency: window.themeStrings.currency || 'USD' });
  }

  function freeShippingBarHtml(totalPrice) {
    var settings = window.themeSettings || {};
    if (!settings.freeShippingEnabled || !settings.freeShippingThresholdCents) return '';
    var threshold = settings.freeShippingThresholdCents;
    if (totalPrice >= threshold) {
      return (
        '<div class="free-shipping-bar free-shipping-bar--reached">' +
        '<p class="free-shipping-bar__message">' + window.themeStrings.freeShippingReached + '</p>' +
        '<div class="free-shipping-bar__track"><div class="free-shipping-bar__fill" style="width: 100%;"></div></div>' +
        '</div>'
      );
    }
    var remaining = formatMoney(threshold - totalPrice);
    var percent = (totalPrice / threshold) * 100;
    var message = window.themeStrings.freeShippingProgressTemplate.replace('{{ amount }}', remaining);
    return (
      '<div class="free-shipping-bar">' +
      '<p class="free-shipping-bar__message">' + message + '</p>' +
      '<div class="free-shipping-bar__track"><div class="free-shipping-bar__fill" style="width: ' + percent + '%;"></div></div>' +
      '</div>'
    );
  }

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
  }

  function withWidth(url, width) {
    if (!url) return url;
    return url + (url.indexOf('?') > -1 ? '&' : '?') + 'width=' + width;
  }

  function lineItemHtml(item) {
    var image = item.image
      ? '<img src="' + withWidth(item.image, 180) + '" alt="' + escapeHtml(item.title) + '" width="72" height="72">'
      : '';
    var variant =
      item.variant_title && item.variant_title !== 'Default Title'
        ? '<div class="cart-drawer__line-variant">' + escapeHtml(item.variant_title) + '</div>'
        : '';

    return (
      '<div class="cart-drawer__line" data-line-key="' + item.key + '">' +
      '<a href="' + item.url + '" class="cart-drawer__line-image">' + image + '</a>' +
      '<div class="cart-drawer__line-info">' +
      '<a href="' + item.url + '" class="cart-drawer__line-title">' + escapeHtml(item.product_title) + '</a>' +
      variant +
      '<div class="cart-drawer__line-price">' + formatMoney(item.final_price) + '</div>' +
      '<div class="quantity-selector quantity-selector--sm">' +
      '<button type="button" data-drawer-qty="-1" data-line-key="' + item.key + '" aria-label="Reducir cantidad">&minus;</button>' +
      '<input type="number" value="' + item.quantity + '" min="0" data-drawer-qty-input data-line-key="' + item.key + '" aria-label="' + window.themeStrings.quantity + '">' +
      '<button type="button" data-drawer-qty="1" data-line-key="' + item.key + '" aria-label="Aumentar cantidad">&plus;</button>' +
      '</div>' +
      '</div>' +
      '<button type="button" class="cart-drawer__line-remove" data-drawer-remove data-line-key="' + item.key + '" aria-label="' + window.themeStrings.remove + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
      '</button>' +
      '</div>'
    );
  }

  function render(cart) {
    if (cart.item_count === 0) {
      if (freeShippingEl) freeShippingEl.innerHTML = '';
      body.innerHTML =
        '<div class="cart-drawer__empty"><p>' + window.themeStrings.cartEmpty + '</p>' +
        '<button type="button" class="btn btn--primary" data-cart-drawer-close>' + window.themeStrings.continueShopping + '</button></div>';
      footer.innerHTML = '';
      return;
    }

    if (freeShippingEl) freeShippingEl.innerHTML = freeShippingBarHtml(cart.total_price);
    body.innerHTML = cart.items.map(lineItemHtml).join('');
    footer.innerHTML =
      '<div class="cart-drawer__subtotal"><span>' + window.themeStrings.subtotal + '</span><span>' + formatMoney(cart.total_price) + '</span></div>' +
      '<form action="' + window.themeRoutes.cartUrl + '" method="post">' +
      '<button type="submit" name="checkout" class="btn btn--primary btn--full">' + window.themeStrings.checkout + '</button>' +
      '</form>' +
      '<a href="' + window.themeRoutes.cartUrl + '" class="cart-drawer__view-cart">' + window.themeStrings.viewFullCart + '</a>';
  }

  function fetchCart() {
    return fetch(window.themeRoutes.cartUrl + '.js', { headers: { Accept: 'application/json' } }).then(function (r) {
      return r.json();
    });
  }

  function refresh() {
    return fetchCart().then(render);
  }

  function updateHeaderCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.classList.toggle('is-hidden', count === 0);
      el.classList.remove('is-bumping');
      void el.offsetWidth;
      el.classList.add('is-bumping');
    });
  }

  function open() {
    lastFocused = document.activeElement;
    refresh();
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-drawer-open');
    var closeBtn = drawer.querySelector('.cart-drawer__close');
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-drawer-open');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function updateLine(key, quantity) {
    fetch(window.themeRoutes.cartChangeUrl + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity: quantity })
    })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        render(cart);
        updateHeaderCount(cart.item_count);
      });
  }

  document.addEventListener('click', function (event) {
    if (event.target.closest('[data-cart-drawer-toggle]')) {
      event.preventDefault();
      open();
      return;
    }
    if (event.target.closest('[data-cart-drawer-close]')) {
      close();
      return;
    }
    var removeBtn = event.target.closest('[data-drawer-remove]');
    if (removeBtn) {
      updateLine(removeBtn.getAttribute('data-line-key'), 0);
      return;
    }
    var stepBtn = event.target.closest('[data-drawer-qty]');
    if (stepBtn) {
      var key = stepBtn.getAttribute('data-line-key');
      var input = drawer.querySelector('input[data-drawer-qty-input][data-line-key="' + key + '"]');
      if (!input) return;
      var step = parseInt(stepBtn.getAttribute('data-drawer-qty'), 10);
      var next = Math.max(0, parseInt(input.value, 10) + step);
      input.value = next;
      updateLine(key, next);
    }
  });

  document.addEventListener('change', function (event) {
    var input = event.target.closest('[data-drawer-qty-input]');
    if (!input) return;
    updateLine(input.getAttribute('data-line-key'), Math.max(0, parseInt(input.value, 10) || 0));
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });

  window.themeCartDrawer = { open: open, close: close, refresh: refresh };
})();

/* Safety net: motion.js (GSAP) now loads after window.load, so if it fails
   to load or takes unusually long, make sure .reveal elements (hidden by
   base.css until animated in) don't stay invisible forever. */
(function () {
  window.setTimeout(function () {
    if (window.gsap) return;
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
    });
  }, 4000);
})();

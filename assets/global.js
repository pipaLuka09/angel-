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

document.addEventListener('DOMContentLoaded', function () {
    let cartBtn = document.querySelector('.header__icon-btn[aria-label="Cart"]');
    let cartDrawer = document.querySelector('cart-drawer');
    let drawerContent = document.querySelector('#CartDrawer');
    let body = document.body;

    if (cartBtn) {
        cartBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            cartDrawer.classList.add('active');
            body.classList.add('cart-drawer-open');
        });
    }

    // Close drawer when clicking outside
    document.addEventListener('click', function (e) {

        if (!cartDrawer.classList.contains('active')) return;

        // Ignore click on cart icon
        if (cartBtn.contains(e.target)) return;

        // Ignore click inside drawer
        if (drawerContent.contains(e.target)) return;

        // Close drawer
        cartDrawer.classList.remove('active');
        body.classList.remove('cart-drawer-open');
    });
});
document.addEventListener('DOMContentLoaded', function () {
    let cartBtn = document.querySelector('.header__icon-btn[aria-label="Cart"]');
    let cartDrawer = document.querySelector('cart-drawer');
    let drawerContent = document.querySelector('#CartDrawer');
    let closeBtn = document.querySelector('#drawer-close-icon');
    let body = document.body;

    if (cartBtn) {
        cartBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            cartDrawer.classList.add('active');
            body.classList.add('cart-drawer-open');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
            e.preventDefault();

            cartDrawer.classList.remove('active');
            body.classList.remove('cart-drawer-open');
        });
    }

    document.addEventListener('click', function (e) {

        if (!cartDrawer.classList.contains('active')) return;

        if (cartBtn && cartBtn.contains(e.target)) return;

        if (drawerContent && drawerContent.contains(e.target)) return;

        cartDrawer.classList.remove('active');
        body.classList.remove('cart-drawer-open');
    });
});
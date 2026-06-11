document.addEventListener('DOMContentLoaded', function () {
    let cartBtn = document.querySelector('.header__icon-btn[aria-label="Cart"]');
    let cartDrawer = document.querySelector('cart-drawer');
    let drawerContent = document.querySelector('#CartDrawer');
    let body = document.body;

    window.theme = window.theme || {};

    window.theme.openCartDrawer = function () {
        if (!cartDrawer || !drawerContent) return false;

        cartDrawer.classList.add('active');
        body.classList.add('cart-drawer-open');

        return true;
    };

    window.theme.closeCartDrawer = function () {
        if (!cartDrawer || !drawerContent) return false;

        cartDrawer.classList.remove('active');
        body.classList.remove('cart-drawer-open');

        return true;
    };

    if (cartBtn && cartDrawer && drawerContent) {
        cartBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            window.theme.openCartDrawer();
        });
    }

    // Close drawer when clicking outside
    document.addEventListener('click', function (e) {

        if (!cartDrawer || !drawerContent || !cartBtn) return;

        if (!cartDrawer.classList.contains('active')) return;

        // Ignore click on cart icon
        if (cartBtn.contains(e.target)) return;

        // Ignore click inside drawer
        if (drawerContent.contains(e.target)) return;

        // Close drawer
        window.theme.closeCartDrawer();
    });
});
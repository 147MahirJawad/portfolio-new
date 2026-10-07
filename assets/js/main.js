// Portfolio interactions: theme toggle, mobile nav, active section, reveal-on-scroll, copy email.
(function () {
    'use strict';

    window.__portfolioReady = true;

    var root = document.documentElement;
    var header = document.querySelector('.site-header');
    var nav = document.getElementById('site-nav');
    var navToggle = document.querySelector('.nav-toggle');
    var themeToggle = document.querySelector('.theme-toggle');
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    var toast = document.getElementById('toast');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var store = {
        get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
    };

    // Older Safari only has addListener on MediaQueryList
    function onMediaChange(mql, fn) {
        if (mql.addEventListener) mql.addEventListener('change', fn);
        else if (mql.addListener) mql.addListener(fn);
    }

    // ---------- Footer year ----------
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = String(new Date().getFullYear());
    });

    // ---------- Theme ----------
    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        if (themeToggle) {
            themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
            themeToggle.setAttribute('title', theme === 'dark' ? 'Light theme' : 'Dark theme');
        }
        if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#070a09' : '#f6f7f4');
    }
    applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            store.set('theme', next);
        });
    }

    // Follow the OS setting until the visitor picks a theme themselves
    onMediaChange(window.matchMedia('(prefers-color-scheme: light)'), function (e) {
        if (!store.get('theme')) applyTheme(e.matches ? 'light' : 'dark');
    });

    // ---------- Header background on scroll ----------
    function updateHeader() {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    // ---------- Mobile navigation ----------
    var desktopNav = window.matchMedia('(min-width: 1024px)');

    function setNav(open) {
        if (!nav || !navToggle) return;
        nav.classList.toggle('is-open', open);
        document.body.classList.toggle('nav-open', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    if (navToggle && nav) {
        navToggle.addEventListener('click', function () {
            setNav(navToggle.getAttribute('aria-expanded') !== 'true');
        });

        nav.addEventListener('click', function (e) {
            if (e.target.closest('a')) setNav(false);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && nav.classList.contains('is-open')) {
                setNav(false);
                navToggle.focus();
            }
        });

        onMediaChange(desktopNav, function (e) {
            if (e.matches) setNav(false);
        });
    }

    // ---------- Active section in the nav ----------
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
    var sectionMap = new Map();
    navLinks.forEach(function (link) {
        var section = document.querySelector(link.getAttribute('href'));
        if (section) sectionMap.set(section, link);
    });

    function setActive(link) {
        navLinks.forEach(function (l) {
            if (l === link) l.setAttribute('aria-current', 'true');
            else l.removeAttribute('aria-current');
        });
    }

    if ('IntersectionObserver' in window && sectionMap.size) {
        var visible = new Set();
        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) visible.add(entry.target);
                else visible.delete(entry.target);
            });
            // Pick the topmost section that crosses the middle band of the viewport
            var current = null;
            sectionMap.forEach(function (link, section) {
                if (visible.has(section) && (!current || section.offsetTop < current.offsetTop)) current = section;
            });
            setActive(current ? sectionMap.get(current) : null);
        }, { rootMargin: '-40% 0px -55% 0px' });
        sectionMap.forEach(function (link, section) { sectionObserver.observe(section); });
    }

    // ---------- Reveal on scroll ----------
    var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
        // Stagger siblings that enter together
        revealEls.forEach(function (el) {
            var parent = el.parentElement;
            var siblings = Array.prototype.filter.call(parent.children, function (c) { return c.classList.contains('reveal'); });
            var index = siblings.indexOf(el);
            if (index > 0) el.style.setProperty('--reveal-delay', Math.min(index, 6) * 0.06 + 's');
        });

        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        revealEls.forEach(function (el) { revealObserver.observe(el); });
    }

    // Jumping to an in-page anchor should never land on invisible content
    window.addEventListener('hashchange', function () {
        var target = document.getElementById(location.hash.slice(1));
        if (target) target.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
    });

    // ---------- Toast ----------
    var toastTimer;
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2400);
    }

    // ---------- Copy email ----------
    function legacyCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        return ok;
    }

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).then(
                function () { return true; },
                function () { return legacyCopy(text); }
            );
        }
        return Promise.resolve(legacyCopy(text));
    }

    document.querySelectorAll('[data-copy]').forEach(function (btn) {
        var label = btn.querySelector('[data-copy-label]');
        var original = label ? label.textContent : '';
        var resetTimer;

        btn.addEventListener('click', function () {
            var text = btn.getAttribute('data-copy');
            copyText(text).then(function (ok) {
                if (ok) {
                    btn.classList.add('is-copied');
                    if (label) label.textContent = 'Copied!';
                    showToast('Email address copied to clipboard');
                    clearTimeout(resetTimer);
                    resetTimer = setTimeout(function () {
                        btn.classList.remove('is-copied');
                        if (label) label.textContent = original;
                    }, 2000);
                } else {
                    showToast('Couldn’t copy automatically: ' + text);
                }
            });
        });
    });
})();

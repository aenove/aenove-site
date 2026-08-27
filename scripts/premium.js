/* ============================================================
   ÆNOVE — Interactions premium
   Aucune bibliothèque externe. Tout est natif.
   ============================================================ */
(function () {
    'use strict';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(pointer: fine)').matches;

    /* ---------- 1. Graduations de la rose des vents ---------- */

    var ticks = document.getElementById('rose-ticks');
    if (ticks) {
        var ns = 'http://www.w3.org/2000/svg';
        for (var i = 0; i < 72; i++) {
            var deg = i * 5;
            var major = deg % 15 === 0;
            var rad = (deg - 90) * Math.PI / 180;
            var r1 = 152;
            var r2 = major ? 166 : 159;
            var line = document.createElementNS(ns, 'line');
            line.setAttribute('x1', (200 + r1 * Math.cos(rad)).toFixed(2));
            line.setAttribute('y1', (200 + r1 * Math.sin(rad)).toFixed(2));
            line.setAttribute('x2', (200 + r2 * Math.cos(rad)).toFixed(2));
            line.setAttribute('y2', (200 + r2 * Math.sin(rad)).toFixed(2));
            line.setAttribute('stroke', 'var(--gold)');
            line.setAttribute('stroke-width', major ? '1' : '0.5');
            line.setAttribute('opacity', major ? '0.5' : '0.28');
            ticks.appendChild(line);
        }
    }

    /* ---------- 2. Profondeur : la rose suit le regard ---------- */

    var depth = document.querySelector('.rose-depth');
    if (depth && finePointer && !reduced) {
        var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

        window.addEventListener('pointermove', function (e) {
            tx = (e.clientX / window.innerWidth - 0.5) * 2;
            ty = (e.clientY / window.innerHeight - 0.5) * 2;
            if (!raf) raf = requestAnimationFrame(loop);
        });

        function loop() {
            cx += (tx - cx) * 0.06;
            cy += (ty - cy) * 0.06;
            depth.style.transition = 'none';
            depth.style.transform =
                'rotateY(' + (cx * 11).toFixed(2) + 'deg) ' +
                'rotateX(' + (-cy * 9).toFixed(2) + 'deg)';
            if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
                raf = requestAnimationFrame(loop);
            } else {
                raf = null;
            }
        }
    }

    /* ---------- 3. Parallaxe verticale du hero ---------- */

    var stage = document.querySelector('.rose-stage');
    var hero = document.getElementById('hero');
    var heroInner = hero ? hero.querySelector('.hero-inner') : null;

    /* ---------- 4. Fil de progression + navigation ---------- */

    var progress = document.querySelector('.progress');
    var nav = document.querySelector('nav');
    var scheduled = false;

    function onScroll() {
        var y = window.scrollY || window.pageYOffset;

        if (progress) {
            var max = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
        }

        if (nav) {
            nav.classList.toggle('scrolled', y > 40);
        }

        if (!reduced && stage && y < window.innerHeight) {
            stage.style.transform =
                'translate(-50%, calc(-50% + ' + (y * 0.16).toFixed(1) + 'px))';
            stage.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.75));
        }

        if (!reduced && heroInner && y < window.innerHeight) {
            heroInner.style.transform = 'translateY(' + (y * -0.06).toFixed(1) + 'px)';
        }

        scheduled = false;
    }

    window.addEventListener('scroll', function () {
        if (!scheduled) {
            scheduled = true;
            requestAnimationFrame(onScroll);
        }
    }, { passive: true });

    onScroll();

    /* ---------- 5. Révélations au scroll ---------- */

    var targets = document.querySelectorAll('[data-reveal], .section-label');

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        targets.forEach(function (el) { observer.observe(el); });
    } else {
        targets.forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* ---------- 6. Cartes : inclinaison et halo ---------- */

    if (finePointer && !reduced) {
        document.querySelectorAll('.offre-card').forEach(function (card) {
            card.addEventListener('pointermove', function (e) {
                var r = card.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width;
                var py = (e.clientY - r.top) / r.height;
                card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
                card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
                card.style.transform =
                    'perspective(1400px) rotateY(' + ((px - 0.5) * 5).toFixed(2) + 'deg) ' +
                    'rotateX(' + ((0.5 - py) * 4).toFixed(2) + 'deg) translateZ(6px)';
            });

            card.addEventListener('pointerleave', function () {
                card.style.transform = '';
            });
        });
    }

    /* ---------- 7. Boutons magnétiques ---------- */

    if (finePointer && !reduced) {
        var magnets = document.querySelectorAll(
            '.hero-cta, .btn-primary, .btn-secondary, .offre-cta'
        );

        magnets.forEach(function (btn) {
            btn.addEventListener('pointermove', function (e) {
                var r = btn.getBoundingClientRect();
                var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
                var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
                btn.style.transform =
                    'translate(' + (dx * 9).toFixed(1) + 'px, ' +
                    (dy * 7).toFixed(1) + 'px)';
            });

            btn.addEventListener('pointerleave', function () {
                btn.style.transform = '';
            });
        });
    }
})();

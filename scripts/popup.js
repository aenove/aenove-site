// Menu mobile — ouverture/fermeture
var toggle = document.querySelector('.nav-toggle');
var links = document.querySelector('.nav-links');

if (toggle && links) {
    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.querySelectorAll('.nav-links a').forEach(function (link) {
        link.addEventListener('click', function () {
            links.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// Bouton "Écrire par email" — copie l'adresse dans le presse-papier,
// car beaucoup de visiteurs n'ont pas d'application mail configurée
// (dans ce cas, un lien mailto: classique ne fait rien).
var btnEmail = document.getElementById('btn-email');

if (btnEmail) {
    var adresse = 'contact@aenove.fr';
    var libelleInitial = btnEmail.textContent;
    var minuterie = null;

    btnEmail.addEventListener('click', function () {
        // On copie l'adresse (avec solution de repli pour anciens navigateurs)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(adresse).catch(function () {});
        } else {
            var champ = document.createElement('textarea');
            champ.value = adresse;
            champ.style.position = 'fixed';
            champ.style.opacity = '0';
            document.body.appendChild(champ);
            champ.select();
            try { document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(champ);
        }

        // Confirmation visuelle pendant 3 secondes
        btnEmail.textContent = adresse + ' — copié ✓';
        clearTimeout(minuterie);
        minuterie = setTimeout(function () {
            btnEmail.textContent = libelleInitial;
        }, 3000);

        // On ne bloque pas le lien mailto : si le visiteur a une
        // application mail, elle s'ouvrira quand même.
    });
}

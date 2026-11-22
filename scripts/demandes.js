/* ============================================================
   ÆNOVE · Résiliation et rétractation en ligne
   Parcours en trois temps : saisie, récapitulatif modifiable,
   transmission (Netlify Forms), puis confirmation horodatée.
   Aucune bibliothèque externe.
   ============================================================ */
(function () {
    'use strict';

    var form = document.querySelector('form[data-demande]');
    if (!form) { return; }

    var saisie = form.querySelector('[data-etape="saisie"]');
    var recap = form.querySelector('[data-etape="recap"]');
    var liste = form.querySelector('[data-recap-liste]');
    var fin = document.querySelector('[data-etape="fin"]');
    var echec = document.querySelector('[data-etape="echec"]');
    var horodatage = form.querySelector('input[name="horodatage"]');
    var btnEnvoyer = form.querySelector('[data-action="envoyer"]');
    var btnModifier = form.querySelector('[data-action="modifier"]');
    var objetCourriel = form.getAttribute('data-objet') || 'Demande';

    form.hidden = false;

    /* ---------- Affichages conditionnels ---------- */

    function majConditionnels() {
        form.querySelectorAll('input[type="radio"][data-affiche]').forEach(function (radio) {
            var cible = document.getElementById(radio.getAttribute('data-affiche'));
            if (!cible) { return; }
            var actif = radio.checked;
            cible.hidden = !actif;
            cible.querySelectorAll('input, select, textarea').forEach(function (champ) {
                champ.required = actif;
                if (!actif) { champ.value = ''; }
            });
        });
        form.querySelectorAll('select[data-aide-cible]').forEach(function (select) {
            var cible = document.getElementById(select.getAttribute('data-aide-cible'));
            if (!cible) { return; }
            var option = select.options[select.selectedIndex];
            var texte = option ? option.getAttribute('data-aide') : '';
            cible.textContent = texte || '';
            cible.hidden = !texte;
        });
    }

    form.addEventListener('change', majConditionnels);
    majConditionnels();

    /* ---------- Validation ---------- */

    function valider() {
        var regle = form.getAttribute('data-un-des');
        if (regle) {
            var noms = regle.split(',');
            var premier = form.elements[noms[0]];
            var rempli = noms.some(function (nom) {
                var champ = form.elements[nom];
                return champ && champ.value.trim() !== '';
            });
            premier.setCustomValidity(rempli ? '' : (form.getAttribute('data-un-des-message') || 'Ce champ est requis.'));
        }
        form.querySelectorAll('input, select, textarea').forEach(function (champ) {
            if (champ.willValidate) {
                champ.setAttribute('aria-invalid', champ.checkValidity() ? 'false' : 'true');
            }
        });
        return form.reportValidity();
    }

    /* ---------- Récapitulatif ---------- */

    function formaterDate(valeur) {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valeur || '');
        return m ? m[3] + '/' + m[2] + '/' + m[1] : valeur;
    }

    function valeurAffichee(el) {
        if (el.hasAttribute('data-recap-radio')) {
            var coche = form.querySelector('input[name="' + el.getAttribute('data-recap-radio') + '"]:checked');
            if (!coche) { return ''; }
            var texte = coche.getAttribute('data-texte') || coche.value;
            var complementId = coche.getAttribute('data-affiche');
            if (complementId) {
                var complement = document.getElementById(complementId).querySelector('input');
                if (complement && complement.value) { texte += ' : ' + formaterDate(complement.value); }
            }
            return texte;
        }
        if (el.tagName === 'SELECT') {
            var option = el.options[el.selectedIndex];
            return option && option.value ? option.text : '';
        }
        if (el.type === 'date') { return formaterDate(el.value); }
        return el.value.trim();
    }

    function lignes() {
        var resultat = [];
        form.querySelectorAll('[data-recap]').forEach(function (el) {
            var valeur = valeurAffichee(el);
            if (valeur) { resultat.push([el.getAttribute('data-recap'), valeur]); }
        });
        return resultat;
    }

    function remplirListe(dl, donnees) {
        dl.innerHTML = '';
        donnees.forEach(function (ligne) {
            var bloc = document.createElement('div');
            var dt = document.createElement('dt');
            var dd = document.createElement('dd');
            dt.textContent = ligne[0];
            dd.textContent = ligne[1];
            bloc.appendChild(dt);
            bloc.appendChild(dd);
            dl.appendChild(bloc);
        });
    }

    function montrer(etape) {
        var titre = etape.querySelector('.etape-titre');
        if (titre) {
            titre.setAttribute('tabindex', '-1');
            titre.focus();
        }
        etape.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    form.addEventListener('submit', function (evt) {
        evt.preventDefault();
        if (!recap.hidden) { return; }
        if (!valider()) { return; }
        remplirListe(liste, lignes());
        saisie.hidden = true;
        recap.hidden = false;
        montrer(recap);
    });

    btnModifier.addEventListener('click', function () {
        recap.hidden = true;
        saisie.hidden = false;
        var premier = saisie.querySelector('input, select, textarea');
        if (premier) { premier.focus(); }
    });

    /* ---------- Transmission ---------- */

    function maintenant() {
        var d = new Date();
        var lisible = d.toLocaleString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris'
        });
        return { lisible: lisible, iso: d.toISOString() };
    }

    function texteCourriel(donnees, quand) {
        var corps = donnees.map(function (l) { return l[0] + ' : ' + l[1]; }).join('\n');
        return 'Bonjour,\n\n' + (form.getAttribute('data-declaration') || '') + '\n\n' + corps +
            '\n\nDemande préparée le ' + quand.lisible + ' (heure de Paris).\n';
    }

    btnEnvoyer.addEventListener('click', function () {
        var quand = maintenant();
        var donnees = lignes();
        horodatage.value = quand.lisible + ' (heure de Paris) ; ' + quand.iso;
        btnEnvoyer.disabled = true;
        btnModifier.disabled = true;

        var corps = new URLSearchParams(new FormData(form)).toString();
        fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: corps
        }).then(function (reponse) {
            if (!reponse.ok) { throw new Error('HTTP ' + reponse.status); }
            fin.querySelector('[data-horodatage]').textContent = quand.lisible;
            remplirListe(fin.querySelector('[data-recap-liste]'), donnees);
            form.hidden = true;
            fin.hidden = false;
            montrer(fin);
        }).catch(function () {
            var lien = echec.querySelector('[data-mailto]');
            lien.href = 'mailto:contact@aenove.fr?subject=' + encodeURIComponent(objetCourriel) +
                '&body=' + encodeURIComponent(texteCourriel(donnees, quand));
            echec.hidden = false;
            btnEnvoyer.disabled = false;
            btnModifier.disabled = false;
            montrer(echec);
        });
    });

    document.querySelectorAll('[data-action="imprimer"]').forEach(function (bouton) {
        bouton.addEventListener('click', function () { window.print(); });
    });
})();

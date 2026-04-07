const LANG_KEY = "livLang";
const LANGS = ["ht", "fr", "es", "en"];

const STRINGS = {
  ht: {
    "home.title": "Akèy — Liv Lakay",
    "home.pinned": "Liv mwen (sou akèy)",
    "home.pinnedHint":
      "Touche yon liv isit la pou retire l sou akèy la — li toujou nan bibliyotèk la.",
    "home.books5e": "Liv 5èm ane",
    "home.myBooks": "Liv mwen",
    "home.noBooks": "Ou poko gen liv pou klas sa a.",
    "home.removeFromMyBooks": "Retire liv sa a nan paj mwen",
    "home.removeModalTitle": "Retire liv la?",
    "home.removeConfirm":
      'Eske ou vle retire "{title}" nan liv ou sou akèy la?',
    "home.removeYes": "Wi, retire l",
    "home.removeCancel": "Anile",
    "library.title": "Bibliyotèk — Liv Lakay",
    "library.hero": "Bibliyotèk",
    "library.grade5": "5èm ane",
    "library.search": "Rechèch",
    "library.grade4": "4èm ane",
    "library.pinAdd": "Ajoute nan liv mwen (akèy)",
    "library.pinRemove": "Retire nan liv mwen (akèy)",
    "profile.title": "Profil — Liv Lakay",
    "profile.heading": "Profil mwen",
    "profile.edit": "Modifye",
    "profile.adminMode": "Mode administratè",
    "profile.adminHint":
      "Lè li aktive, w ap wè yon bouton + nan bibliyotèk pou ajoute liv.",
    "profile.menuBooks": "Chwazi liv ou yo",
    "profile.menuLanguage": "Lang (HT / FR / ES / EN)",
    "profile.menuAbout": "Sou aplikasyon an",
    "profile.menuSupport": "Bay sipò",
    "profile.langTitle": "Chwazi lang",
    "profile.lang.ht": "Kreyòl (HT)",
    "profile.lang.fr": "Français (FR)",
    "profile.lang.es": "Español (ES)",
    "profile.lang.en": "English (EN)",
    "book.pinAdd": "Ajoute liv sa a nan liv mwen (akèy)",
    "book.pinRemove": "Retire liv sa a nan liv mwen (akèy)",
    "book.backLibrary": "← Rete nan bibliyotèk",
    "book.detailTitle": "Liv — Detay liv",
    "book.content": "Kontni",
    "book.chapterHint": "Touche yon chapit pou li. Peze long pou modifye.",
    "meta.author": "Ote",
    "meta.subject": "Sije",
    "meta.year": "Ane",
    "auth.signupTitle": "Kreye yon kont",
    "auth.loginTitle": "Konekte",
    "auth.loginSubtitle": "Antre imèl ak modpas kont ou.",
    "auth.fullName": "Non konplè",
    "auth.grade": "Klas (ane)",
    "auth.gradePlaceholder": "Chwazi klas ou",
    "auth.accessCode": "Kòd aksè",
    "auth.accessCodeHint":
      "Kòd sèl-opsyon ou resevwa lè ou achte yon pès. Antre l jan l parèt (majiskil oswa miniskil pa enpòtan; espas ak tire yo retire otomatikman).",
    "auth.profilePhoto": "Foto pwofil",
    "auth.profilePhotoHint": "JPG oswa PNG · 5 Mo max",
    "auth.error.accessCodeWrong": "Kòd aksè a pa kòrèk.",
    "auth.error.accessCodeInvalid":
      "Kòd sa a pa egziste oswa pa valab. Verifye kòd ki te voye nan acha pès ou a.",
    "auth.error.accessCodeAlreadyUsed": "Kòd sa a deja itilize. Chak pès bay yon sèl kòd, yon sèl fwa.",
    "auth.error.accessCodeInactive": "Kòd sa a pa aktif ankò.",
    "auth.error.accessCodeRedeemFailed":
      "Nou pa t kapab finalize kont la ak kòd la. Eseye ankò; si sa kontinye, kontakte sipò a.",
    "auth.error.fullNameRequired": "Antre non konplè ou.",
    "auth.error.gradeRequired": "Chwazi klas ou.",
    "auth.error.accessCodeRequired": "Antre kòd aksè a.",
    "auth.error.profilePhotoRequired": "Chwazi yon foto pwofil.",
    "auth.error.imageTooBig": "Imaj la twò gwo (5 Mo max).",
    "auth.error.firestorePermission":
      "Li pa posib li kòd aksè a. Gade livViews/firestore.accessCodes.rules.txt — règ sou koleksyon accessCodes.",
    "landing.browserTitle": "Liv Lakay",
    "auth.email": "Imèl",
    "auth.password": "Modpas",
    "auth.confirmPassword": "Konfime modpas",
    "auth.passwordMismatch": "De modpas yo pa menm.",
    "landing.taglineTitle": "Liv Lekol Pou Avni Ayiti",
    "landing.taglineSub": "Jwen aksè a edikasyon",
    "landing.quote1":
      "Premye responsabilite leta se travay pou tout moun ale lekol. Se sel sa ki kapab pemet peyi a devlope. Leta dwe ankouraje epi bay gwoup prive ki antreprann travay sa a tout kout men yo bezwen.",
    "landing.quote1Source": "-Atik 32-2",
    "landing.quote2":
      "Anseyman prime obligatwa pou tout moun. Lalwa sa fikse sanksyon pou sa. Leta va bay elev prime founiti klasik ak lot materyel yo bezwen gratis.",
    "landing.quote2Source": "-Atik 32-3",
    "landing.language": "Lang",
    "landing.buyPass": "Achte yon pè aksè",
    "landing.passCancelled": "Peman an anile.",
    "landing.passRevealFail":
      "Nou pa t ka montre kòd la. Eseye refresh paj la; kòd la ka parèt nan Firestore oswa imèl ou.",
    "auth.createAccount": "Kreye kont",
    "auth.creatingAccount": "N ap kreye kont ou...",
    "auth.signIn": "Konekte",
    "auth.forgotPassword": "Bliye modpas?",
    "auth.sendReset": "Voye lyen reset",
    "auth.backToLogin": "Retounen nan koneksyon",
    "auth.resetSent": "Gade bwat imèl ou — nou voye yon lyen pou rebati modpas la.",
    "auth.resetExplain":
      "Antre imèl ou te itilize nan aplikasyon an. N ap voye yon lyen Firebase pou rebati modpas.",
    "auth.signOut": "Dekonekte",
    "auth.goLogin": "Konekte / kreye kont",
    "auth.guestName": "Invite",
    "auth.guestHint": "Konekte pou sere pwofil ou.",
    "auth.close": "Fèmen",
    "auth.errorTitle": "Erè",
    "auth.error.generic": "Erè. Eseye ankò.",
    "auth.error.emailInUse": "Imèl sa a deja itilize.",
    "auth.error.invalidEmail": "Imèl pa bon.",
    "auth.error.weakPassword": "Modpas twò fèb (6 karaktè omwen).",
    "auth.error.userNotFound": "Pa gen kont ak imèl sa a.",
    "auth.error.wrongPassword": "Modpas la pa bon.",
    "auth.error.invalidCredential": "Imèl oswa modpas pa kòrèk.",
    "auth.error.tooManyRequests": "Twòp tantativ. Eseye pita.",
    "auth.error.network": "Pwoblèm rezo. Verifye koneksyon ou.",
    "auth.error.operationNotAllowed":
      "Koneksyon ak imèl pa aktive nan pwojè Firebase a (konsol → Authentication → Sign-in method).",
    "search.title": "Rechèch liv",
    "search.hint":
      "Anpil liv lekòl (espesyalman sa ki enpòte) gen ISBN, men pa tout. ID liv la nan baz done a toujou mache pou jwenn yon liv byen presi.",
    "search.byCode": "Pa ISBN oswa ID",
    "search.isbn": "ISBN (ISBN-10 oswa ISBN-13)",
    "search.docId": "ID liv (nan baz done a, egzanp: matenatik_5e)",
    "search.orFilters": "Oswa konbine kondisyon yo:",
    "search.byFilters": "Ane, sijè, otè, tèks",
    "search.textQuery": "Mo nan tit oswa non otè",
    "search.run": "Chèche",
    "search.reset": "Montre tout liv yo",
    "search.close": "Fèmen",
    "search.yearAll": "Tout ane yo",
    "search.subjectAll": "Tout sijè yo",
    "search.noResults": "Pa gen liv ki koresponn ak rechèch la.",
  },
  fr: {
    "home.title": "Accueil — Liv Lakay",
    "home.pinned": "Mes livres (accueil)",
    "home.pinnedHint":
      "Appuyez sur un livre ici pour le retirer de l’accueil — il reste dans la bibliothèque.",
    "home.books5e": "Livres 5e année",
    "home.myBooks": "Mes livres",
    "home.noBooks": "Aucun livre disponible pour votre classe.",
    "home.removeFromMyBooks": "Retirer ce livre de mon accueil",
    "home.removeModalTitle": "Retirer ce livre ?",
    "home.removeConfirm":
      'Voulez-vous retirer « {title} » de Mes livres (accueil) ?',
    "home.removeYes": "Oui, retirer",
    "home.removeCancel": "Annuler",
    "library.title": "Bibliothèque — Liv Lakay",
    "library.hero": "Bibliothèque",
    "library.grade5": "5e année",
    "library.search": "Recherche",
    "library.grade4": "4e année",
    "library.pinAdd": "Ajouter à Mes livres (accueil)",
    "library.pinRemove": "Retirer de Mes livres (accueil)",
    "profile.title": "Profil — Liv Lakay",
    "profile.heading": "Mon profil",
    "profile.edit": "Modifier",
    "profile.adminMode": "Mode administrateur",
    "profile.adminHint":
      "S’il est activé, un bouton + apparaît dans la bibliothèque pour ajouter un livre.",
    "profile.menuBooks": "Choisir mes livres",
    "profile.menuLanguage": "Langue (HT / FR / ES / EN)",
    "profile.menuAbout": "À propos de l’application",
    "profile.menuSupport": "Soutenir",
    "profile.langTitle": "Choisir la langue",
    "profile.lang.ht": "Créole (HT)",
    "profile.lang.fr": "Français (FR)",
    "profile.lang.es": "Espagnol (ES)",
    "profile.lang.en": "Anglais (EN)",
    "book.pinAdd": "Ajouter à Mes livres (accueil)",
    "book.pinRemove": "Retirer de Mes livres (accueil)",
    "book.backLibrary": "← Retour à la bibliothèque",
    "book.detailTitle": "Liv — Détail du livre",
    "book.content": "Contenu",
    "book.chapterHint":
      "Touchez un chapitre pour lire. Appui long pour modifier.",
    "meta.author": "Auteur",
    "meta.subject": "Matière",
    "meta.year": "Année",
    "auth.signupTitle": "Créer un compte",
    "auth.loginTitle": "Connexion",
    "auth.loginSubtitle": "Entrez l’e-mail et le mot de passe de votre compte.",
    "auth.fullName": "Nom complet",
    "auth.grade": "Classe (année)",
    "auth.gradePlaceholder": "Choisir la classe",
    "auth.accessCode": "Code d’accès",
    "auth.accessCodeHint":
      "Code à usage unique reçu lors de l’achat d’un pass. Saisissez-le tel que reçu (la casse est indifférente ; espaces et tirets sont ignorés).",
    "auth.profilePhoto": "Photo de profil",
    "auth.profilePhotoHint": "JPG ou PNG · 5 Mo max",
    "auth.error.accessCodeWrong": "Code d’accès incorrect.",
    "auth.error.accessCodeInvalid":
      "Ce code est inconnu ou invalide. Vérifiez le code envoyé après votre achat.",
    "auth.error.accessCodeAlreadyUsed":
      "Ce code a déjà été utilisé. Un code par pass, une seule inscription.",
    "auth.error.accessCodeInactive": "Ce code n’est plus actif.",
    "auth.error.accessCodeRedeemFailed":
      "Impossible de finaliser le compte avec ce code. Réessayez ou contactez le support.",
    "auth.error.fullNameRequired": "Entrez votre nom complet.",
    "auth.error.gradeRequired": "Choisissez votre classe.",
    "auth.error.accessCodeRequired": "Entrez le code d’accès.",
    "auth.error.profilePhotoRequired": "Choisissez une photo de profil.",
    "auth.error.imageTooBig": "Image trop volumineuse (5 Mo max).",
    "auth.error.firestorePermission":
      "Lecture du code impossible. Voir livViews/firestore.accessCodes.rules.txt — règles sur accessCodes.",
    "landing.browserTitle": "Liv Lakay",
    "auth.email": "E-mail",
    "auth.password": "Mot de passe",
    "auth.confirmPassword": "Confirmer le mot de passe",
    "auth.passwordMismatch": "Les mots de passe ne correspondent pas.",
    "landing.taglineTitle": "Livres scolaires pour l’avenir d’Haïti",
    "landing.taglineSub": "Accéder à l’éducation",
    "landing.quote1":
      "La première responsabilité de l’État est de faire en sorte que tout le monde aille à l’école. C’est la base du développement du pays. L’État doit encourager et soutenir les initiatives privées dans ce domaine.",
    "landing.quote1Source": "-Article 32-2",
    "landing.quote2":
      "L’enseignement primaire est obligatoire pour tous. La loi prévoit des sanctions à ce sujet. L’État fournit gratuitement aux élèves du primaire les fournitures classiques et autres matériels nécessaires.",
    "landing.quote2Source": "-Article 32-3",
    "landing.language": "Langue",
    "auth.createAccount": "Créer le compte",
    "auth.creatingAccount": "Création du compte en cours...",
    "auth.signIn": "Se connecter",
    "auth.forgotPassword": "Mot de passe oublié ?",
    "auth.sendReset": "Envoyer le lien",
    "auth.backToLogin": "Retour à la connexion",
    "auth.resetSent": "Vérifiez votre boîte mail — un lien de réinitialisation a été envoyé.",
    "auth.resetExplain":
      "Saisissez l’e-mail de votre compte. Nous enverrons un lien de réinitialisation.",
    "auth.signOut": "Se déconnecter",
    "auth.goLogin": "Connexion / créer un compte",
    "auth.guestName": "Invité",
    "auth.guestHint": "Connectez-vous pour enregistrer votre profil.",
    "auth.close": "Fermer",
    "auth.errorTitle": "Erreur",
    "auth.error.generic": "Erreur. Réessayez.",
    "auth.error.emailInUse": "Cet e-mail est déjà utilisé.",
    "auth.error.invalidEmail": "E-mail invalide.",
    "auth.error.weakPassword": "Mot de passe trop faible (au moins 6 caractères).",
    "auth.error.userNotFound": "Aucun compte avec cet e-mail.",
    "auth.error.wrongPassword": "Mot de passe incorrect.",
    "auth.error.invalidCredential": "E-mail ou mot de passe incorrect.",
    "auth.error.tooManyRequests": "Trop de tentatives. Réessayez plus tard.",
    "auth.error.network": "Problème réseau.",
    "search.title": "Rechercher un livre",
    "search.hint":
      "Beaucoup de manuels (surtout importés) ont un ISBN, mais pas tous. L’identifiant interne dans la base fonctionne toujours pour un résultat exact.",
    "search.byCode": "Par ISBN ou identifiant",
    "search.isbn": "ISBN (10 ou 13 chiffres)",
    "search.docId": "ID du livre (dans la base, ex. matenatik_5e)",
    "search.orFilters": "Ou combiner :",
    "search.byFilters": "Année, matière, auteur, texte",
    "search.textQuery": "Mots dans le titre ou l’auteur",
    "search.run": "Rechercher",
    "search.reset": "Afficher tous les livres",
    "search.close": "Fermer",
    "search.yearAll": "Toutes les années",
    "search.subjectAll": "Toutes les matières",
    "search.noResults": "Aucun livre ne correspond à la recherche.",
  },
  es: {
    "home.title": "Inicio — Liv Lakay",
    "home.pinned": "Mis libros (inicio)",
    "home.books5e": "Libros 5.º grado",
    "home.myBooks": "Mis libros",
    "home.noBooks": "Todavía no tienes libros para tu grado.",
    "home.removeFromMyBooks": "Quitar este libro de mi inicio",
    "home.removeModalTitle": "¿Quitar libro?",
    "home.removeConfirm":
      '¿Quieres quitar « {title} » de Mis libros (inicio)?',
    "home.removeYes": "Sí, quitar",
    "home.removeCancel": "Cancelar",
    "library.title": "Biblioteca — Liv Lakay",
    "library.hero": "Biblioteca",
    "library.grade5": "5.º grado",
    "library.search": "Buscar",
    "library.grade4": "4.º grado",
    "library.pinAdd": "Añadir a Mis libros (inicio)",
    "library.pinRemove": "Quitar de Mis libros (inicio)",
    "profile.title": "Perfil — Liv Lakay",
    "profile.heading": "Mi perfil",
    "profile.edit": "Editar",
    "profile.adminMode": "Modo administrador",
    "profile.adminHint":
      "Si está activo, verás un botón + en la biblioteca para añadir libros.",
    "profile.menuBooks": "Elegir mis libros",
    "profile.menuLanguage": "Idioma (HT / FR / ES / EN)",
    "profile.menuAbout": "Sobre la aplicación",
    "profile.menuSupport": "Apoyar",
    "profile.langTitle": "Elegir idioma",
    "profile.lang.ht": "Criollo (HT)",
    "profile.lang.fr": "Francés (FR)",
    "profile.lang.es": "Español (ES)",
    "profile.lang.en": "Inglés (EN)",
    "book.pinAdd": "Añadir a Mis libros (inicio)",
    "book.pinRemove": "Quitar de Mis libros (inicio)",
    "book.backLibrary": "← Volver a la biblioteca",
    "book.detailTitle": "Liv — Detalle del libro",
    "book.content": "Contenido",
    "book.chapterHint":
      "Toca un capítulo para leer. Mantén pulsado para editar.",
    "meta.author": "Autor",
    "meta.subject": "Asignatura",
    "meta.year": "Año",
    "auth.signupTitle": "Crear cuenta",
    "auth.loginTitle": "Iniciar sesión",
    "auth.loginSubtitle": "Introduce el correo y la contraseña de tu cuenta.",
    "auth.fullName": "Nombre completo",
    "auth.grade": "Grado (año)",
    "auth.gradePlaceholder": "Elige el grado",
    "auth.accessCode": "Código de acceso",
    "auth.accessCodeHint":
      "Código de un solo uso que recibes al comprar un pase. Escríbelo tal como te lo enviaron (mayúsculas da igual; se ignoran espacios y guiones).",
    "auth.profilePhoto": "Foto de perfil",
    "auth.profilePhotoHint": "JPG o PNG · máx. 5 MB",
    "auth.error.accessCodeWrong": "Código de acceso incorrecto.",
    "auth.error.accessCodeInvalid":
      "Ese código no existe o no es válido. Revisa el código enviado tras tu compra.",
    "auth.error.accessCodeAlreadyUsed":
      "Ese código ya se usó. Un pase da un solo código y sirve para un solo registro.",
    "auth.error.accessCodeInactive": "Ese código ya no está activo.",
    "auth.error.accessCodeRedeemFailed":
      "No pudimos terminar de crear la cuenta con ese código. Inténtalo de nuevo o contacta a soporte.",
    "auth.error.fullNameRequired": "Introduce tu nombre completo.",
    "auth.error.gradeRequired": "Elige tu grado.",
    "auth.error.accessCodeRequired": "Introduce el código de acceso.",
    "auth.error.profilePhotoRequired": "Elige una foto de perfil.",
    "auth.error.imageTooBig": "Imagen demasiado grande (máx. 5 MB).",
    "auth.error.firestorePermission":
      "No se puede leer el código. Consulta livViews/firestore.accessCodes.rules.txt — reglas de accessCodes.",
    "landing.browserTitle": "Liv Lakay",
    "auth.email": "Correo",
    "auth.password": "Contraseña",
    "auth.confirmPassword": "Confirmar contraseña",
    "auth.passwordMismatch": "Las contraseñas no coinciden.",
    "landing.taglineTitle": "Libros escolares para el futuro de Haití",
    "landing.taglineSub": "Accede a la educación",
    "landing.quote1":
      "La primera responsabilidad del Estado es lograr que todas las personas vayan a la escuela. Eso permite el desarrollo del país. El Estado debe fomentar y apoyar a los grupos privados que realizan este trabajo.",
    "landing.quote1Source": "-Artículo 32-2",
    "landing.quote2":
      "La enseñanza primaria es obligatoria para todas las personas. La ley fija sanciones para esto. El Estado dará gratuitamente a los alumnos de primaria los útiles y materiales necesarios.",
    "landing.quote2Source": "-Artículo 32-3",
    "landing.language": "Idioma",
    "landing.buyPass": "Comprar un pase de acceso",
    "landing.passCancelled": "Pago cancelado.",
    "landing.passRevealFail":
      "No pudimos mostrar el código. Recarga la página; puede tardar unos segundos o revisa con soporte.",
    "auth.createAccount": "Crear cuenta",
    "auth.creatingAccount": "Creando tu cuenta...",
    "auth.signIn": "Entrar",
    "auth.forgotPassword": "¿Olvidaste la contraseña?",
    "auth.sendReset": "Enviar enlace",
    "auth.backToLogin": "Volver al inicio de sesión",
    "auth.resetSent": "Revisa tu correo — enviamos un enlace para restablecer.",
    "auth.resetExplain":
      "Introduce el correo de tu cuenta. Te enviaremos un enlace para restablecer la contraseña.",
    "auth.signOut": "Cerrar sesión",
    "auth.goLogin": "Entrar / crear cuenta",
    "auth.guestName": "Invitado",
    "auth.guestHint": "Inicia sesión para guardar tu perfil.",
    "auth.close": "Cerrar",
    "auth.errorTitle": "Error",
    "auth.error.generic": "Error. Inténtalo de nuevo.",
    "auth.error.emailInUse": "Este correo ya está en uso.",
    "auth.error.invalidEmail": "Correo no válido.",
    "auth.error.weakPassword": "Contraseña débil (mín. 6 caracteres).",
    "auth.error.userNotFound": "No hay cuenta con este correo.",
    "auth.error.wrongPassword": "Contraseña incorrecta.",
    "auth.error.invalidCredential": "Correo o contraseña incorrectos.",
    "auth.error.tooManyRequests": "Demasiados intentos. Prueba más tarde.",
    "auth.error.network": "Error de red.",
    "auth.error.operationNotAllowed":
      "El inicio de sesión por correo no está habilitado en Firebase Console (Authentication → Sign-in method).",
    "search.title": "Buscar libro",
    "search.hint":
      "Muchos libros de texto (sobre todo importados) tienen ISBN, pero no todos. El ID interno en la base siempre sirve para un resultado exacto.",
    "search.byCode": "Por ISBN o identificador",
    "search.isbn": "ISBN (10 u 13 caracteres)",
    "search.docId": "ID del libro (en la base, ej. matenatik_5e)",
    "search.orFilters": "O combina:",
    "search.byFilters": "Año, asignatura, autor, texto",
    "search.textQuery": "Palabras en el título o autor",
    "search.run": "Buscar",
    "search.reset": "Mostrar todos los libros",
    "search.close": "Cerrar",
    "search.yearAll": "Todos los años",
    "search.subjectAll": "Todas las asignaturas",
    "search.noResults": "Ningún libro coincide con la búsqueda.",
  },
  en: {
    "home.title": "Home — Liv Lakay",
    "home.pinned": "My books (home)",
    "home.pinnedHint":
      "Tap a book here to remove it from home — it stays in the library.",
    "home.books5e": "5th grade books",
    "home.myBooks": "My books",
    "home.noBooks": "You do not have any books for your grade yet.",
    "home.removeFromMyBooks": "Remove this book from my home",
    "home.removeModalTitle": "Remove book?",
    "home.removeConfirm": 'Do you want to remove "{title}" from your home list?',
    "home.removeYes": "Yes, remove",
    "home.removeCancel": "Cancel",
    "library.title": "Library — Liv Lakay",
    "library.hero": "Library",
    "library.grade5": "5th grade",
    "library.search": "Search",
    "library.grade4": "4th grade",
    "library.pinAdd": "Add to My books (home)",
    "library.pinRemove": "Remove from My books (home)",
    "profile.title": "Profile — Liv Lakay",
    "profile.heading": "My profile",
    "profile.edit": "Edit",
    "profile.adminMode": "Administrator mode",
    "profile.adminHint":
      "When on, a + button appears in the library to add books.",
    "profile.menuBooks": "Choose my books",
    "profile.menuLanguage": "Language (HT / FR / ES / EN)",
    "profile.menuAbout": "About the app",
    "profile.menuSupport": "Support",
    "profile.langTitle": "Choose language",
    "profile.lang.ht": "Haitian Creole (HT)",
    "profile.lang.fr": "French (FR)",
    "profile.lang.es": "Spanish (ES)",
    "profile.lang.en": "English (EN)",
    "book.pinAdd": "Add to My books (home)",
    "book.pinRemove": "Remove from My books (home)",
    "book.backLibrary": "← Back to library",
    "book.detailTitle": "Liv — Book detail",
    "book.content": "Contents",
    "book.chapterHint": "Tap a chapter to read. Long-press to edit.",
    "meta.author": "Author",
    "meta.subject": "Subject",
    "meta.year": "Year",
    "auth.signupTitle": "Create account",
    "auth.loginTitle": "Log in",
    "auth.loginSubtitle": "Enter your account email and password.",
    "auth.fullName": "Full name",
    "auth.grade": "Grade (year)",
    "auth.gradePlaceholder": "Choose grade",
    "auth.accessCode": "Access code",
    "auth.accessCodeHint":
      "One-time code you get when you buy a pass. Enter it as shown (case doesn’t matter; spaces and dashes are ignored).",
    "auth.profilePhoto": "Profile photo",
    "auth.profilePhotoHint": "JPG or PNG · 5 MB max",
    "auth.error.accessCodeWrong": "Access code is not correct.",
    "auth.error.accessCodeInvalid":
      "That code doesn’t exist or isn’t valid. Check the code from your pass purchase email or receipt.",
    "auth.error.accessCodeAlreadyUsed":
      "That code was already used. Each pass has one code and it works for a single new account.",
    "auth.error.accessCodeInactive": "That code is no longer active.",
    "auth.error.accessCodeRedeemFailed":
      "We couldn’t finish creating your account with that code. Try again or contact support.",
    "auth.error.fullNameRequired": "Enter your full name.",
    "auth.error.gradeRequired": "Choose your grade.",
    "auth.error.accessCodeRequired": "Enter the access code.",
    "auth.error.profilePhotoRequired": "Choose a profile photo.",
    "auth.error.imageTooBig": "Image is too large (5 MB max).",
    "auth.error.firestorePermission":
      "Cannot read access code. See livViews/firestore.accessCodes.rules.txt for accessCodes rules.",
    "landing.browserTitle": "Liv Lakay",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm password",
    "auth.passwordMismatch": "Passwords don’t match.",
    "landing.taglineTitle": "School books for Haiti’s future",
    "landing.taglineSub": "Get access to education",
    "landing.quote1":
      "The state’s first responsibility is to ensure everyone can attend school. This is essential for the country’s development. The state should encourage and support private groups doing this work.",
    "landing.quote1Source": "-Article 32-2",
    "landing.quote2":
      "Primary education is mandatory for everyone. The law sets penalties for this. The state provides primary students with standard supplies and other necessary materials free of charge.",
    "landing.quote2Source": "-Article 32-3",
    "landing.language": "Language",
    "landing.buyPass": "Buy an access pass",
    "landing.passCancelled": "Checkout was cancelled.",
    "landing.passRevealFail":
      "We couldn’t load your code yet. Refresh in a few seconds, or check your email / support.",
    "auth.createAccount": "Create account",
    "auth.creatingAccount": "Creating your account...",
    "auth.signIn": "Sign in",
    "auth.forgotPassword": "Forgot password?",
    "auth.sendReset": "Send reset link",
    "auth.backToLogin": "Back to log in",
    "auth.resetSent": "Check your email — we sent a password reset link.",
    "auth.resetExplain":
      "Enter your account email. We will send a password reset link.",
    "auth.signOut": "Sign out",
    "auth.goLogin": "Log in / create account",
    "auth.guestName": "Guest",
    "auth.guestHint": "Sign in to save your profile.",
    "auth.close": "Close",
    "auth.errorTitle": "Error",
    "auth.error.generic": "Something went wrong. Try again.",
    "auth.error.emailInUse": "This email is already in use.",
    "auth.error.invalidEmail": "Invalid email address.",
    "auth.error.weakPassword": "Password too weak (at least 6 characters).",
    "auth.error.userNotFound": "No account with this email.",
    "auth.error.wrongPassword": "Wrong password.",
    "auth.error.invalidCredential": "Incorrect email or password.",
    "auth.error.tooManyRequests": "Too many attempts. Try again later.",
    "auth.error.network": "Network error.",
    "auth.error.operationNotAllowed":
      "Email/password sign-in is not enabled in Firebase Console (Authentication → Sign-in method).",
    "search.title": "Search books",
    "search.hint":
      "Many textbooks (especially imported ones) have an ISBN, but not all. The book’s internal database ID always works for an exact match.",
    "search.byCode": "By ISBN or ID",
    "search.isbn": "ISBN (ISBN-10 or ISBN-13)",
    "search.docId": "Book ID in the database (e.g. matenatik_5e)",
    "search.orFilters": "Or combine filters:",
    "search.byFilters": "Year, subject, author, text",
    "search.textQuery": "Words in title or author name",
    "search.run": "Search",
    "search.reset": "Show all books",
    "search.close": "Close",
    "search.yearAll": "All years",
    "search.subjectAll": "All subjects",
    "search.noResults": "No books match your search.",
  },
};

function getLang() {
  try {
    const raw = localStorage.getItem(LANG_KEY);
    const trimmed = raw != null ? String(raw).trim() : "";
    if (!trimmed) return "ht";
    const lower = trimmed.toLowerCase();
    if (LANGS.includes(lower)) return lower;
  } catch (e) {
    /* private mode / blocked storage */
  }
  return "ht";
}

export function setLivLang(lang) {
  const lower = lang != null ? String(lang).trim().toLowerCase() : "";
  if (!LANGS.includes(lower)) return;
  try {
    localStorage.setItem(LANG_KEY, lower);
  } catch (e) {
    /* ignore */
  }
}

export function getLivLang() {
  return getLang();
}

function normalizeI18nKey(key) {
  return String(key)
    .trim()
    .replace(/^\ufeff/, "")
    .replace(/\u200b/g, "");
}

/** Preferred locale, then Haitian Creole, then any other table — avoids showing raw keys if one language is incomplete. */
export function t(key) {
  if (key == null) return "";
  const k = normalizeI18nKey(key);
  if (!k) return "";
  const lang = getLang();
  const table = STRINGS[lang] || STRINGS.ht;
  const primary = table[k];
  if (primary != null && primary !== "") return primary;
  const htFallback = STRINGS.ht[k];
  if (htFallback != null && htFallback !== "") return htFallback;
  for (let i = 0; i < LANGS.length; i++) {
    const L = LANGS[i];
    if (L === lang) continue;
    const v = STRINGS[L] && STRINGS[L][k];
    if (v != null && v !== "") return v;
  }
  return k;
}

export function applyLivI18n(root = document) {
  const lang = getLang();
  document.documentElement.lang = lang;

  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const raw = el.getAttribute("data-i18n");
    const key = normalizeI18nKey(raw != null ? raw : "");
    if (!key) return;
    const val = t(key);
    if (val === key) {
      const prev = el.textContent.trim();
      if (prev && !/^[a-z]+\.[a-z0-9.]+$/i.test(prev)) return;
    }
    if (el.tagName === "TITLE") {
      document.title = val;
    } else {
      el.textContent = val;
    }
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const raw = el.getAttribute("data-i18n-placeholder");
    const key = normalizeI18nKey(raw != null ? raw : "");
    if (key) el.setAttribute("placeholder", t(key));
  });

  root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const raw = el.getAttribute("data-i18n-aria");
    const key = normalizeI18nKey(raw != null ? raw : "");
    if (key) el.setAttribute("aria-label", t(key));
  });
}

export function initLivI18n() {
  applyLivI18n();
  window.addEventListener("storage", function (e) {
    if (e.key === LANG_KEY) applyLivI18n();
  });
}

export { LANGS, LANG_KEY };

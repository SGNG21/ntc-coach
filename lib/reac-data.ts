import type { ModuleConfig, ModuleId } from '@/types';

export const MODULES: Record<ModuleId, ModuleConfig> = {
  veille: {
    label: 'CP1 — Veille commerciale',
    ccp: 'CCP1',
    desc: 'Organiser et mettre en œuvre la veille commerciale pour maintenir son expertise sur produits, services et concurrents. Outils IA, CRM, analyse PESTEL, tendances RSE.',
    criteres: [
      'Outils de veille utilisés sont appropriés au contexte de l\'entreprise',
      'Données recherchées sont pertinentes par rapport à l\'objectif de la veille',
      'Données issues de la veille sont actualisées',
      'Stratégie de veille est ajustée en fonction des évolutions du contexte',
      'Analyse du positionnement des produits et des services est étayée par les données issues de la veille',
      'Propositions faites en matière de stratégie de veille sont argumentées et étayées par des données',
    ],
    savoirs: [
      'Sources : presse pro, bases de données, réseaux sociaux, newsletters concurrents, Google Alerts, Feedly',
      'Outils IA pour analyser évolutions secteur et actualiser personas en continu',
      'Analyse positionnement : PESTEL, Porter 5 forces, SWOT concurrentiel',
      'Veille RSE : technologies vertes, organisations éco-responsables, empreinte carbone ADEME',
      'CRM/e-CRM pour veille sur processus d\'investissement clients',
      'ESS, SCOP, SCIC — loi du 31 juillet 2014, CSESS, CNCRESS, CRESS',
      'Impact numérique : empreinte carbone d\'un mail, étude ADEME/Arcep 3 volets',
    ],
    qps: ['Sources de veille', 'PESTEL & Porter', 'Veille avec l\'IA', 'Analyser la concurrence', 'Veille RSE/écologique', 'Rédiger un rapport de veille'],
  },

  pac: {
    label: 'CP2 — Plan d\'actions commerciales',
    ccp: 'CCP1',
    desc: 'Contribuer à l\'élaboration du PAC. Déterminer KPIs avec la hiérarchie. Planifier actions selon objectifs. Géo-optimisation des tournées. Ajuster en continu selon évolutions marché.',
    criteres: [
      'Plan d\'actions commerciales est élaboré en fonction des spécificités du secteur',
      'Besoins et attentes spécifiques des entreprises prospects/clientes sont pris en compte',
      'Actions du plan commercial sont ajustées en fonction des évolutions du marché, des tendances sectorielles et des changements dans l\'environnement économique',
      'Opportunités de développement des affaires sont identifiées',
    ],
    savoirs: [
      'Structure PAC : Analyse marché → Cibles → Objectifs SMART → Actions → Calendrier → KPIs',
      'Personas : profils idéaux des entreprises à cibler par segment de marché',
      'KPIs commerciaux : leads générés, taux de conversion, CA réalisé, nb visites',
      'Logiciel de géo-optimisation pour rationaliser tournées en mode éco-responsable',
      'Techniques de gestion du temps et organisation des visites terrain',
      'SEM, SEO, SEA, modèle BERT pour content pruning site web',
      'Sobriété numérique : réduction consommables, optimisation stockage emails',
    ],
    qps: ['Structurer un PAC', 'Objectifs SMART', 'Créer des personas', 'KPIs commerciaux', 'Géo-optimisation tournées', 'Content pruning'],
  },

  prospection: {
    label: 'CP3 — Prospecter un secteur défini',
    ccp: 'CCP1',
    desc: 'Créer personas, combiner inbound/outbound, contacter par canal approprié, passer barrages, qualifier fichier, évaluer et ajuster en continu. RGPD et loi Naegelen.',
    criteres: [
      'Données relatives aux attentes et aux besoins des entreprises prospects/clientes sont recueillies de façon ciblée par rapport à l\'objectif et aux caractéristiques des produits et des services',
      'Outils de gestion de la relation client (CRM et e-CRM), les plateformes d\'automatisation du marketing et les outils de l\'IA sont utilisés à bon escient pour recueillir des données',
      'Personas sont créés à partir des données',
      'Entreprise prospect est contactée par le canal le plus approprié par rapport à son persona',
      'Fichier prospects/clients est qualifié et mis à jour',
      'Actions de prospection sont évaluées et ajustées en continu',
    ],
    savoirs: [
      'Inbound marketing : attirer les prospects par le contenu (SEO, réseaux sociaux, blog)',
      'Outbound : cold email, phoning CROC, prospection terrain, LinkedIn Sales Navigator',
      'Technique CROC : Contact → Raison → Objectif → Conclusion',
      'Passer les barrages téléphoniques : techniques et phrases clés',
      'Loi de Pareto 80/20 pour priorisation portefeuille clients',
      'RGPD, ePrivacy, CNIL — contraintes protection données clients prospects',
      'Loi Naegelen 2020-901 : authentification des numéros de téléphone',
      'Décision Arcep 2018-0881 : règles communication avec les clients',
    ],
    qps: ['Technique CROC', 'Passer les barrages', 'Inbound vs outbound', 'Créer et utiliser des personas', 'RGPD & prospection', 'Qualifier un prospect'],
  },

  perf: {
    label: 'CP4 — Analyser performances & actions correctives',
    ccp: 'CCP1',
    desc: 'Suivre les KPIs, identifier les écarts, proposer des axes d\'amélioration alignés sur les objectifs, partager régulièrement avec la hiérarchie.',
    criteres: [
      'Suivi et l\'analyse des KPI sont effectués',
      'Écarts entre les résultats réalisés avec les objectifs fixés sont évalués',
      'Facteurs qui ont contribué aux performances et les obstacles rencontrés sont identifiés',
      'Propositions relatives aux ajustements nécessaires pour atteindre les objectifs prennent en compte le contexte de l\'entreprise et celui de l\'entreprise cliente',
      'Détermination des ressources nécessaires aux ajustements tient compte des contraintes de l\'entreprise et de celles de l\'entreprise cliente',
      'Solution proposée est optimale compte tenu du contexte de l\'entreprise et de celui du client',
      'Actions correctives sont alignées avec les objectifs de l\'entreprise',
    ],
    savoirs: [
      'KPIs clés : nombre ventes réalisées, leads générés, taux de conversion, CA réalisé',
      'Tableau de bord commercial : construire, lire, exploiter, alimenter via CRM',
      'Calculs commerciaux : pourcentage additif/soustractif, marge brute/nette, point mort, TVA, ratios',
      'Seuil de rentabilité : calcul et interprétation',
      'Décliner un objectif global en sous-objectifs opérationnels mesurables',
      'Compte-rendu d\'activité : rédiger, structurer, adapter au destinataire',
      'Analyser la gestion de son temps et identifier les points de perte',
    ],
    qps: ['Calculer taux de conversion', 'Construire un tableau de bord', 'Calcul marge & seuil rentabilité', 'Analyser les écarts objectifs/réalisé', 'Rédiger un compte-rendu', 'Décliner des sous-objectifs SMART'],
  },

  image: {
    label: 'CP5 — Représenter l\'entreprise & valoriser son image',
    ccp: 'CCP2',
    desc: 'Présenter produits/services de façon valorisante et adaptée au canal. Créer et utiliser profil pro sur réseaux sociaux. Surveiller e-réputation en continu. Personal branding.',
    criteres: [
      'Présentation des produits, solutions, savoir-faire et services est valorisante et adaptée à l\'interlocuteur et au canal de communication',
      'Profil professionnel est créé et utilisé sur les réseaux sociaux dans le respect de la charte et des consignes',
      'E-réputation de l\'entreprise est entretenue et surveillée en continu',
    ],
    savoirs: [
      'Personal branding : créer et maintenir son image professionnelle en ligne',
      'LinkedIn : profil pro optimisé, publications, social selling, SSI score',
      'Elevator pitch : présentation percutante en 30-60 secondes',
      'Différents statuts du VRP : exclusif, multicartes, salarié, agent commercial',
      'Media selling : adapter la présentation au réseau et à l\'interlocuteur',
      'E-réputation : surveiller, répondre aux avis, community management',
      'Panorama des médias sociaux et leurs caractéristiques pour le B2B',
    ],
    qps: ['Créer son elevator pitch', 'LinkedIn pour les commerciaux', 'Personal branding', 'Gérer l\'e-réputation', 'Statuts VRP', 'Présenter son offre sur les réseaux'],
  },

  proposition: {
    label: 'CP6 — Concevoir une proposition technico-commerciale',
    ccp: 'CCP2',
    desc: 'Concevoir une offre personnalisée réalisable, rentable et éco-compatible. Construire argumentaire CAP. Anticiper les objections. Collaboration avec services internes.',
    criteres: [
      'Informations relatives aux besoins de l\'entreprise prospect/cliente sont recueillies',
      'Offre de la concurrence est analysée',
      'Proposition technique et commerciale personnalisée est en adéquation avec les objectifs et les priorités de l\'entreprise prospect/cliente',
      'Proposition intègre les éléments liés au développement durable',
      'Proposition est adaptée à l\'évolution des besoins de l\'entreprise prospect/cliente à long terme',
      'Avantages tangibles et intangibles de la proposition sont mis en avant',
      'Proposition est réalisable d\'un point de vue technique',
      'Proposition est rentable d\'un point de vue commercial',
    ],
    savoirs: [
      'Méthode CAP : Caractéristique → Avantage → Preuve (argumentaire structuré)',
      'SONCAS : Sécurité, Orgueil, Nouveauté, Confort, Argent, Sympathie — motivations d\'achat',
      'Conditions générales de vente (CGV) : éléments obligatoires, opposabilité',
      'Calculs commerciaux pour chiffrer une offre (marge, remise, TVA)',
      'Obligations environnementales liées à la vente : après-vie produits, loi AGEC',
      'Dossier client : constituer, structurer, utiliser pour personnaliser l\'offre',
      'Analyser forces/faiblesses concurrentes pour différencier la proposition',
    ],
    qps: ['Méthode CAP en pratique', 'Motivations SONCAS', 'Chiffrer une offre commerciale', 'Intégrer le RSE dans l\'offre', 'CGV et conditions', 'Construire un dossier client'],
  },

  nego: {
    label: 'CP7 — Négocier une solution technique et commerciale',
    ccp: 'CCP2',
    desc: 'Mener l\'entretien de vente avec posture d\'expert-conseil. Argumenter, traiter les objections, intégrer la dimension écologique, conclure la vente et assurer le suivi.',
    criteres: [
      'Négociation de la solution répond aux attentes de l\'entreprise prospect/cliente',
      'Présentation est personnalisée et s\'appuie sur des supports adaptés',
      'Posture d\'expert conseil est adoptée',
      'Avantages du produit ou du service sont illustrés avec le support adapté',
      'Dimension écologique est intégrée dans les échanges',
      'Argumentation est pertinente',
      'Objections sont traitées de manière factuelle et valorisent la solution',
    ],
    savoirs: [
      'Étapes entretien de vente : Prise de contact → Découverte → Argumentation → Objections → Conclusion → Prise de congé',
      'CRAC pour traiter objections : Creuser → Reformuler → Argumenter → Contrôler',
      'Signaux d\'achat : verbaux, non-verbaux, comportementaux — savoir les détecter',
      'Techniques de closing : alternatif, résumé des avantages, accord partiel, silence',
      'Présenter et défendre le prix : ancrage, valeur perçue, décomposition bénéfices',
      'Écoute active : reformulation, QQOQCP, questions ouvertes/fermées',
      'Adapter son discours aux interlocuteurs techniques et non techniques',
    ],
    qps: ['Étapes entretien de vente', 'Méthode CRAC objections', 'Techniques de closing', 'Présenter et défendre le prix', 'Signaux d\'achat', 'Écoute active QQOQCP'],
  },

  bilan: {
    label: 'CP8 — Bilan, ajuster activité & rendre compte',
    ccp: 'CCP2',
    desc: 'Réaliser bilan exhaustif depuis CRM. Dégager tendances, analyser écarts, proposer mesures correctives, identifier nouvelles opportunités. Rédiger rapports clairs.',
    criteres: [
      'Bilan de l\'activité commerciale est régulièrement réalisé et analysé',
      'Écarts entre les résultats obtenus et les objectifs fixés sont analysés',
      'Propositions des mesures correctives mènent à des ajustements réalisables',
      'Nouvelles opportunités sont identifiées et les plans d\'actions sont élaborés',
      'Comptes rendus sont clairs et exploitables par des tiers',
    ],
    savoirs: [
      'Exploiter les données CRM/e-CRM pour réaliser un bilan complet',
      'Analyser les tendances : réalisé vs objectif, identification des facteurs clés',
      'SEM, SEO, SEA, modèle BERT pour optimiser présence digitale et content pruning',
      'Comptabilité et finance : bilan simplifié, compte de résultat, ratios commerciaux',
      'Techniques d\'analyse de marché et de segmentation pour identifier opportunités',
      'Construire un reporting structuré : rapport d\'activité, présentation hiérarchie',
    ],
    qps: ['Analyser son CRM', 'Construire un rapport d\'activité', 'Analyser tendances et écarts', 'Identifier de nouvelles opportunités', 'SEM/SEO/SEA basiques', 'Réaliser un bilan mensuel'],
  },

  relation: {
    label: 'CP9 — Optimiser la gestion de la relation client',
    ccp: 'CCP2',
    desc: 'Assurer le suivi des solutions, actualiser les personas, anticiper les besoins, garantir une expérience cohérente sur tous les points de contact, fidéliser.',
    criteres: [
      'Suivi de la mise en œuvre des solutions de l\'entreprise cliente est assuré',
      'Opportunités d\'amélioration de l\'offre de produits et de services sont identifiées pour actualiser les personas',
      'Besoins sont anticipés et les propositions sont améliorées de manière proactive',
      'Expérience client est cohérente à travers tous les points de contact',
      'Communication avec les entreprises clientes est régulière et transparente',
    ],
    savoirs: [
      'Cycle de vie client : Prospect → Client → Fidèle → Ambassadeur',
      'Outils CRM/e-CRM : Salesforce, HubSpot, Pipedrive — fonctionnalités commerciales',
      'KPIs satisfaction : NPS (Net Promoter Score), CSAT, taux de rétention, LTV',
      'Actions de fidélisation : upsell, cross-sell, contrats récurrents, programmes fidélité',
      'Omnicanalité : cohérence expérience sur tous les canaux (physique, web, téléphone, réseaux)',
      'Gestion proactive des réclamations et conflits pour maintenir la confiance',
      'Actualiser les personas à partir des retours clients et suivi de mise en œuvre',
    ],
    qps: ['Cycle de vie client', 'Outils CRM en pratique', 'NPS et CSAT', 'Fidélisation BtoB', 'Omnicanalité', 'Gérer une réclamation client'],
  },

  transversal: {
    label: 'Compétences transversales',
    ccp: 'Transversal',
    desc: '5 compétences transversales évaluées au travers de toutes les compétences professionnelles : Communiquer, Comportement orienté vers l\'autre, Rechercher un accord, Évaluer ses actions, Résolution de problème.',
    criteres: [
      'Communication orale adaptée au contexte et au destinataire',
      'Temps alloué à la communication orale est respecté',
      'Visuels sont adaptés à l\'objet de la communication et aux destinataires',
      'Notes et synthèses sont claires et factuelles, adaptées au contexte',
      'Relation établie avec le prospect/client est positive',
      'Besoins non exprimés sont formulés et la réponse est adaptée',
      'Conditions favorables à la négociation sont créées',
      'Indicateurs de performance sont suivis en permanence',
      'Mesures correctives définies sont réalistes et adaptées',
    ],
    savoirs: [
      'Communication interpersonnelle : émetteur, récepteur, code, canal, rétroaction',
      'Techniques de communication écrite : synthèse, note, compte-rendu, email professionnel',
      'Communication non-verbale : posture, regard, voix, gestuelle',
      'Résolution de problème : identifier → analyser causes → définir solutions → évaluer efficacité',
      'Gestion du stress et des situations de tension commerciale',
      'Écoute active, empathie, intelligence émotionnelle dans la relation commerciale',
    ],
    qps: ['Communication professionnelle écrite', 'Écoute active en pratique', 'Gérer un conflit client', 'Résolution de problème', 'Évaluer ses propres actions', 'Posture commerciale'],
  },

  digital: {
    label: 'Outils digitaux & IA',
    ccp: 'Transversal',
    desc: 'Maîtriser les outils numériques d\'aide à la vente, les CRM, les plateformes d\'automatisation du marketing, les outils IA, le social selling et la sobriété numérique.',
    criteres: [
      'Outils numériques utilisés à bon escient',
      'CRM/e-CRM maîtrisés et alimentés en continu',
      'Social selling pratiqué de façon cohérente avec la stratégie de l\'entreprise',
    ],
    savoirs: [
      'CRM : Salesforce, HubSpot, Pipedrive, Zoho — fonctionnalités commerciales clés',
      'Outils IA : analyser secteur, créer personas, rédiger offres, préparer entretiens',
      'Automatisation marketing : séquences email, lead scoring, nurturing',
      'Social selling LinkedIn : SSI score, InMail, Sales Navigator, publications',
      'Sobriété numérique : empreinte carbone d\'un mail (4g CO2), calcul ADEME, étude ADEME/Arcep',
      'SEM, SEO, SEA : comprendre les stratégies de visibilité digitale',
      'Modèle BERT : Bidirectional Encoder Representations from Transformers — algorithme Google',
    ],
    qps: ['Utiliser l\'IA en prospection', 'LinkedIn Sales Navigator', 'Automatisation emailing', 'Calculer son empreinte numérique', 'SEO/SEA basiques', 'CRM fonctionnalités clés'],
  },

  rse: {
    label: 'RSE & transition écologique',
    ccp: 'Transversal',
    desc: 'Intégrer les enjeux RSE dans toute la démarche commerciale. Connaître les textes de loi, l\'ESS, et sensibiliser les interlocuteurs aux conséquences de leurs choix.',
    criteres: [
      'Dimension écologique intégrée dans les propositions commerciales et les échanges',
      'Interlocuteurs sensibilisés aux conséquences de leurs choix à moyen et long terme',
    ],
    savoirs: [
      'Loi AGEC (10/02/2020) : lutte contre gaspillage et économie circulaire — indice de réparabilité',
      'Loi Climat et résilience (22/08/2021) : renforcement de la résilience face au dérèglement climatique',
      'ESS : Économie Sociale et Solidaire — définition, acteurs, loi 31 juillet 2014',
      'SCOP (Sociétés Coopératives et Participatives) et SCIC (d\'Intérêt Collectif)',
      'Structures ESS : CSESS, ESS France, CNCRESS, CRESS — rôles et missions',
      'Empreinte carbone d\'un mail : 4g CO2 en moyenne — calcul ADEME usage numérique',
      'Étude ADEME/Arcep 3 volets : empreinte environnementale du numérique en France',
      'Indice d\'impact humain dans l\'entreprise — capital humain selon l\'OCDE',
    ],
    qps: ['Loi AGEC expliquée', 'ESS et SCOP/SCIC', 'Empreinte carbone numérique', 'Indice de réparabilité', 'Argumenter RSE auprès d\'un client', 'Loi Climat et résilience 2021'],
  },

  juridique: {
    label: 'Cadre juridique commercial',
    ccp: 'Transversal',
    desc: 'Connaître le cadre légal de la prospection, de la vente et de la protection des données. RGPD, CGV, loi Naegelen, décision Arcep, droit des contrats.',
    criteres: [
      'Cadre juridique lié à la vente de produits/services maîtrisé et transmis au client',
      'Contraintes RGPD respectées dans la gestion des interactions et communications',
    ],
    savoirs: [
      'RGPD : consentement explicite, droit à l\'oubli, portabilité des données, rôle de la CNIL',
      'ePrivacy : cookies et communications électroniques — règles d\'application',
      'Loi Naegelen (2020-901) : authentification des numéros de téléphone en prospection',
      'Décision Arcep 2018-0881 : règles régissant la communication avec les clients',
      'Décrets réglementant le démarchage téléphonique — listes de blocage',
      'CGV (Conditions Générales de Vente) : éléments obligatoires, opposabilité, délais',
      'Droit de la vente : formation du contrat (offre + acceptation), vice du consentement, nullité',
      'Réglementation sur les manifestations commerciales et la vente hors établissement',
    ],
    qps: ['RGPD en pratique commerciale', 'Loi Naegelen et phoning', 'CGV obligatoires', 'Formation d\'un contrat de vente', 'Démarchage téléphonique règles', 'CNIL et données clients'],
  },
};

export const CCF_SIMULATION_SYSTEMS: Record<string, string> = {
  prosp_tel: `Tu joues le rôle d'un PROSPECT (responsable d'entreprise BtoB) qui reçoit un appel de prospection commerciale.
Tu es occupé, un peu méfiant au départ, mais tu restes professionnel.
Comportement : pose des objections réalistes, demande des précisions, accepte le RDV si l'argumentation est solide.
À la fin de l'échange, donne un feedback précis basé sur les critères du REAC NTC 2024 :
- Susciter l'intérêt dès les premières secondes
- Passer les barrages téléphoniques
- Recueillir des informations sur les besoins
- Proposer un RDV de façon convaincante
Réponds de façon courte et naturelle comme un vrai prospect.`,

  nego_face: `Tu joues le rôle d'un DÉCIDEUR dans un entretien de vente en face-à-face.
Tu as des objections concrètes (prix, délais, solution déjà en place, besoin pas encore défini).
Tu peux demander des justifications techniques précises.
À la fin, évalue : posture expert-conseil, méthode CAP, traitement objections CRAC, intégration dimension écologique, closing.
Réponds de façon réaliste comme un acheteur B2B exigeant mais de bonne foi.`,

  entretien_tech: `Tu joues le rôle d'un JURY de Titre Professionnel NTC.
Tu poses des questions précises sur les activités du candidat : veille commerciale (CP1), PAC (CP2), relation client (CP9).
Tes questions s'appuient sur les critères d'évaluation officiels du REAC 2024.
Tu es professionnel, bienveillant mais exigeant. Tu attends des réponses structurées et ancrées dans la réalité terrain.
Évalue la maîtrise des compétences à l'issue de l'entretien en citant les critères REAC.`,
};

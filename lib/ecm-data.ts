export type EcmId =
  | 'rh' | 'marketing' | 'compta' | 'droit' | 'bureautique'
  | 'anglais' | 'macro_eco' | 'orga_travail' | 'communication' | 'rapport_activite';

export interface EcmMatiere {
  id: EcmId;
  label: string;
  emoji: string;
  color: string;
  description: string;
  objectifs: string[];
  programme: { title: string; points: string[] }[];
  motsCles: string[];
  liensNTC: string[];
}

export const ECM_MATIERES: Record<EcmId, EcmMatiere> = {
  rh: {
    id: 'rh',
    label: 'Ressources Humaines',
    emoji: '👥',
    color: '#e8765c',
    description: 'Comprendre le cadre juridique du travail, les types de contrats, la rémunération commerciale et le management d\'une équipe de vente.',
    objectifs: [
      'Maîtriser les différents contrats de travail (CDI, CDD, VRP) et leurs spécificités',
      'Comprendre la structure de la rémunération variable et des commissions commerciales',
      'Identifier le rôle du management dans la performance commerciale',
      'Connaître les instances représentatives du personnel (CSE) et les OPCO',
    ],
    programme: [
      {
        title: '📋 Contrats de travail',
        points: [
          'CDI : contrat à durée indéterminée — règles de rupture, préavis, licenciement',
          'CDD : contrat à durée déterminée — conditions, renouvellement, requalification',
          'VRP : Voyageur Représentant Placier — statut spécifique, exclusivité, carte',
          'Portage salarial, freelance, auto-entrepreneur dans le commercial',
          'Période d\'essai, clause de non-concurrence, clause de mobilité',
        ],
      },
      {
        title: '💰 Rémunération commerciale',
        points: [
          'Fixe + variable : structure de la rémunération commerciale BtoB',
          'Commissions : calcul, barème dégressif/progressif, seuil de déclenchement',
          'Primes : sur objectifs (challenge), d\'intéressement, de participation',
          'Avantages en nature : voiture de fonction, téléphone, frais professionnels',
          'Charges sociales : patronales et salariales, coût total employeur',
        ],
      },
      {
        title: '👔 Management commercial',
        points: [
          'Styles de management : directif, participatif, délégatif, persuasif (Hersey & Blanchard)',
          'Motivation : théorie de Maslow, Herzberg (facteurs d\'hygiène et motivants)',
          'Animation équipe commerciale : réunion, brief, coaching terrain',
          'Entretien annuel d\'évaluation et entretien professionnel (tous les 2 ans)',
          'Recrutement commercial : sourcing, entretien structuré, intégration onboarding',
        ],
      },
      {
        title: '🏛️ Institutions et représentation',
        points: [
          'CSE (Comité Social et Économique) : rôle, composition, seuils d\'effectif',
          'OPCO : Opérateurs de Compétences — financement formation professionnelle',
          'CPF : Compte Personnel de Formation — droits et utilisation',
          'Convention collective : définition, application dans le commerce',
        ],
      },
      {
        title: '⚖️ Droit du travail appliqué',
        points: [
          'Durée du travail : 35h, heures supplémentaires, forfait jours cadres',
          'Congés payés : acquisition, prise, report',
          'Discrimination à l\'embauche : critères prohibés, égalité H/F',
          'Harcèlement moral/sexuel : définition, prévention, procédure',
        ],
      },
    ],
    motsCles: ['CDI', 'CDD', 'VRP', 'Commission', 'Variable', 'Management', 'CSE', 'OPCO', 'Motivation', 'Recrutement', 'Onboarding', 'CPF'],
    liensNTC: ['CP7 — Négocier la solution', 'CP8 — Bilan & rendre compte', 'CP9 — Gestion relation client'],
  },

  marketing: {
    id: 'marketing',
    label: 'Marketing',
    emoji: '📣',
    color: '#f5a623',
    description: 'Analyser les marchés, concevoir des stratégies marketing BtoB/BtoC et piloter les actions commerciales avec les bons KPIs.',
    objectifs: [
      'Réaliser une étude de marché et analyser l\'environnement avec les outils PESTEL, SWOT, Porter',
      'Comprendre les comportements d\'achat BtoB et BtoC et créer des personas',
      'Maîtriser le marketing mix (4P) et les stratégies inbound/outbound',
      'Calculer et interpréter les KPIs marketing (CAC, LTV, taux de conversion)',
    ],
    programme: [
      {
        title: '🔍 Étude de marché',
        points: [
          'Étude quantitative vs qualitative : objectifs, méthodes, échantillonnage',
          'Sources primaires (enquête, entretien) et secondaires (INSEE, Eurostat, sectorielles)',
          'PESTEL : Politique, Économique, Socioculturel, Technologique, Écologique, Légal',
          'Porter 5 forces : concurrents, nouveaux entrants, substituts, fournisseurs, clients',
          'SWOT : Forces, Faiblesses, Opportunités, Menaces — synthèse stratégique',
        ],
      },
      {
        title: '👤 Comportements d\'achat',
        points: [
          'BtoC : processus AIDA, besoins Maslow, frein/motivations, influence sociale',
          'BtoB : centre d\'achat (DMU), processus d\'achat, critères de sélection fournisseur',
          'SONCAS : Sécurité, Orgueil, Nouveauté, Confort, Argent, Sympathie',
          'Création de personas : données démographiques, comportements, frustrations, objectifs',
          'Customer journey map : points de contact, émotions, opportunités',
        ],
      },
      {
        title: '📦 Marketing mix (4P)',
        points: [
          'Produit : cycle de vie, gamme, packaging, positionnement',
          'Prix : stratégies (écrémage, pénétration, alignement), élasticité',
          'Place (distribution) : canal direct, indirect, e-commerce, phygital',
          'Promotion : publicité, promotion des ventes, relations presse, événementiel',
          'Extension 7P : Personnes, Processus, Preuve physique (services)',
        ],
      },
      {
        title: '📲 Marketing digital',
        points: [
          'Inbound marketing : SEO, content marketing, lead nurturing, landing page',
          'Outbound : emailing, cold calling, publicité payante (SEA/Display)',
          'Social selling : LinkedIn SSI, content stratégique, engagement, InMail',
          'Marketing automation : séquences email, scoring, CRM intégration',
        ],
      },
      {
        title: '📊 KPIs et pilotage',
        points: [
          'CAC (Coût d\'Acquisition Client) : total dépenses marketing ÷ nouveaux clients',
          'LTV (Lifetime Value) : valeur totale générée par un client sur sa durée de vie',
          'Taux de conversion : leads → prospects → clients',
          'ROI marketing : (gain - coût) ÷ coût × 100',
          'NPS, CSAT, CES : mesurer la satisfaction et l\'expérience client',
        ],
      },
    ],
    motsCles: ['PESTEL', 'SWOT', 'Porter', 'SONCAS', 'Persona', 'Inbound', 'Outbound', 'CAC', 'LTV', 'SEO', 'Marketing mix', 'BtoB'],
    liensNTC: ['CP1 — Veille commerciale', 'CP2 — Plan d\'actions commerciales', 'CP3 — Prospecter un secteur'],
  },

  compta: {
    id: 'compta',
    label: 'Comptabilité',
    emoji: '📊',
    color: '#4ecdc4',
    description: 'Lire les documents financiers d\'une entreprise, calculer les marges, comprendre la rentabilité et utiliser les tableaux de bord commerciaux.',
    objectifs: [
      'Lire et interpréter un bilan et un compte de résultat',
      'Calculer la marge brute, nette, le taux de marque et le taux de marge',
      'Déterminer le seuil de rentabilité et le point mort',
      'Construire et analyser un tableau de bord commercial',
    ],
    programme: [
      {
        title: '📋 Documents comptables',
        points: [
          'Bilan : actif (ce que l\'entreprise possède) / passif (ce qu\'elle doit)',
          'Compte de résultat : produits - charges = résultat net',
          'Soldes Intermédiaires de Gestion (SIG) : VA, EBE, résultat d\'exploitation',
          'Annexe comptable : informations complémentaires obligatoires',
          'Liasse fiscale et publication des comptes (KBIS, Infogreffe)',
        ],
      },
      {
        title: '💹 Marges et rentabilité',
        points: [
          'Marge brute = CA - Coût d\'achat des marchandises vendues',
          'Taux de marge = Marge brute ÷ Prix d\'achat HT × 100',
          'Taux de marque = Marge brute ÷ Prix de vente HT × 100',
          'Marge nette = Résultat net ÷ CA × 100',
          'Marge sur coût variable (MCV) = CA - Charges variables',
        ],
      },
      {
        title: '📍 Seuil de rentabilité',
        points: [
          'Charges fixes vs charges variables : distinction et exemples',
          'Seuil de rentabilité = Charges fixes ÷ Taux de MCV',
          'Point mort = SR ÷ (CA ÷ 365) — nombre de jours pour atteindre le SR',
          'Marge de sécurité = CA réel - SR (résistance aux baisses d\'activité)',
          'Levier opérationnel : sensibilité du résultat aux variations du CA',
        ],
      },
      {
        title: '🧾 TVA et fiscalité',
        points: [
          'TVA collectée (ventes) - TVA déductible (achats) = TVA à payer',
          'Taux de TVA : 20% normal, 10% réduit, 5,5% réduit+, 2,1% super-réduit',
          'Régimes TVA : franchise en base, réel simplifié, réel normal',
          'IS (Impôt sur les Sociétés) : taux 25%, acomptes, déclaration',
        ],
      },
      {
        title: '📈 Tableaux de bord',
        points: [
          'KPIs commerciaux : CA, panier moyen, nb transactions, taux de transformation',
          'Pipeline commercial : nombre de leads × taux de conversion × valeur moyenne',
          'Reporting mensuel : écart réel/objectif, analyse des causes',
          'Budget prévisionnel vs réalisé : gestion des écarts',
        ],
      },
    ],
    motsCles: ['Bilan', 'Compte de résultat', 'Marge brute', 'Taux de marque', 'Seuil de rentabilité', 'Point mort', 'Charges fixes', 'TVA', 'EBE', 'Dashboard', 'Pipeline', 'Budget'],
    liensNTC: ['CP4 — Analyser performances', 'CP8 — Bilan & rendre compte', 'CP2 — Plan d\'actions commerciales'],
  },

  droit: {
    id: 'droit',
    label: 'Droit',
    emoji: '⚖️',
    color: '#a29bfe',
    description: 'Connaître les règles juridiques applicables à l\'activité commerciale : contrats, CGV, protection des données, droit de la consommation et concurrence.',
    objectifs: [
      'Maîtriser la formation et la validité des contrats commerciaux',
      'Appliquer le RGPD dans la prospection et la gestion client',
      'Connaître les règles sur la concurrence et la propriété intellectuelle',
      'Comprendre les spécificités de la loi Naegelen et des CGV',
    ],
    programme: [
      {
        title: '📝 Formation des contrats',
        points: [
          'Conditions de validité : consentement, capacité, objet licite, cause',
          'Vices du consentement : erreur, dol, violence — nullité relative',
          'Offre et acceptation : délai, rétractation, contrat à distance',
          'Conditions Générales de Vente (CGV) : mentions obligatoires, opposabilité',
          'Droit de rétractation 14 jours (BtoC) — inapplicable en BtoB',
        ],
      },
      {
        title: '🔒 RGPD et données personnelles',
        points: [
          'Principes RGPD : licéité, minimisation, exactitude, limitation de durée',
          'Bases légales : consentement, contrat, intérêt légitime, obligation légale',
          'Droits des personnes : accès, rectification, effacement, portabilité, opposition',
          'CNIL : autorité de contrôle française — déclarations, sanctions, amendes',
          'Registre des traitements, DPO, analyse d\'impact (AIPD)',
        ],
      },
      {
        title: '📞 Réglementation prospection',
        points: [
          'Loi Naegelen (2020-901) : authentification des numéros de téléphone, bloctel',
          'Décision Arcep 2018-0881 : règles numérotation et communication',
          'ePrivacy / directive cookies : consentement, opt-in/opt-out',
          'SPAM et prospection email : règles CAN-SPAM, CASL, opt-in obligatoire BtoC',
        ],
      },
      {
        title: '⚔️ Droit de la concurrence',
        points: [
          'Concurrence déloyale : dénigrement, imitation, désorganisation, parasitisme',
          'Ententes et abus de position dominante (DGCCRF, Autorité de la concurrence)',
          'Pratiques commerciales restrictives : revente à perte, prix imposés',
          'Propriété intellectuelle : marques, brevets, droit d\'auteur, protection',
        ],
      },
      {
        title: '🛡️ Garanties et responsabilité',
        points: [
          'Garantie légale de conformité (2 ans BtoC) et garantie des vices cachés',
          'Responsabilité contractuelle vs délictuelle',
          'Clauses limitatives de responsabilité en BtoB',
          'Assurance RC Pro : obligatoire pour de nombreuses activités commerciales',
        ],
      },
    ],
    motsCles: ['RGPD', 'CNIL', 'CGV', 'Consentement', 'Naegelen', 'Arcep', 'Concurrence déloyale', 'Garantie', 'Contrat', 'Dol', 'DPO', 'Opt-in'],
    liensNTC: ['CP3 — Prospecter (RGPD)', 'CP6 — Proposition technico-commerciale', 'CP9 — Gestion relation client'],
  },

  bureautique: {
    id: 'bureautique',
    label: 'Bureautique & Outils',
    emoji: '💻',
    color: '#00b894',
    description: 'Maîtriser les outils bureautiques et numériques indispensables au commercial : Office 365, CRM, outils IA et cybersécurité.',
    objectifs: [
      'Utiliser Word, Excel et PowerPoint avec les fonctions avancées du commercial',
      'Maîtriser un CRM (Salesforce/HubSpot) pour gérer pipeline et clients',
      'Intégrer les outils IA (Copilot, ChatGPT) dans le quotidien commercial',
      'Connaître les bases de la cybersécurité pour protéger les données clients',
    ],
    programme: [
      {
        title: '📄 Word — Documents professionnels',
        points: [
          'Publipostage (mailing merge) : source de données, champs, filtres, impression',
          'Styles et modèles : cohérence graphique d\'une proposition commerciale',
          'Tableaux et mise en forme avancée : présenter un devis, une offre',
          'Suivi des modifications et commentaires pour relecture collaborative',
        ],
      },
      {
        title: '📊 Excel — Analyse et pilotage',
        points: [
          'Tableau Croisé Dynamique (TCD) : analyser les ventes par segment, zone, période',
          'RECHERCHEV / RECHERCHEX : croiser données clients et catalogue produits',
          'Fonction SI, NB.SI, SOMME.SI : calculs conditionnels sur données commerciales',
          'Graphiques professionnels : histogramme, courbe, secteurs pour le reporting',
          'Tableau de bord commercial : indicateurs clés visuels et automatisés',
        ],
      },
      {
        title: '📽️ PowerPoint — Présentations',
        points: [
          'Règle 6×6 : maximum 6 lignes × 6 mots par slide',
          'Structure d\'une présentation commerciale : Contexte → Problème → Solution → Preuves → CTA',
          'Design professionnel : charte graphique, police, contraste, espace blanc',
          'Animations et transitions : usage modéré pour guider l\'attention',
        ],
      },
      {
        title: '☁️ Collaboration et CRM',
        points: [
          'Microsoft Teams : réunions, canaux, partage de fichiers, intégrations',
          'OneDrive/SharePoint : stockage cloud, co-édition en temps réel',
          'Salesforce : leads, opportunités, pipeline, rapports, dashboards',
          'HubSpot : CRM gratuit, séquences email, suivi des interactions, scoring',
          'Pipedrive : pipeline visuel, activités, prévisions de vente',
        ],
      },
      {
        title: '🤖 IA et cybersécurité',
        points: [
          'Microsoft Copilot : rédaction d\'emails, résumés de réunion, analyse de données',
          'ChatGPT/Claude : préparer des argumentaires, analyser des appels d\'offres',
          'Prompt engineering : structurer les demandes pour obtenir des résultats utiles',
          'Cybersécurité : mots de passe forts, phishing, authentification 2FA, RGPD',
          'Sobriété numérique : réduction empreinte carbone, archivage emails',
        ],
      },
    ],
    motsCles: ['TCD', 'RECHERCHEV', 'Publipostage', 'PowerPoint', 'CRM', 'Salesforce', 'HubSpot', 'Copilot', 'Prompt', 'Phishing', '2FA', 'Pipeline'],
    liensNTC: ['CP1 — Veille commerciale', 'CP3 — Prospecter (CRM)', 'CP4 — Analyser performances'],
  },

  anglais: {
    id: 'anglais',
    label: 'Anglais Commercial',
    emoji: '🌍',
    color: '#0984e3',
    description: 'Développer les compétences en anglais professionnel pour communiquer avec des clients et partenaires internationaux — niveau B2 CECRL.',
    objectifs: [
      'Rédiger des emails professionnels en anglais (demande, suivi, relance, offre)',
      'Mener un appel téléphonique commercial en anglais (cold call, suivi)',
      'Négocier et présenter une offre commerciale en anglais',
      'Maîtriser le vocabulaire B2B, financier et contractuel en anglais',
    ],
    programme: [
      {
        title: '✉️ Email professionnel',
        points: [
          'Structure : Subject line → Opening → Body → Call to action → Closing',
          'Formules d\'ouverture : Dear Mr/Ms, To whom it may concern, Hi [First name]',
          'Demande d\'information : I would like to enquire about / Could you please...',
          'Suivi et relance : Further to our conversation / I am following up on...',
          'Offre commerciale : Please find attached our proposal / I am delighted to offer...',
        ],
      },
      {
        title: '📞 Appels téléphoniques',
        points: [
          'Passer un appel : May I speak to / I\'m calling regarding / Is now a good time?',
          'Laisser un message : I\'d like to leave a message / Could you ask them to call me back?',
          'Cold calling script : Introduction → Hook → Value proposition → CTA',
          'Gérer les objections : I understand your concern / That\'s a valid point, however...',
        ],
      },
      {
        title: '🤝 Négociation commerciale',
        points: [
          'Ouvrir une négociation : Our initial proposal is / We\'d like to start with...',
          'Faire une contre-offre : We could consider / Would you be open to...?',
          'Conclure : We have a deal / Let me draft the terms / Shall we move forward?',
          'Vocabulaire prix : discount, rebate, trade-in, bulk pricing, RFP/RFQ',
        ],
      },
      {
        title: '📖 Vocabulaire B2B & Finance',
        points: [
          'Sales process : prospect, lead, opportunity, quote, purchase order, invoice',
          'Finance : revenue, turnover, gross margin, EBITDA, cash flow, ROI, KPI',
          'Contrats : terms and conditions, NDA, SLA, warranty, liability, breach',
          'Logistique : delivery, shipment, freight, incoterms (EXW, FOB, CIF, DAP)',
        ],
      },
      {
        title: '🎤 Présentation orale',
        points: [
          'Structure d\'un pitch : Problem → Solution → Proof → ROI → Next steps',
          'Expressions de transition : First of all / Moving on to / To summarise...',
          'Gérer les questions : That\'s a great question / Could you clarify...?',
          'Niveau B2 CECRL : comprendre idées principales, s\'exprimer avec aisance',
        ],
      },
    ],
    motsCles: ['Email', 'Cold calling', 'Négociation', 'B2 CECRL', 'Invoice', 'Quote', 'NDA', 'SLA', 'Pitch', 'ROI', 'Incoterms', 'Follow-up'],
    liensNTC: ['CP3 — Prospecter (phoning)', 'CP6 — Proposition technico-commerciale', 'CP7 — Négocier'],
  },

  macro_eco: {
    id: 'macro_eco',
    label: 'Macro-économie',
    emoji: '📈',
    color: '#6c5ce7',
    description: 'Comprendre les grands équilibres économiques pour contextualiser son activité commerciale : indicateurs, politiques économiques, environnement international.',
    objectifs: [
      'Interpréter les grands indicateurs macro-économiques (PIB, inflation, chômage)',
      'Comprendre les politiques monétaires et budgétaires et leur impact commercial',
      'Analyser les mécanismes de l\'offre, de la demande et de l\'élasticité',
      'Situer son activité dans le contexte de la zone euro et du commerce international',
    ],
    programme: [
      {
        title: '📊 Indicateurs économiques',
        points: [
          'PIB (Produit Intérieur Brut) : mesure de la richesse produite, croissance en %',
          'Inflation : IPC (Indice des Prix à la Consommation), inflation sous-jacente',
          'Chômage : taux BIT, types (frictionnel, structurel, conjoncturel)',
          'Pouvoir d\'achat : salaire réel vs nominal, impact sur la consommation',
          'Indicateurs avancés : PMI, confiance des ménages, commandes industrielles',
        ],
      },
      {
        title: '🏦 Politiques économiques',
        points: [
          'Politique monétaire : BCE, taux directeurs (refi, dépôt, prêt marginal)',
          'Quantitative Easing (QE) : création monétaire, rachat d\'actifs',
          'Politique budgétaire : dépenses publiques, déficit, dette, multiplicateur',
          'Pacte de Stabilité : règles budgétaires européennes (3% déficit, 60% dette)',
        ],
      },
      {
        title: '📉 Offre, demande et marchés',
        points: [
          'Loi de l\'offre et de la demande : prix d\'équilibre, surplus, pénurie',
          'Élasticité-prix : forte (biens substituables) / faible (biens inélastiques)',
          'Élasticité-revenu : biens normaux, inférieurs, de luxe (Veblen)',
          'Structures de marché : concurrence pure/parfaite, monopole, oligopole, duopole',
        ],
      },
      {
        title: '🌍 Commerce international',
        points: [
          'Balance commerciale : exportations - importations = solde',
          'Taux de change : impact sur compétitivité des exportateurs',
          'Avantages comparatifs (Ricardo) : spécialisation internationale',
          'Zone euro : 20 pays, politique monétaire commune, taux de change fixe',
        ],
      },
      {
        title: '📆 Conjoncture et cycles',
        points: [
          'Cycle économique : expansion → pic → récession → creux → reprise',
          'Crise financière : mécanismes de contagion, credit crunch',
          'Indicateurs de conjoncture : comment les lire pour anticiper la demande',
          'Impact macro sur les ventes BtoB : comment adapter sa stratégie',
        ],
      },
    ],
    motsCles: ['PIB', 'Inflation', 'IPC', 'BCE', 'Taux directeur', 'QE', 'Élasticité', 'Balance commerciale', 'Zone euro', 'Conjoncture', 'Récession', 'Chômage'],
    liensNTC: ['CP1 — Veille commerciale (PESTEL)', 'CP2 — Plan d\'actions commerciales', 'CP4 — Analyser performances'],
  },

  orga_travail: {
    id: 'orga_travail',
    label: 'Organisation du Travail',
    emoji: '🗂️',
    color: '#fd79a8',
    description: 'Optimiser son organisation personnelle et professionnelle pour maximiser sa productivité commerciale et gérer efficacement son portefeuille clients.',
    objectifs: [
      'Appliquer les méthodes de priorisation (Eisenhower, Pareto, scoring ABC)',
      'Gérer son temps commercial pour maximiser le face-à-face client',
      'Optimiser ses tournées commerciales avec la géo-optimisation',
      'Prévenir les risques liés au travail : DUER, TMS, RPS',
    ],
    programme: [
      {
        title: '⏱️ Gestion du temps',
        points: [
          'Matrice Eisenhower : Urgent/Important → 4 quadrants, priorisation',
          'GTD (Getting Things Done) : capture, clarification, organisation, revue, action',
          'Time blocking : réserver des créneaux dédiés à la prospection, relances',
          'Loi de Parkinson : le travail gonfle pour remplir le temps disponible',
          'Pomodoro : 25 min de focus + 5 min pause — concentrer son énergie',
        ],
      },
      {
        title: '🎯 Priorisation du portefeuille',
        points: [
          'Loi de Pareto 80/20 : 20% des clients génèrent 80% du CA',
          'Scoring ABC : clients A (top 20%), B (milieu 30%), C (petits 50%)',
          'Matrice RFM : Récence, Fréquence, Montant — segmentation comportementale',
          'Potentiel vs pénétration : identifier les clients sous-exploités',
          'Plan de visites : fréquence selon le potentiel, objectif à chaque visite',
        ],
      },
      {
        title: '🗺️ Géo-optimisation des tournées',
        points: [
          'Logiciels de géo-optimisation : Mappy Pro, Google Maps, Badger Maps',
          'Organisation en secteurs géographiques : limiter les kilomètres inutiles',
          'Regroupement des visites par zone : journées cohérentes géographiquement',
          'Sobriété numérique et éco-conduite : réduire l\'empreinte carbone des déplacements',
        ],
      },
      {
        title: '📧 Productivité digitale',
        points: [
          'Boîte mail zéro : traiter, archiver, déléguer, différer — méthode TADD',
          'Templates d\'emails : modèles pour prospection, relance, suivi, devis',
          'Automatisation : séquences CRM, rappels, tâches automatiques',
          'Réunions efficaces : ordre du jour, durée limitée, compte-rendu, actions',
        ],
      },
      {
        title: '🏥 Santé au travail',
        points: [
          'DUER (Document Unique d\'Évaluation des Risques) : obligations de l\'employeur',
          'TMS (Troubles Musculo-Squelettiques) : prévention, ergonomie, pauses',
          'RPS (Risques Psycho-Sociaux) : burn-out, stress, harcèlement, prévention',
          'Droit à la déconnexion : encadrement légal, pratiques recommandées',
        ],
      },
    ],
    motsCles: ['Eisenhower', 'GTD', 'Pareto', 'ABC', 'RFM', 'Géo-optimisation', 'Time blocking', 'Pomodoro', 'DUER', 'TMS', 'RPS', 'Productivité'],
    liensNTC: ['CP2 — Plan d\'actions commerciales', 'CP3 — Prospecter un secteur', 'CP4 — Analyser performances'],
  },

  communication: {
    id: 'communication',
    label: 'Communication & Médias',
    emoji: '📡',
    color: '#e17055',
    description: 'Maîtriser les techniques de communication interpersonnelle et digitale pour convaincre, influencer et construire une image professionnelle forte.',
    objectifs: [
      'Maîtriser les fondamentaux de la communication verbale, non-verbale et écrite',
      'Développer une posture assertive avec la méthode DESC',
      'Construire et gérer son personal branding sur LinkedIn',
      'Rédiger des messages percutants avec le copywriting AIDA',
    ],
    programme: [
      {
        title: '🗣️ Communication interpersonnelle',
        points: [
          'Schéma de Shannon : émetteur, message, canal, récepteur, bruit, rétroaction',
          'Règle de Mehrabian : 7% verbal, 38% vocal (ton), 55% non-verbal (posture)',
          'Écoute active : reformulation, questions ouvertes, empathie, silence positif',
          'Communication non-violente (CNV) : Observation → Sentiment → Besoin → Demande',
          'Biais cognitifs en communication : halo effect, biais de confirmation, ancrage',
        ],
      },
      {
        title: '💪 Assertivité',
        points: [
          'Méthode DESC : Décrire → Exprimer → Spécifier → Conséquences positives',
          'Assertivité vs passivité, agressivité, manipulation',
          'Dire non avec tact : technique du disque rayé, du sandwich',
          'Gérer les critiques : critique justifiée (accepter), injustifiée (rebondir)',
        ],
      },
      {
        title: '🔵 LinkedIn & Social Selling',
        points: [
          'SSI (Social Selling Index) : 4 piliers, score sur 100, impact commercial',
          'Optimiser son profil : titre accrocheur, résumé storytelling, recommandations',
          'Stratégie de contenu : fréquence, formats (article, post, sondage, vidéo)',
          'Prospection LinkedIn : InMail, demande de connexion personnalisée, nurturing',
        ],
      },
      {
        title: '✍️ Copywriting',
        points: [
          'AIDA : Attention → Intérêt → Désir → Action — structure d\'un message persuasif',
          'PAS : Problème → Agitation → Solution — copywriting orienté douleur client',
          'Headline puissant : chiffres, questions, promesse claire',
          'CTA (Call To Action) : précis, visible, avec bénéfice clair',
        ],
      },
      {
        title: '🌐 E-réputation & Personal Branding',
        points: [
          'Personal branding : définir son positionnement, sa valeur ajoutée unique',
          'Veille e-réputation : Google Alert, Mention, surveillance des avis',
          'Gestion de crise online : répondre rapidement, sincèrement, positivement',
          'RGPD et réseaux sociaux : droits des personnes, modération, signalement',
        ],
      },
    ],
    motsCles: ['DESC', 'Assertivité', 'Mehrabian', 'LinkedIn', 'SSI', 'AIDA', 'CNV', 'Copywriting', 'Personal branding', 'E-réputation', 'CTA', 'Social Selling'],
    liensNTC: ['CP3 — Prospecter (social selling)', 'CP7 — Négocier la solution', 'CP5 — Image entreprise'],
  },

  rapport_activite: {
    id: 'rapport_activite',
    label: 'Rapport d\'activité & Projet Pro',
    emoji: '📁',
    color: '#636e72',
    description: 'Préparer et rédiger le dossier professionnel NTC, maîtriser les épreuves CCF, construire son rapport d\'activité et réussir l\'oral devant le jury.',
    objectifs: [
      'Rédiger le dossier professionnel NTC (32-38 pages) selon les exigences du REAC',
      'Structurer et présenter le diaporama (28-32 slides) pour l\'oral jury',
      'Maîtriser le format et les attentes de chaque épreuve CCF (8h30)',
      'Construire un bilan de compétences et un projet professionnel cohérent',
    ],
    programme: [
      {
        title: '📋 Dossier professionnel NTC',
        points: [
          'Structure : 32 à 38 pages hors garde, sommaire, annexes',
          'Partie 1 (10-12 pages) : Veille commerciale — sources, analyse, PESTEL',
          'Partie 2 (12-14 pages) : Plan d\'actions commerciales — PAC, KPIs, personas',
          'Partie 3 (10-12 pages) : Gestion relation client — CRM, NPS, fidélisation',
          'Mise en forme : Arial 11, interligne 1,15, numérotation, bibliographie',
        ],
      },
      {
        title: '📽️ Diaporama et présentation orale',
        points: [
          'Diaporama : 28 à 32 slides, Arial 11, règle 6×6, images professionnelles',
          'MSP orale : Prospection 15 min + Négociation 60 min + Préparation 30 min',
          'Entretien technique : 50 min — questions REAC sur les 9 compétences',
          'Questionnement productions : 1h00 — défense du dossier et du diaporama',
          'Entretien final : 10 min — conclusion, bilan, projet professionnel',
        ],
      },
      {
        title: '🎯 Épreuves CCF',
        points: [
          'MSP écrite (étude de cas) : 4h00 — mise en situation professionnelle complète',
          'Préparation MSP orale : 30 min — analyse du cas, préparation jeu de rôle',
          'Grilles d\'évaluation jury : critères officiels REAC par compétence',
          'Durée totale session finale : 8h30 — organisation sur la journée',
          'Période entreprise minimum : 350h titre complet / 175h CCP seul',
        ],
      },
      {
        title: '📊 Rapport d\'activité',
        points: [
          'Objectif : prouver l\'acquisition des compétences par des situations réelles terrain',
          'Structure : contexte entreprise → mission → actions réalisées → résultats → bilan',
          'Indicateurs de résultats : CA, nb clients, taux conversion, KPIs atteints',
          'Preuves et annexes : emails, devis, CR visite, tableaux de bord, témoignages',
        ],
      },
      {
        title: '🌱 Projet professionnel',
        points: [
          'Bilan de compétences : points forts, axes de progrès, soft skills',
          'Projet pro : poste visé, secteur cible, plan d\'action à 12 mois',
          'VAE (Validation des Acquis de l\'Expérience) : conditions, démarche, livret 2',
          'Evolution de carrière NTC : Account Manager, Business Developer, Chef des Ventes',
        ],
      },
    ],
    motsCles: ['Dossier professionnel', 'MSP', 'CCF', 'Jury', 'Diaporama', 'REAC', 'Rapport activité', 'Bilan compétences', 'VAE', 'Projet pro', 'Oral', 'Épreuve'],
    liensNTC: ['Toutes les compétences CP1–CP9', 'Session finale 8h30', 'RNCP 39063'],
  },
};

export const ECM_LIST: EcmMatiere[] = Object.values(ECM_MATIERES);

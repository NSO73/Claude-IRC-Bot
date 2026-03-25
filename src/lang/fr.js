export default {
  // Core
  thinking: ({ tag }) => `réfléchit…${tag}`,
  taskLimit: ({ max }) => `Limite atteinte (${max} requêtes simultanées). !tasks pour voir, !stop pour annuler.`,
  taskAborted: ({ id }) => `Tâche #${id} annulée.`,
  error: ({ msg }) => `Erreur : ${msg}`,
  emptyReply: 'Réponse vide.',
  cUsage: 'Usage : !c <question>',
  ccUsage: 'Usage : !cc <question>',

  // Auth / Whoami
  authorized: 'autorisées',
  unauthorized: 'non autorisées',
  whoamiIdentified: ({ nick, account, status }) => `${nick} : identifié (${account}), commandes ${status}`,
  whoamiNotIdentified: ({ nick, status }) => `${nick} : non identifié, commandes ${status}`,
  whoamiBasic: ({ nick, status }) => `${nick} : commandes ${status}`,

  // YouTube
  ytUsage: 'Usage : !yt <recherche>',
  ytNoResult: 'Aucun résultat.',

  // Tasks
  tasksEmpty: 'Aucune tâche en cours.',
  taskEntry: ({ id, nick, desc, elapsed }) => `#${id} [${nick}] ${desc} (${elapsed}s)`,

  // Stop
  stopUsage: 'Usage : !stop <id>',
  taskNotFound: ({ id }) => `Tâche #${id} introuvable.`,
  taskCancelledOther: ({ id, nick }) => `Tâche #${id} (${nick}) annulée.`,
  taskCancelledSelf: ({ id }) => `Tâche #${id} annulée.`,

  // Plan
  planNone: 'Aucun plan actif.',
  planCancelled: 'Plan annulé.',
  planAlreadyActive: 'Un plan est déjà actif. !plan /stop pour annuler.',
  planExecuted: '-- Plan exécuté --',
  planRefineHint: 'Dis "go" pour exécuter, ou continue à affiner.',
  planGoHint: 'Dis "go" pour exécuter, ou envoie du feedback pour affiner.',
  planUsage: 'Usage : !plan <question> | /status /go /stop',
  planSystemPropose: ({ question }) => `L'utilisateur veut un plan d'approche. Propose un plan clair et structuré pour répondre à sa demande. Inclus les grandes étapes, les choix d'architecture ou d'outils si pertinent, et les compromis éventuels. Ne commence pas l'exécution, propose seulement le plan. Question : ${question}`,
  planSystemExec: ({ plan }) => `Le plan a été validé. Exécute-le maintenant de façon concise (style IRC). Voici le plan final :\n\n${plan}`,
  planHeader: ({ question }) => `Plan : ${question}`,
  planFooter: 'Dis "go" pour exécuter, ou envoie du feedback pour affiner le plan.',

  // Restart
  restarting: 'redémarre…',

  // Project
  projectActive: ({ name }) => `Projet actif : ${name}`,
  projectNone: 'Aucun projet actif.',
  projectNoneHint: 'Aucun projet actif. !project <nom> pour en activer un.',
  projectListEmpty: 'Aucun projet.',
  projectList: ({ list }) => `Projets : ${list}`,
  projectDeactivated: 'Projet désactivé.',
  projectDeleteUsage: 'Usage : !project /delete <nom>',
  projectDeleted: ({ name }) => `Projet "${name}" supprimé.`,
  projectNotFound: ({ name }) => `Projet "${name}" introuvable.`,
  projectMdEmpty: ({ name }) => `CLAUDE.md de "${name}" est vide.`,
  projectMdUpdated: ({ name }) => `CLAUDE.md de "${name}" mis à jour.`,
  projectInvalidName: 'Nom de projet invalide (lettres, chiffres, tirets, underscores, max 64).',

  // Tell delivery
  tellDeliver: ({ nick, sender, msg }) => `${nick}: [msg de ${sender}] ${msg}`,

  // IRC Commands
  kickUsage: 'Usage : !kick <nick> [raison]',
  kickDefault: 'Bye',
  banUsage: 'Usage : !ban <nick|mask>',
  unbanUsage: 'Usage : !unban <nick|mask>',
  kickbanUsage: 'Usage : !kickban <nick> [raison]',
  muteUsage: 'Usage : !mute <nick|mask>',
  unmuteUsage: 'Usage : !unmute <nick|mask>',
  opUsage: 'Usage : !op <nick>',
  deopUsage: 'Usage : !deop <nick>',
  voiceUsage: 'Usage : !voice <nick>',
  devoiceUsage: 'Usage : !devoice <nick>',
  inviteUsage: 'Usage : !invite <nick>',
  topicUsage: 'Usage : !topic <texte>',

  // Seen / Tell
  seenUsage: 'Usage : !seen <nick>',
  seenNever: ({ nick }) => `${nick} : jamais vu.`,
  seenResult: ({ nick, ago, channel, msg }) => `${nick} vu il y a ${ago} sur ${channel} : "${msg}"`,
  tellUsage: 'Usage : !tell <nick> <message>',
  tellSelf: 'Tu ne peux pas te laisser un message à toi-même.',
  tellSaved: ({ nick }) => `Message enregistré pour ${nick}.`,

  // Uptime
  uptime: ({ time }) => `Uptime : ${time}`,

  // Time
  timeSeconds: ({ n }) => `${n}s`,
  timeMinutes: ({ n }) => `${n}min`,
  timeHours: ({ h, m }) => `${h}h${m}`,
  timeDays: ({ d, h }) => `${d}j ${h}h`,

  // Context labels (prompts to Claude)
  contextLabelUser: 'Utilisateur',
  contextLabelAssistant: 'Assistant',

  // Sessions
  sessionInvalidName: 'Nom de projet invalide',
  sessionTemplate: ({ name }) => `# Projet : ${name}\n\nSession projet pour le canal IRC.\n`,
  sessionTooLong: ({ max }) => `Contenu trop long (max ${max} caractères)`,

  // UI
  uiUsage: 'Usage : !ui <description du prototype>',
  uiDesignSystemIntro: ({ ds }) => `Design system généré :\n\n${ds}\n\n---\n\n`,
  uiBuildInstructions: ({ pasteMode, question }) => {
    const lines = [
      'Le design system ci-dessus a déjà été généré. N\'exécute AUCUNE commande de recherche. Génère directement le code.',
      '',
      'Génère une page HTML complète et autonome pour la demande ci-dessous.',
      '- Tout le CSS dans des balises <style>, tout le JS dans des balises <script>',
    ];
    if (pasteMode === 'html') {
      lines.push('- Pour les polices, utilise <link rel="stylesheet" href="assets/vendor/fonts.css"> (Inter + JetBrains Mono disponibles)');
      lines.push('- Inclus aussi <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">');
    } else {
      lines.push('- Pour les polices, utilise Google Fonts via <link> dans le <head>');
    }
    lines.push(
      '- Design professionnel et moderne, responsive, dark mode',
      '- JS propre : pas de redéclarations de variables, pas de code dupliqué, utilise des fonctions nommées',
      '- Retourne UNIQUEMENT le code HTML brut, sans blocs markdown ni explication',
      '',
      `Demande : ${question}`,
    );
    return lines.join('\n');
  },

  // Web
  githubTokenMissing: 'GITHUB_TOKEN non configuré',

  // Help
  helpUnknown: 'Commande inconnue. Tape !help pour la liste.',
  help_menu: [
    '=== Aide ===',
    'Claude : !c (Sonnet) | !cc (Opus)',
    'Projet : !project <nom> | /list /leave /delete /md',
    'Plan : !plan <question> | /status /go /stop',
    'Outils : !seen !tell !yt !ui !uptime !whoami !tasks !stop',
    'IRC : !kick !ban !unban !kickban !mute !unmute !op !deop !voice !devoice !invite !topic !lock !unlock !moderate !unmoderate',
    '!help <commande> pour le détail',
  ],
  help_c: ['!c <question> — Pose une question à Claude (Sonnet)'],
  help_cc: ['!cc <question> — Pose une question à Claude (Opus)'],
  help_plan: [
    '!plan <question> — Claude propose un plan d\'approche',
    '!plan /status — Affiche le plan en cours',
    '!plan /go — Valide et exécute le plan',
    '!plan /stop — Annule le plan',
    'En mode plan, tes messages affinent le plan. Dis "go" pour exécuter.',
  ],
  help_project: [
    '!project — Affiche le projet actif',
    '!project <nom> — Active un projet (créé auto si inexistant)',
    '!project <nom> <question> — Active + pose une question directement',
    '!project /list — Liste les projets ([actif] marqué)',
    '!project /leave — Désactive le projet en cours',
    '!project /delete <nom> — Supprime un projet',
    '!project /md — Affiche le CLAUDE.md du projet actif',
    '!project /md <texte> — Modifie le CLAUDE.md du projet actif',
    'Une fois un projet actif, !c, !cc et !plan utilisent son répertoire.',
  ],
  help_seen: ['!seen <nick> — Affiche la dernière activité d\'un utilisateur (persistant)'],
  help_tell: ['!tell <nick> <message> — Laisse un message, livré quand le nick parle (persistant)'],
  help_yt: ['!yt <recherche> — Renvoie le premier lien YouTube correspondant'],
  help_uptime: ['!uptime — Affiche le temps depuis le lancement du bot'],
  help_whoami: ['!whoami — Affiche ton compte NickServ et ton niveau d\'accès'],
  help_tasks: ['!tasks — Liste les requêtes Claude en cours avec leur ID'],
  help_stop: ['!stop <id> — Annule une requête en cours par son ID'],
  help_ui: ['!ui <description> — Génère un prototype HTML (design system + Claude Opus)'],
  help_restart: ['!restart — Redémarre le bot (admin)'],
  help_help: ['!help [commande] — Affiche l\'aide générale ou le détail d\'une commande'],
  help_kick: ['!kick <nick> [raison] — Expulse un utilisateur du canal'],
  help_ban: ['!ban <nick|masque> — Bannit un utilisateur ou un masque'],
  help_unban: ['!unban <nick|masque> — Retire un ban'],
  help_kickban: ['!kickban <nick> [raison] — Ban + kick en une commande'],
  help_mute: ['!mute <nick|masque> — Rend muet (+q)'],
  help_unmute: ['!unmute <nick|masque> — Retire le mute'],
  help_op: ['!op <nick> — Donne le statut opérateur (+o)'],
  help_deop: ['!deop <nick> — Retire le statut opérateur'],
  help_voice: ['!voice <nick> — Donne la voix (+v)'],
  help_devoice: ['!devoice <nick> — Retire la voix'],
  help_invite: ['!invite <nick> — Invite un utilisateur sur le canal'],
  help_topic: ['!topic <texte> — Change le sujet du canal'],
  help_lock: ['!lock — Passe le canal en invite-only (+i)'],
  help_unlock: ['!unlock — Retire le mode invite-only'],
  help_moderate: ['!moderate — Active le mode modéré (+m)'],
  help_unmoderate: ['!unmoderate — Désactive le mode modéré'],
};

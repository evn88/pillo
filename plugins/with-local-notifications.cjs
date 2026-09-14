const { withEntitlementsPlist } = require('expo/config-plugins');

// Локальные напоминания не используют APNs; capability мешает подписи Personal Team.
// Размещается перед expo-notifications: цепочка mods выполняется в обратном порядке.
module.exports = (config) => withEntitlementsPlist(config, (mod) => {
  delete mod.modResults['aps-environment'];
  return mod;
});

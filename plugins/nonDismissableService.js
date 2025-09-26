const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withNonDismissableService(config) {
  return withAndroidManifest(config, (config) => {
    const serviceName = "expo.modules.location.taskConsumers.LocationTaskConsumer";

    const app = config.modResults.manifest.application?.[0];

    if (app?.service) {
      app.service = app.service.map((service) => {
        if (service.$["android:name"] === serviceName) {
          // ✅ Foreground, persistent, non-dismissible
          service.$["android:foregroundServiceType"] = "location";
          service.$["android:stopWithTask"] = "false";
          service.$["android:enabled"] = "true";
          service.$["android:exported"] = "false";
        }
        return service;
      });
    }

    return config;
  });
};

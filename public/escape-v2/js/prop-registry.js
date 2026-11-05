const builders = new Map();

function registerPropType(name, builder) {
  if (typeof name !== 'string' || !name.trim() || typeof builder !== 'function') {
    throw new TypeError('Prop registration requires a name and builder function.');
  }
  builders.set(name, builder);
}

function getPropBuilder(name) {
  return builders.get(name);
}

export { registerPropType, getPropBuilder };

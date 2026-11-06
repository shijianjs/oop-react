/**
 * Where `OopReactComponent` parks the name it was given, so the decorator can
 * read it off any instance of that class without keeping a registry.
 */
export const COMPONENT_NAME = Symbol.for('oop-react.componentName');

interface NamedInstance {
  [COMPONENT_NAME]?: string;
}

/**
 * `Name.method` for an island, resolved when the island is created rather than
 * when the class is decorated: the class may be renamed by a bundler, and the
 * component's own `name` option is the value a reader should see.
 */
export function islandName(instance: object, method: string | symbol): string {
  const named = instance as NamedInstance;
  const owner = named[COMPONENT_NAME] ?? instance.constructor.name;
  return `${owner}.${String(method)}`;
}

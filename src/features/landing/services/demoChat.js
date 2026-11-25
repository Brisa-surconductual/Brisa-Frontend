/**
 * @typedef {{ id: string, label: string, next: string }} DemoOption
 * @typedef {{ bot: string, options: readonly DemoOption[] }} DemoNode
 * @typedef {{ start: string, nodes: Record<string, DemoNode> }} DemoTree
 */

/**
 * Mensajes iniciales de la demo.
 * @param {DemoTree} tree
 */
export function startDemo(tree) {
  const node = tree.nodes[tree.start];

  return {
    nodeId: tree.start,
    messages: [{ id: 'bot-0', from: 'bot', text: node.bot }],
  };
}

/**
 * Aplica una opción: devuelve la respuesta de la persona, el nodo de Brisa
 * y el id del siguiente nodo. Si la opción no existe devuelve null.
 * @param {DemoTree} tree
 * @param {string} nodeId
 * @param {string} optionId
 */
export function chooseOption(tree, nodeId, optionId) {
  const option = tree.nodes[nodeId]?.options.find((o) => o.id === optionId);
  const next = option ? tree.nodes[option.next] : null;

  if (!option || !next) return null;

  return { nextId: option.next, userText: option.label, botText: next.bot };
}

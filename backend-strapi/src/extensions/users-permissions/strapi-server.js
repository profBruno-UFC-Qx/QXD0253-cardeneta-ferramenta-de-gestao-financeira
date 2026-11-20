module.exports = (plugin) => {
  const atributos = plugin.contentTypes.user.schema.attributes;
  atributos.nome = { type: 'string' };
  atributos.cpf = { type: 'string', unique: true };
  atributos.telefone = { type: 'string' };
  return plugin;
};

module.exports = function ({ types: t }) {
  return {
    visitor: {
      CallExpression(path) {
        if (path.node.callee.type === 'Import') {
          const importArgument = path.node.arguments[0];

          const requireCall = t.callExpression(t.identifier('require'), [importArgument]);
          const arrow = t.arrowFunctionExpression([], requireCall);

          const promiseThen = t.callExpression(
            t.memberExpression(
              t.callExpression(t.identifier('Promise.resolve'), []),
              t.identifier('then')
            ),
            [arrow]
          );

          path.replaceWith(promiseThen);
        }
      },
    },
  };
};

/**
 * Enforce that React Router route `element` values are JSX, not component references.
 *
 * Example (good):
 *   { path: "/x", element: <Page /> }
 *
 * Example (bad):
 *   { path: "/x", element: Page }
 */
export default {
  rules: {
    'route-element-jsx': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Require RouteObject.element to be JSX (e.g. <Comp />), not a component reference.',
        },
        schema: [],
        messages: {
          mustBeJsx:
            '`element` must be JSX (e.g. `<{{name}} />`). You likely meant to render the component, not pass it.',
        },
      },
      create(context) {
        const sourceCode = context.sourceCode

        function getKeyName(key) {
          if (!key) return null
          if (key.type === 'Identifier') return key.name
          if (key.type === 'Literal') return String(key.value)
          return null
        }

        function isJsxLike(node) {
          if (!node) return false
          switch (node.type) {
            case 'JSXElement':
            case 'JSXFragment':
              return true
            case 'Literal':
              // allow null for "no element"
              return node.value === null
            case 'ConditionalExpression':
              return isJsxLike(node.consequent) && isJsxLike(node.alternate)
            case 'LogicalExpression':
              // e.g. condition && <Comp />
              return isJsxLike(node.right)
            case 'CallExpression': {
              // Allow React.createElement(...) and calls to local helper
              // functions (e.g. `mod("employees", <Employees />)`, which
              // wraps its JSX argument in Suspense/RequireModule and
              // returns JSX itself). The mistake this rule exists to catch
              // — passing a bare component reference like `element: Page`
              // — is an Identifier, not a CallExpression, so this doesn't
              // reopen that hole.
              return true
            }
            default:
              return false
          }
        }

        function getSuggestedName(node) {
          if (!node) return 'Component'
          if (node.type === 'Identifier') return node.name
          if (node.type === 'MemberExpression') {
            return sourceCode.getText(node)
          }
          return 'Component'
        }

        return {
          Property(node) {
            const keyName = getKeyName(node.key)
            if (keyName !== 'element') return
            if (node.computed) return

            // Only report when it's clearly not JSX-like (to avoid false positives).
            if (isJsxLike(node.value)) return

            // Common "wrong" pattern: Identifier / MemberExpression / LazyExoticComponent variable, etc.
            const suggested = getSuggestedName(node.value)
            context.report({
              node: node.value,
              messageId: 'mustBeJsx',
              data: { name: suggested },
            })
          },
        }
      },
    },
  },
}



		(function (graph) {
		function require(file) {
			var exports = {};

			function absRequire(relativePath) {
				return require(graph[file].deps[relativePath]);
			}

			(function (require, exports, code) {
				console.log(require, exports, code);
				eval(code);
				/**
				 * => first step
				 * index.js
				 * var add = require('add.js').default
				 * console.log(add(1, 2))
				 *
				 * => second step
				 * add.js
				 * exports.default = function(a, b) { return a + b}
				 *
				 * exports 在这里用上了
				 */
			})(absRequire, exports, graph[file].code);
			
			return exports;
		}
	
		require("./example/index.js");
	})({"./example/index.js":{"deps":{"./add":"./example/add.js"},"code":"\"use strict\";\n\nvar _add = require(\"./add\");\nconsole.log((0, _add.add)(1, 2));"},"./example/add.js":{"deps":{},"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.add = void 0;\nvar add = exports.add = function add(a, b) {\n  return a + b;\n};"}});
		
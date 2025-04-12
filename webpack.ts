import * as babel from "@babel/core";
import * as parser from "@babel/parser";
import * as fs from "fs";
import * as path from "path";
import * as traverse from "@babel/traverse";

const getModuleinfo = (file: string) => {
	const code = fs.readFileSync(path.resolve(process.cwd(), file), "utf-8");

	// ast
	const ast = parser.parse(code, {
		sourceType: "module",
	});

	// console.log("ast", ast);

	// dep map
	const deps = {};

	traverse.default(ast, {
		ImportDeclaration({ node }) {
			const importPath = node.source.value;
			const abspath =
				"./" + path.join(path.dirname(file), importPath).replace("\\", "/");
			// 添加 .js 扩展名
			const finalPath = abspath + (importPath.endsWith(".js") ? "" : ".js");
			deps[importPath] = finalPath;
		},
	});

	// ES6 => ES5
	const { code: es5code } = babel.transformFromAstSync(ast, null, {
		presets: ["@babel/preset-env"],
	});

	return { file, deps, code: es5code };
};

console.log(getModuleinfo("./example/index.js"));

/**
 * 获取依赖
 */
const getDeps = (temp: any[], { deps }) => {
	Object.keys(deps).forEach((key) => {
		const child = getModuleinfo(deps[key]);
		temp.push(child);
		getDeps(temp, child);
	});
};

/**
 * 解析模块
 */
const parseModules = (file: string) => {
	const entry = getModuleinfo(file);
	// 存有所有模块信息
	const temp = [entry];
	const depsGraph = {};

	getDeps(temp, entry);

	temp.forEach((info) => {
		depsGraph[info.file] = {
			deps: info.deps,
			code: info.code,
		};
	});

	return depsGraph;
};

const content = parseModules("./example/index.js");

console.log("content", content);

// (function (list) {
// 	function require(file) {
// 		var exports = {};
// 		(function (exports, code) {
// 			eval(code);
// 			/**
// 			 * => first step
// 			 * index.js
// 			 * var add = require('add.js').default
// 			 * console.log(add(1, 2))
// 			 *
// 			 * => second step
// 			 * add.js
// 			 * exports.default = function(a, b) { return a + b}
// 			 *
// 			 * exports 在这里用上了
// 			 */
// 		})(exports, list[file]);
// 		return exports;
// 	}

// 	require("index.js");
// })({});

/**
 * absRequire 的作用是：
当 index.js 中调用 require('./add') 时
absRequire 会将相对路径 './add' 转换为绝对路径 './example/add.js'
这样就能正确找到并加载依赖模块
为什么需要这个转换？
在原始代码中，我们使用相对路径导入（如 import { add } from './add'）
但在打包后的代码中，所有模块都被放在同一个作用域
如果不进行路径转换，require('./add') 会找不到正确的模块
absRequire 通过查找当前模块的 deps 映射表，将相对路径转换为绝对路径
简单来说，absRequire 是一个路径解析器，它确保了模块之间的相对路径引用能够正确工作，即使所有代码都被打包到同一个文件中。
*/
const bundle = (file) => {
	fs.writeFileSync(
		"./dist/bundle.js",
		`
		(function (graph) {
		function require(file) {
			var exports = {};

			function absRequire(relativePath) {
				return require(graph[file].deps[relativePath]);
			}

			(function (require, exports, code) {
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
	
		require("${file}");
	})(${JSON.stringify(content)});
		`
	);
};

bundle("./example/index.js");

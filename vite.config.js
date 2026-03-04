var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
/** Proxy de dev para contornar CORS no navegador: encaminha requisições para a URL em X-Proxy-URL. */
function devProxyPlugin() {
    var PROXY_PATH = "/__dev-proxy";
    return {
        name: "dev-proxy",
        configureServer: function (server) {
            var _this = this;
            server.middlewares.use(function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                var targetUrl, body, _a, headers, proxyRes, text, err_1;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (((_b = req.url) === null || _b === void 0 ? void 0 : _b.startsWith(PROXY_PATH)) !== true)
                                return [2 /*return*/, next()];
                            targetUrl = req.headers["x-proxy-url"];
                            if (!targetUrl || typeof targetUrl !== "string") {
                                res.statusCode = 400;
                                res.setHeader("Content-Type", "text/plain");
                                res.end("Header X-Proxy-URL obrigatório");
                                return [2 /*return*/];
                            }
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 7, , 8]);
                            if (!(req.method !== "GET" && req.method !== "HEAD")) return [3 /*break*/, 3];
                            return [4 /*yield*/, readBody(req)];
                        case 2:
                            _a = _c.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            _a = undefined;
                            _c.label = 4;
                        case 4:
                            body = _a;
                            headers = __assign({}, req.headers);
                            delete headers["x-proxy-url"];
                            delete headers["host"];
                            return [4 /*yield*/, fetch(targetUrl, {
                                    method: req.method || "GET",
                                    headers: headers,
                                    body: body,
                                })];
                        case 5:
                            proxyRes = _c.sent();
                            res.statusCode = proxyRes.status;
                            res.statusMessage = proxyRes.statusText;
                            return [4 /*yield*/, proxyRes.text()];
                        case 6:
                            text = _c.sent();
                            proxyRes.headers.forEach(function (v, k) {
                                var key = k.toLowerCase();
                                if (key !== "content-encoding" && key !== "transfer-encoding")
                                    res.setHeader(key, v);
                            });
                            res.setHeader("Content-Length", Buffer.byteLength(text, "utf8"));
                            res.end(text);
                            return [3 /*break*/, 8];
                        case 7:
                            err_1 = _c.sent();
                            res.statusCode = 502;
                            res.setHeader("Content-Type", "text/plain");
                            res.end("Proxy error: ".concat(err_1 instanceof Error ? err_1.message : String(err_1)));
                            return [3 /*break*/, 8];
                        case 8: return [2 /*return*/];
                    }
                });
            }); });
        },
    };
}
function readBody(req) {
    return new Promise(function (resolve, reject) {
        var chunks = [];
        req.on("data", function (c) { return chunks.push(c); });
        req.on("end", function () { return resolve(Buffer.concat(chunks)); });
        req.on("error", reject);
    });
}
export default defineConfig({
    plugins: [react(), devProxyPlugin()],
    resolve: {
        alias: { "@": path.resolve(__dirname, "./src") },
    },
    clearScreen: false,
    server: {
        port: 5173,
        strictPort: true,
    },
});

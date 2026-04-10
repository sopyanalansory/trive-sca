"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
exports.GET = void 0;
var server_1 = require("next/server");
var db_1 = require("@/lib/db");
var auth_1 = require("@/lib/auth");
var logger_1 = require("@/lib/logger");
var salesforce_platforms_1 = require("@/lib/salesforce-platforms");
var log = logger_1.apiLogger('accounts');
function GET(request) {
    return __awaiter(this, void 0, void 0, function () {
        var authHeader, token, decoded, result, accountOrLeadId, error_1, accounts, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    authHeader = request.headers.get('authorization');
                    token = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.replace('Bearer ', '')) || null;
                    if (!token) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 })];
                    }
                    decoded = auth_1.verifyToken(token);
                    if (!decoded) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: 'Token tidak valid atau sudah kadaluarsa' }, { status: 401 })];
                    }
                    return [4 /*yield*/, db_1["default"].query("SELECT \n        id,\n        account_type,\n        client_group_name,\n        login_number,\n        server_name,\n        status,\n        currency,\n        nickname,\n        leverage,\n        fix_rate,\n        type\n      FROM platforms \n      WHERE user_id = $1\n        AND LOWER(TRIM(COALESCE(status, ''))) IN ('enabled', 'read-only')\n      ORDER BY created_at DESC", [decoded.userId])];
                case 1:
                    result = _a.sent();
                    if (!(result.rows.length === 0)) return [3 /*break*/, 6];
                    accountOrLeadId = (decoded.accountId && String(decoded.accountId).trim()) ||
                        (decoded.leadId && String(decoded.leadId).trim()) ||
                        null;
                    if (!accountOrLeadId) return [3 /*break*/, 6];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, salesforce_platforms_1.fetchAndPersistPlatformsForUser(decoded.userId, accountOrLeadId)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, db_1["default"].query("SELECT \n              id,\n              account_type,\n              client_group_name,\n              login_number,\n              server_name,\n              status,\n              currency,\n              nickname,\n              leverage,\n              fix_rate,\n              type\n            FROM platforms \n            WHERE user_id = $1\n              AND LOWER(TRIM(COALESCE(status, ''))) IN ('enabled', 'read-only')\n            ORDER BY created_at DESC", [decoded.userId])];
                case 4:
                    result = _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    logger_1.logRouteError(log, request, error_1, 'Sync platforms from Salesforce failed');
                    return [2 /*return*/, server_1.NextResponse.json({
                            error: 'Gagal menyinkronkan akun platform dari Salesforce. Silakan coba lagi.'
                        }, { status: 502 })];
                case 6:
                    accounts = result.rows.map(function (row) {
                        var _a, _b;
                        return ({
                            id: row.id,
                            type: row.type || 'Demo',
                            accountType: row.account_type || '-',
                            platform: row.client_group_name || ((_a = row.server_name) === null || _a === void 0 ? void 0 : _a.split('-')[0]) || '-',
                            login: row.login_number,
                            serverName: row.server_name,
                            status: row.status,
                            currency: row.currency,
                            nickname: (_b = row.nickname) !== null && _b !== void 0 ? _b : null,
                            leverage: row.leverage,
                            fixRate: row.fix_rate
                        });
                    });
                    return [2 /*return*/, server_1.NextResponse.json({ accounts: accounts }, { status: 200 })];
                case 7:
                    error_2 = _a.sent();
                    logger_1.logRouteError(log, request, error_2, 'Get accounts failed');
                    return [2 /*return*/, server_1.NextResponse.json({ error: 'Terjadi kesalahan saat mengambil data akun. Silakan coba lagi.' }, { status: 500 })];
                case 8: return [2 /*return*/];
            }
        });
    });
}
exports.GET = GET;

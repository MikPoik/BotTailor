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
Object.defineProperty(exports, "__esModule", { value: true });
var db_1 = require("./db");
var schema_1 = require("@shared/schema");
var drizzle_orm_1 = require("drizzle-orm");
function seedSubscriptionPlans() {
    return __awaiter(this, void 0, void 0, function () {
        var plans, _i, plans_1, planData, existingPlan, createdPlan, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Starting subscription plans seeding...");
                    plans = [
                        {
                            name: "Free",
                            description: "Get started with basic chatbot functionality",
                            stripePriceId: "price_free", // No actual Stripe price for free plan
                            stripeProductId: "prod_free", // No actual Stripe product for free plan
                            price: 0, // Free
                            currency: "usd",
                            billingInterval: "month",
                            maxBots: 1,
                            maxMessagesPerMonth: 100,
                            features: ["1 Chatbot", "100 messages/month", "Community support"],
                            isActive: true,
                        },
                        {
                            name: "Basic",
                            description: "Essential features for small businesses",
                            stripePriceId: process.env.PRICE_SUB_BASIC || 'price_basic', // Replace with actual Stripe price ID
                            stripeProductId: process.env.PROD_SUB_BASIC || 'prod_basic', // Replace with actual Stripe product ID
                            price: 999, // $9.99
                            currency: "usd",
                            billingInterval: "month",
                            maxBots: 1,
                            maxMessagesPerMonth: 1000,
                            features: ["1 Chatbot", "1,000 messages/month", "Basic support", "Email integration"],
                            isActive: true,
                        },
                        {
                            name: "Premium",
                            description: "Advanced features for growing businesses",
                            stripePriceId: "price_premium", // Replace with actual Stripe price ID
                            stripeProductId: "prod_premium", // Replace with actual Stripe product ID
                            price: 2999, // $29.99
                            currency: "usd",
                            billingInterval: "month",
                            maxBots: 3,
                            maxMessagesPerMonth: 10000,
                            features: ["3 Chatbots", "10,000 messages/month", "Priority support", "Advanced analytics", "Custom branding"],
                            isActive: true,
                        },
                        {
                            name: "Ultra",
                            description: "Complete solution for enterprises and agencies",
                            stripePriceId: "price_ultra", // Replace with actual Stripe price ID
                            stripeProductId: "prod_ultra", // Replace with actual Stripe product ID
                            price: 9999, // $99.99
                            currency: "usd",
                            billingInterval: "month",
                            maxBots: 5,
                            maxMessagesPerMonth: 100000,
                            features: ["5 Chatbots", "100,000 messages/month", "24/7 support", "White-label solution", "API access"],
                            isActive: true,
                        },
                    ];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    _i = 0, plans_1 = plans;
                    _a.label = 2;
                case 2:
                    if (!(_i < plans_1.length)) return [3 /*break*/, 6];
                    planData = plans_1[_i];
                    return [4 /*yield*/, db_1.db.select()
                            .from(schema_1.subscriptionPlans)
                            .where((0, drizzle_orm_1.eq)(schema_1.subscriptionPlans.name, planData.name))
                            .limit(1)];
                case 3:
                    existingPlan = _a.sent();
                    if (existingPlan.length > 0) {
                        console.log("Plan \"".concat(planData.name, "\" already exists, skipping..."));
                        return [3 /*break*/, 5];
                    }
                    return [4 /*yield*/, db_1.db
                            .insert(schema_1.subscriptionPlans)
                            .values(planData)
                            .returning()];
                case 4:
                    createdPlan = (_a.sent())[0];
                    console.log("Created plan: ".concat(createdPlan.name, " (ID: ").concat(createdPlan.id, ")"));
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6:
                    console.log("Subscription plans seeding completed successfully!");
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    console.error("Error seeding subscription plans:", error_1);
                    throw error_1;
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Run the seeding function
seedSubscriptionPlans()
    .then(function () {
    console.log("Seeding finished.");
    process.exit(0);
})
    .catch(function (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
});

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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Ã°Å¸Å’Â± Starting database seeding...');
        const users = [
            {
                name: "Agro Owner",
                email: "owner@agrorent.ai",
                password: "SUPABASE_AUTH_MANAGED",
                role: "OWNER",
                phone: "+919876543210"
            },
            {
                name: "Agro Farmer",
                email: "farmer@agrorent.ai",
                password: "SUPABASE_AUTH_MANAGED",
                role: "FARMER",
                phone: "+919876543211"
            },
            {
                name: "Agro Admin",
                email: "admin@agrorent.ai",
                password: "SUPABASE_AUTH_MANAGED",
                role: "ADMIN",
                phone: "+919876543212"
            }
        ];
        for (const u of users) {
            yield prisma.user.upsert({
                where: { email: u.email },
                update: u,
                create: u,
            });
        }
        console.log('Ã¢Å“â€¦ Database seeded with Secure Users successfully');
    });
}
main()
    .catch((e) => {
    console.error('Ã¢ÂÅ’ Error during seeding:', e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));

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
const prisma_1 = require("../lib/prisma");
function getOtp() {
    return __awaiter(this, void 0, void 0, function* () {
        const email = process.argv[2];
        const otpRecord = yield prisma_1.prisma.oTPVerification.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' }
        });
        if (otpRecord) {
            console.log(`OTP_FOUND:${otpRecord.otp}`);
        }
        else {
            console.log(`OTP_NOT_FOUND`);
        }
        yield prisma_1.prisma.$disconnect();
    });
}
getOtp();
